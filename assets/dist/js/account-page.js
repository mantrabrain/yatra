import { j as jsxRuntimeExports, i as Calendar, h as FileText, l as Plane, ak as ArrowRight, M as MapPin, U as User, v as ChevronRight, aG as Sparkles, P as Package, k as CreditCard, bH as LifeBuoy, bo as Bell, aK as AlertCircle, a$ as CheckCircle2, ai as Clock, av as ExternalLink, ah as Users, o as Mail, b1 as Phone, aR as Download, r as reactExports, u as useQuery, am as CheckCircle, aj as DollarSign, w as React, aV as Eye, ax as PenSquare, aL as XCircle, bI as ShieldCheck, bJ as Heart, L as LayoutDashboard, bK as LogOut, bE as QueryClient, bF as client, bG as QueryClientProvider } from "./react-vendor-CGraIJLZ.js";
import { f as formatYatraMoney, _ as __, h as applyCurrencyPosition, s as sprintf, a as apiClient, A as API_ENDPOINTS, u as useToast, T as ToastProvider } from "./index-Chn65adw.js";
const formatDate = (value) => {
  if (!value) {
    return __("N/A", "yatra");
  }
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return __("Invalid date", "yatra");
    }
    return date.toLocaleDateString(void 0, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch (error) {
    return __("Invalid date", "yatra");
  }
};
function extractYmd(value) {
  if (!value) {
    return null;
  }
  const m = String(value).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}
const formatTravelDateRange = (travelDate, endDate) => {
  const startKey = extractYmd(travelDate);
  const endKey = extractYmd(endDate);
  if (!startKey) {
    return formatDate(travelDate);
  }
  if (!endKey || endKey === startKey) {
    return formatDate(travelDate);
  }
  return sprintf(
    __("%1$s – %2$s", "yatra"),
    formatDate(travelDate),
    formatDate(endDate)
  );
};
const getBadge = (status) => {
  const base = "px-2.5 py-0.5 rounded-full text-xs font-medium";
  if (!status || typeof status !== "string") {
    return `${base} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300`;
  }
  switch (status.toLowerCase()) {
    case "paid":
    case "confirmed":
    case "resolved":
      return `${base} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`;
    case "pending":
    case "partial":
    case "awaiting_response":
      return `${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`;
    case "failed":
    case "cancelled":
      return `${base} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`;
    default:
      return `${base} bg-yatra-chip-bg text-yatra-primary-darker dark:bg-yatra-surface-dark dark:text-yatra-primary-light`;
  }
};
function readPriceConfig() {
  if (typeof window === "undefined") {
    return {
      globalCurrency: "USD",
      currencyPosition: "before",
      decimalPlaces: 2,
      thousandSeparator: ",",
      decimalSeparator: "."
    };
  }
  const w = window;
  const a = w.yatraAdmin || {};
  const p = w.yatraAccountPage || {};
  return {
    globalCurrency: a.currency || p.currency || "USD",
    currencyPosition: a.currencyPosition || a.currency_position || p.currencyPosition || p.currency_position || "before",
    decimalPlaces: Number(a.decimalPlaces ?? p.decimalPlaces ?? 2) || 2,
    thousandSeparator: a.thousandSeparator || p.thousandSeparator || ",",
    decimalSeparator: a.decimalSeparator || p.decimalSeparator || "."
  };
}
const formatPrice = (price) => {
  const {
    globalCurrency,
    currencyPosition,
    decimalPlaces,
    thousandSeparator,
    decimalSeparator
  } = readPriceConfig();
  if (!price || price === 0) {
    return __("Contact for pricing", "yatra");
  }
  const formattedAmount = new Intl.NumberFormat(void 0, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(price).replace(/,/g, "TEMP_THOUSAND").replace(/\./g, decimalSeparator).replace(/TEMP_THOUSAND/g, thousandSeparator);
  const currencySymbol = new Intl.NumberFormat(void 0, {
    style: "currency",
    currency: globalCurrency
  }).format(0).replace(/[\d\s.,]/g, "").trim();
  return applyCurrencyPosition(
    formattedAmount,
    currencySymbol,
    currencyPosition
  );
};
const formatPriceForBooking = (price, currency2) => {
  const cfg = readPriceConfig();
  const globalCurrency = currency2 || cfg.globalCurrency;
  const {
    currencyPosition,
    decimalPlaces,
    thousandSeparator,
    decimalSeparator
  } = cfg;
  const currencyToUse = globalCurrency;
  const numPrice = Number(price) || 0;
  const formattedAmount = new Intl.NumberFormat(void 0, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(numPrice).replace(/,/g, "TEMP_THOUSAND").replace(/\./g, decimalSeparator).replace(/TEMP_THOUSAND/g, thousandSeparator);
  const currencySymbol = new Intl.NumberFormat(void 0, {
    style: "currency",
    currency: currencyToUse
  }).format(0).replace(/[\d\s.,]/g, "").trim();
  return applyCurrencyPosition(
    formattedAmount,
    currencySymbol,
    currencyPosition
  );
};
const currency = (value, currencyCode = "USD") => formatYatraMoney(Number(value) || 0, currencyCode, { zeroAsUnknown: false });
function getYatraAccountPageGlobals() {
  if (typeof window === "undefined") {
    return {
      logoutUrl: "",
      companyPhone: "",
      companyName: "",
      companyEmail: ""
    };
  }
  const p = window.yatraAccountPage;
  const raw = p || {};
  return {
    logoutUrl: String(raw.logoutUrl || "").trim(),
    companyPhone: String(raw.companyPhone || "").trim(),
    companyName: String(raw.companyName || "").trim(),
    companyEmail: String(raw.companyEmail || "").trim()
  };
}
function phoneToTelHref(phone) {
  const t = String(phone).trim();
  if (!t) {
    return "";
  }
  const compact = t.replace(/[^\d+]/g, "");
  return compact ? `tel:${compact}` : `tel:${encodeURIComponent(t)}`;
}
const Dashboard = ({
  bookings,
  payments,
  displayProfile,
  stats,
  notifications,
  conciergePhone = "",
  conciergeEmail = "",
  onSectionChange
}) => {
  var _a;
  const conciergeTel = phoneToTelHref(conciergePhone);
  const conciergeMail = String(conciergeEmail || "").trim();
  const upcomingBookings = bookings.filter((b) => new Date(b.travel_date) > /* @__PURE__ */ new Date()).length > 0 ? bookings.filter((b) => new Date(b.travel_date) > /* @__PURE__ */ new Date()).slice(0, 3) : bookings.filter((b) => new Date(b.travel_date) > /* @__PURE__ */ new Date()).slice(0, 3);
  const recentBookings = bookings.length > 0 ? bookings.slice(0, 2) : [];
  const pendingPayments = payments.filter((p) => p.status === "pending").length > 0 ? payments.filter((p) => p.status === "pending").slice(0, 2) : [];
  const displayNotifications = notifications;
  const enhancedStats = [
    {
      ...stats[0],
      gradient: "from-yatra-primary to-yatra-primary-dark",
      bgColor: "bg-yatra-soft dark:bg-yatra-surface-dark-muted",
      iconColor: "text-yatra-primary dark:text-yatra-on-dark"
    },
    {
      ...stats[1],
      gradient: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      ...stats[2],
      gradient: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      iconColor: "text-amber-600 dark:text-amber-400"
    },
    {
      ...stats[3],
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400"
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "yatra-dashboard-welcome relative overflow-hidden rounded-2xl p-8 shadow-xl",
        style: {
          background: "linear-gradient(135deg, var(--yatra-primary, #3b82f6) 0%, var(--yatra-primary-dark, #2563eb) 45%, var(--yatra-primary-darker, #1e40af) 100%)",
          color: "#ffffff"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "h2",
                {
                  className: "text-lg font-bold mb-2",
                  style: { color: "#ffffff" },
                  children: [
                    __("Welcome back,", "yatra"),
                    " ",
                    ((_a = displayProfile == null ? void 0 : displayProfile.name) == null ? void 0 : _a.split(" ")[0]) || __("Traveler", "yatra"),
                    "! 👋"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm mb-4 text-white/90", children: [
                __("You have", "yatra"),
                " ",
                upcomingBookings.length,
                " ",
                upcomingBookings.length === 1 ? __("upcoming adventure", "yatra") : __("upcoming adventures", "yatra"),
                " ",
                __("coming up", "yatra")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3 mt-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    role: "button",
                    tabIndex: 0,
                    onClick: () => onSectionChange("bookings"),
                    className: "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover:opacity-90 cursor-pointer",
                    style: {
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "#ffffff",
                      backdropFilter: "blur(8px)"
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-4 h-4", style: { color: "#ffffff" } }),
                      __("View Calendar", "yatra")
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    role: "button",
                    tabIndex: 0,
                    onClick: () => onSectionChange("documents"),
                    className: "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover:opacity-90 cursor-pointer",
                    style: {
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "#ffffff",
                      backdropFilter: "blur(8px)"
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4", style: { color: "#ffffff" } }),
                      __("My Documents", "yatra")
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "w-24 h-24 rounded-full flex items-center justify-center",
                style: {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(8px)"
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plane, { className: "w-12 h-12", style: { color: "#ffffff" } })
              }
            ) })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32",
              style: { backgroundColor: "rgba(255, 255, 255, 0.05)" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "absolute bottom-0 left-0 w-48 h-48 rounded-full -ml-24 -mb-24",
              style: { backgroundColor: "rgba(255, 255, 255, 0.05)" }
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-dashboard-stats grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: enhancedStats.map((stat) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `yatra-stat-card yatra-stat-card-${stat.label.toLowerCase().replace(/\s+/g, "-")} group relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-3 rounded-lg ${stat.bgColor}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(stat.icon, { className: `w-6 h-6 ${stat.iconColor}` }) }),
              stat.badge && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex text-xs px-2 py-1 rounded-full bg-yatra-chip-bg text-yatra-primary-dark dark:bg-yatra-surface-dark dark:text-yatra-primary-light font-medium", children: stat.badge })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-1", children: stat.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: stat.value })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity`
            }
          )
        ]
      },
      stat.label
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-dashboard-upcoming-trips lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-dashboard-upcoming-trips-header p-6 border-b border-gray-100 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-5 h-5 text-emerald-600 dark:text-emerald-400" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-gray-900 dark:text-white", children: __("Upcoming Trips", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Your next adventures", "yatra") })
            ] })
          ] }),
          upcomingBookings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              role: "button",
              tabIndex: 0,
              onClick: () => onSectionChange("bookings"),
              className: "text-sm text-yatra-primary dark:text-yatra-on-dark hover:text-yatra-primary-dark dark:hover:text-yatra-primary-light font-medium flex items-center gap-1 transition-colors cursor-pointer",
              children: [
                __("View all", "yatra"),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4" })
              ]
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: upcomingBookings.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: upcomingBookings.map((booking) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "yatra-booking-card yatra-booking-card-upcoming group relative border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-yatra-border-hover dark:hover:border-yatra-border-hover-dark hover:shadow-md transition-all cursor-pointer bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 bg-gradient-to-br from-yatra-primary to-yatra-primary-darker rounded-lg flex items-center justify-center shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-6 h-6 text-white" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2 mb-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark transition-colors", children: booking.trip_title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(booking.booking_status), children: __(booking.booking_status, booking.booking_status) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-4 h-4" }),
                  booking.destination || __("Multiple destinations", "yatra")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3.5 h-3.5" }),
                    formatTravelDateRange(
                      booking.travel_date,
                      booking.end_date
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "w-3.5 h-3.5" }),
                    booking.travelers,
                    " ",
                    booking.travelers === 1 ? __("Traveler", "yatra") : __("Travelers", "yatra")
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-5 h-5 text-gray-400 group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark transition-colors flex-shrink-0" })
            ] })
          },
          booking.id
        )) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-8 h-8 text-gray-400" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 dark:text-gray-400 font-medium mb-1", children: __("No upcoming trips", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 dark:text-gray-500", children: __("Start planning your next adventure!", "yatra") })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-dashboard-quick-actions bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-dashboard-quick-actions-header p-6 border-b border-gray-100 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-5 h-5 text-purple-600 dark:text-purple-400" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-gray-900 dark:text-white", children: __("Quick Actions", "yatra") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                role: "button",
                tabIndex: 0,
                onClick: () => onSectionChange("bookings"),
                className: "w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-yatra-border-hover dark:hover:border-yatra-border-hover-dark hover:bg-yatra-hover-soft dark:hover:bg-yatra-hover-soft-dark transition-all group cursor-pointer text-sm",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "w-5 h-5 text-gray-400 group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-700 dark:text-gray-300 group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark", children: __("View Bookings", "yatra") })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4 text-gray-400 group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                role: "button",
                tabIndex: 0,
                onClick: () => onSectionChange("payments"),
                className: "w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-yatra-border-hover dark:hover:border-yatra-border-hover-dark hover:bg-yatra-hover-soft dark:hover:bg-yatra-hover-soft-dark transition-all group cursor-pointer text-sm",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-5 h-5 text-gray-400 group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-700 dark:text-gray-300 group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark", children: __("Make Payment", "yatra") })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4 text-gray-400 group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                role: "button",
                tabIndex: 0,
                onClick: () => onSectionChange("documents"),
                className: "w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-yatra-border-hover dark:hover:border-yatra-border-hover-dark hover:bg-yatra-hover-soft dark:hover:bg-yatra-hover-soft-dark transition-all group cursor-pointer text-sm",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5 text-gray-400 group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-700 dark:text-gray-300 group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark", children: __("My Documents", "yatra") })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4 text-gray-400 group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark" })
                ]
              }
            ),
            conciergeTel ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "a",
              {
                href: conciergeTel,
                className: "w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-yatra-border-hover dark:hover:border-yatra-border-hover-dark hover:bg-yatra-hover-soft dark:hover:bg-yatra-hover-soft-dark transition-all group cursor-pointer text-sm no-underline text-inherit",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LifeBuoy, { className: "w-5 h-5 text-gray-400 group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-700 dark:text-gray-300 group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark", children: __("Call us", "yatra") })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4 text-gray-400 group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark" })
                ]
              }
            ) : conciergeMail ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "a",
              {
                href: `mailto:${encodeURIComponent(conciergeMail)}`,
                className: "w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-yatra-border-hover dark:hover:border-yatra-border-hover-dark hover:bg-yatra-hover-soft dark:hover:bg-yatra-hover-soft-dark transition-all group cursor-pointer text-sm no-underline text-inherit",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LifeBuoy, { className: "w-5 h-5 text-gray-400 group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-700 dark:text-gray-300 group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark", children: __("Email us", "yatra") })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4 text-gray-400 group-hover:text-yatra-primary dark:group-hover:text-yatra-on-dark" })
                ]
              }
            ) : null
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-dashboard-notifications bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-dashboard-notifications-header p-6 border-b border-gray-100 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "w-5 h-5 text-amber-600 dark:text-amber-400" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-gray-900 dark:text-white", children: __("Notifications", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __("Updates & reminders", "yatra") })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 space-y-3", children: displayNotifications.length > 0 ? displayNotifications.map((notif) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `p-4 rounded-lg border ${notif.type === "warning" ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" : "bg-yatra-soft dark:bg-yatra-hover-soft-dark border-yatra-border-subtle dark:border-yatra-border-dark"}`,
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
                notif.type === "warning" ? /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "w-5 h-5 text-yatra-primary dark:text-yatra-on-dark flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm text-gray-900 dark:text-white mb-1", children: notif.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 leading-relaxed", children: notif.message })
                ] })
              ] })
            },
            notif.id
          )) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 dark:text-gray-500", children: __("No new notifications", "yatra") })
          ] }) })
        ] })
      ] })
    ] }),
    (recentBookings.length > 0 || pendingPayments.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-dashboard-recent-activity bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-dashboard-recent-activity-header p-6 border-b border-gray-100 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-yatra-soft dark:bg-yatra-surface-dark-muted rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-5 h-5 text-yatra-primary dark:text-yatra-on-dark" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-gray-900 dark:text-white", children: __("Recent Activity", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Your latest updates", "yatra") })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        recentBookings.map((booking) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 bg-yatra-chip-bg dark:bg-yatra-surface-dark rounded-full flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "w-5 h-5 text-yatra-primary dark:text-yatra-on-dark" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: [
                  __("Booking confirmed:", "yatra"),
                  " ",
                  booking.trip_title
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: formatDate(booking.booking_date || booking.created_at) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(booking.booking_status), children: __(booking.booking_status, booking.booking_status) })
            ]
          },
          booking.id
        )),
        pendingPayments.map((payment) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-5 h-5 text-amber-600 dark:text-amber-400" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: [
                  __("Payment pending:", "yatra"),
                  " ",
                  currency(payment.amount)
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: formatDate(payment.date) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(payment.status), children: __(payment.status, payment.status) })
            ]
          },
          payment.id
        ))
      ] }) })
    ] })
  ] });
};
function getAccountRestConfig() {
  var _a, _b, _c, _d;
  if (typeof window === "undefined") {
    return { base: "/wp-json/yatra/v1", nonce: "" };
  }
  const w = window;
  const raw = ((_a = w.yatraAccountPage) == null ? void 0 : _a.apiUrl) || ((_b = w.yatraAdmin) == null ? void 0 : _b.apiUrl) || "/wp-json/yatra/v1";
  const base = String(raw).replace(/\/$/, "");
  const nonce = ((_c = w.yatraAccountPage) == null ? void 0 : _c.nonce) || ((_d = w.yatraAdmin) == null ? void 0 : _d.nonce) || "";
  return { base, nonce };
}
function parseYatraRestSubpath(href) {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  try {
    const u = new URL(href, origin);
    const rr = u.searchParams.get("rest_route");
    if (rr) {
      const decoded = decodeURIComponent(rr.replace(/\+/g, " "));
      const idx = decoded.indexOf("/yatra/v1");
      if (idx !== -1) {
        return decoded.slice(idx + "/yatra/v1".length) || decoded;
      }
      return decoded;
    }
    const path = u.pathname || "";
    const marker = "/yatra/v1";
    const pos = path.indexOf(marker);
    if (pos !== -1) {
      return path.slice(pos + marker.length);
    }
  } catch {
  }
  return "";
}
function parsePaymentIdFromHref(href) {
  const sub = parseYatraRestSubpath(href);
  const m = sub.match(/^\/payment\/(\d+)\/invoice(?:\/?|$)/i);
  return m ? parseInt(m[1], 10) : null;
}
function parseBookingDocFromHref(href, kind) {
  const sub = parseYatraRestSubpath(href);
  const re = new RegExp(`^/bookings/(\\d+)/${kind}(?:/?|$)`, "i");
  const m = sub.match(re);
  return m ? parseInt(m[1], 10) : null;
}
function buildBookingDocumentUrl(baseRaw, bookingId, kind, mode = "download") {
  const suffix = `/bookings/${bookingId}/${kind}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  let u;
  try {
    u = new URL(String(baseRaw).trim(), origin);
  } catch {
    const b = String(baseRaw).replace(/\/$/, "");
    const q = mode === "download" ? "?download=1" : "?preview=1";
    return `${b}${suffix}${q}`;
  }
  if (u.searchParams.has("rest_route")) {
    const route = (u.searchParams.get("rest_route") || "").replace(/\/$/, "");
    u.searchParams.set("rest_route", `${route}${suffix}`);
    if (mode === "download") {
      u.searchParams.set("download", "1");
      u.searchParams.delete("preview");
    } else {
      u.searchParams.set("preview", "1");
      u.searchParams.delete("download");
    }
    return u.toString();
  }
  u.pathname = (u.pathname || "").replace(/\/$/, "") + suffix;
  if (mode === "download") {
    u.searchParams.set("download", "1");
    u.searchParams.delete("preview");
  } else {
    u.searchParams.set("preview", "1");
    u.searchParams.delete("download");
  }
  return u.toString();
}
function buildPaymentInvoiceUrl(baseRaw, paymentId, mode) {
  const suffix = `/payment/${paymentId}/invoice`;
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  let u;
  try {
    u = new URL(String(baseRaw).trim(), origin);
  } catch {
    const b = String(baseRaw).replace(/\/$/, "");
    const q = mode === "download" ? "?download=1" : "?preview=1";
    return `${b}${suffix}${q}`;
  }
  if (u.searchParams.has("rest_route")) {
    const route = (u.searchParams.get("rest_route") || "").replace(/\/$/, "");
    u.searchParams.set("rest_route", `${route}${suffix}`);
    if (mode === "download") {
      u.searchParams.set("download", "1");
      u.searchParams.delete("preview");
    } else {
      u.searchParams.set("preview", "1");
      u.searchParams.delete("download");
    }
    return u.toString();
  }
  u.pathname = (u.pathname || "").replace(/\/$/, "") + suffix;
  if (mode === "download") {
    u.searchParams.set("download", "1");
    u.searchParams.delete("preview");
  } else {
    u.searchParams.set("preview", "1");
    u.searchParams.delete("download");
  }
  return u.toString();
}
async function readFetchErrorMessage(res) {
  let msg = res.statusText || __("Request failed", "yatra");
  try {
    const j = await res.json();
    if (j == null ? void 0 : j.message) {
      msg = typeof j.message === "string" ? j.message : msg;
    }
  } catch {
    const t = await res.text().catch(() => "");
    if (t && t.length < 200) {
      msg = t;
    }
  }
  return msg;
}
async function fetchPreviewPdf(url) {
  const { nonce } = getAccountRestConfig();
  if (!nonce) {
    throw new Error(
      __("Missing security token. Reload the account page and try again.", "yatra")
    );
  }
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "X-WP-Nonce": nonce,
      Accept: "application/json"
    }
  });
  if (!res.ok) {
    throw new Error(await readFetchErrorMessage(res));
  }
  const data = await res.json();
  if (!(data == null ? void 0 : data.pdf_data) || typeof data.pdf_data !== "string") {
    throw new Error(
      __("Invalid preview response from the server.", "yatra")
    );
  }
  const binary = atob(data.pdf_data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: "application/pdf" });
}
function openPdfInNewTab(blob) {
  const objectUrl = URL.createObjectURL(blob);
  const win = window.open(objectUrl, "_blank", "noopener,noreferrer");
  if (!win) {
    URL.revokeObjectURL(objectUrl);
    throw new Error(
      __(
        "Popup blocked. Allow popups for this site to preview the PDF.",
        "yatra"
      )
    );
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 6e4);
}
async function downloadBookingBinary(bookingId, kind) {
  const { base, nonce } = getAccountRestConfig();
  if (!nonce) {
    throw new Error(
      __("Missing security token. Reload the account page and try again.", "yatra")
    );
  }
  const url = buildBookingDocumentUrl(base, bookingId, kind, "download");
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "X-WP-Nonce": nonce,
      Accept: "application/pdf, application/octet-stream, */*"
    }
  });
  if (!res.ok) {
    throw new Error(await readFetchErrorMessage(res));
  }
  const blob = await res.blob();
  const dispo = res.headers.get("Content-Disposition");
  let filename = `${kind}-${bookingId}.pdf`;
  if (dispo) {
    const m = /filename\*?=(?:UTF-8'')?["']?([^";\n]+)/i.exec(dispo);
    if (m == null ? void 0 : m[1]) {
      try {
        filename = decodeURIComponent(m[1].replace(/['"]/g, "").trim());
      } catch {
        filename = m[1].replace(/['"]/g, "").trim();
      }
    }
  }
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}
async function downloadPaymentInvoiceBinary(paymentId) {
  const { base, nonce } = getAccountRestConfig();
  if (!nonce) {
    throw new Error(
      __("Missing security token. Reload the account page and try again.", "yatra")
    );
  }
  const url = buildPaymentInvoiceUrl(base, paymentId, "download");
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "X-WP-Nonce": nonce,
      Accept: "application/pdf, application/octet-stream, */*"
    }
  });
  if (!res.ok) {
    throw new Error(await readFetchErrorMessage(res));
  }
  const blob = await res.blob();
  const dispo = res.headers.get("Content-Disposition");
  let filename = `invoice-${paymentId}.pdf`;
  if (dispo) {
    const m = /filename\*?=(?:UTF-8'')?["']?([^";\n]+)/i.exec(dispo);
    if (m == null ? void 0 : m[1]) {
      try {
        filename = decodeURIComponent(m[1].replace(/['"]/g, "").trim());
      } catch {
        filename = m[1].replace(/['"]/g, "").trim();
      }
    }
  }
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}
const downloadDocument = async (options) => {
  if (options.documentType === "downloads" && options.fallbackUrl) {
    window.open(options.fallbackUrl, "_blank", "noopener,noreferrer");
    return;
  }
  if (options.documentType === "invoice") {
    const pid = options.paymentId ?? parsePaymentIdFromHref(options.fallbackUrl || "");
    if (pid) {
      await downloadPaymentInvoiceBinary(pid);
      return;
    }
  }
  if (options.documentType === "voucher" || options.documentType === "itinerary") {
    const kind = options.documentType === "voucher" ? "voucher" : "itinerary";
    const bid = options.bookingId ?? parseBookingDocFromHref(options.fallbackUrl || "", kind);
    if (bid) {
      await downloadBookingBinary(bid, kind);
      return;
    }
  }
  if (options.bookingId && options.documentType === "all") {
    await downloadBookingBinary(options.bookingId, "voucher");
    return;
  }
  console.error(`No handler for document type: ${options.documentType}`);
};
const downloadVoucher = (bookingId) => downloadBookingBinary(bookingId, "voucher");
const downloadInvoice = (paymentId) => downloadPaymentInvoiceBinary(paymentId);
const previewPaymentInvoice = async (paymentId) => {
  const { base, nonce } = getAccountRestConfig();
  if (!nonce) {
    throw new Error(
      __("Missing security token. Reload the account page and try again.", "yatra")
    );
  }
  const url = buildPaymentInvoiceUrl(base, paymentId, "preview");
  const blob = await fetchPreviewPdf(url);
  openPdfInNewTab(blob);
};
async function previewTravelDocument(doc) {
  const { base, nonce } = getAccountRestConfig();
  if (!nonce) {
    throw new Error(
      __("Missing security token. Reload the account page and try again.", "yatra")
    );
  }
  if (doc.category === "invoice") {
    const pid = doc.payment_id ?? parsePaymentIdFromHref(doc.url);
    if (!pid) {
      throw new Error(
        __("Could not resolve invoice link.", "yatra")
      );
    }
    const url = buildPaymentInvoiceUrl(base, pid, "preview");
    const blob = await fetchPreviewPdf(url);
    openPdfInNewTab(blob);
    return;
  }
  if (doc.category === "voucher" || doc.category === "itinerary") {
    const kind = doc.category === "voucher" ? "voucher" : "itinerary";
    const bid = doc.booking_id ?? parseBookingDocFromHref(doc.url, kind);
    if (!bid) {
      throw new Error(
        __("Could not resolve document link.", "yatra")
      );
    }
    const url = buildBookingDocumentUrl(base, bid, kind, "preview");
    const blob = await fetchPreviewPdf(url);
    openPdfInNewTab(blob);
    return;
  }
  window.open(doc.url, "_blank", "noopener,noreferrer");
}
const getCountryName = (code) => {
  if (!code || typeof code !== "string") {
    return "";
  }
  const upperCode = code.trim().toUpperCase();
  if (upperCode.length !== 2) {
    return code;
  }
  try {
    const display = new Intl.DisplayNames(void 0, { type: "region" });
    const name = display.of(upperCode);
    return name && name !== upperCode ? name : code;
  } catch {
    return code;
  }
};
const BookingDetails = ({
  booking,
  isLoading,
  onBack
}) => {
  var _a;
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: __("Booking Details", "yatra") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            role: "button",
            tabIndex: 0,
            onClick: onBack,
            className: "inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4 rotate-180" }),
              __("Back to Bookings", "yatra")
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-pulse space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" })
      ] }) })
    ] });
  }
  if (!booking) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: __("Booking Details", "yatra") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            role: "button",
            tabIndex: 0,
            onClick: onBack,
            className: "inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4 rotate-180" }),
              __("Back to Bookings", "yatra")
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6 text-center text-red-500", children: __("Booking not found or error loading booking", "yatra") })
    ] });
  }
  const normalizeRecord = (value) => {
    if (!value) return null;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
          return parsed;
      } catch {
        return null;
      }
      return null;
    }
    if (typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
    return null;
  };
  const emergencyContact = normalizeRecord(booking.emergency_contact);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: __("Booking Details", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __("Complete booking information", "yatra") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          role: "button",
          tabIndex: 0,
          onClick: onBack,
          className: "inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4 rotate-180" }),
            __("Back to Bookings", "yatra")
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Booking Overview", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(booking.booking_status), children: __(
                booking.booking_status || "pending",
                booking.booking_status || "pending"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(booking.payment_status), children: __(
                booking.payment_status || "pending",
                booking.payment_status || "pending"
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Booking Number", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: booking.booking_number || `#${booking.id}` })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Trip", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: booking.trip_title }),
              booking.trip_url ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: booking.trip_url,
                  className: "mt-2 inline-flex items-center gap-2 text-sm text-yatra-primary dark:text-yatra-on-dark hover:underline",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-4 h-4" }),
                    __("View Trip", "yatra")
                  ]
                }
              ) : null
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3 h-3" }),
                __("Booking Date", "yatra")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatDate(booking.booking_date || booking.created_at) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3 h-3" }),
                __("Travel Date", "yatra")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatTravelDateRange(
                booking.travel_date,
                booking.end_date
              ) })
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
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: __("Gross Total", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: formatPriceForBooking(
                  booking.subtotal || booking.total_amount,
                  booking.currency
                ) })
              ] }),
              typeof booking.taxable_amount === "number" && booking.taxable_amount > 0 && (booking.tax_amount > 0 || ((_a = booking.tax_breakdown) == null ? void 0 : _a.length) > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm font-medium", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: __("Subtotal (Taxable Amount)", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: formatPriceForBooking(
                  booking.taxable_amount,
                  booking.currency
                ) })
              ] }),
              booking.discount_amount && booking.discount_amount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: __("Discount", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-green-600 dark:text-green-400", children: [
                  "-",
                  formatPriceForBooking(
                    booking.discount_amount,
                    booking.currency
                  )
                ] })
              ] }),
              booking.itinerary_costs && booking.itinerary_costs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-between text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400 font-medium", children: __("Itinerary Costs", "yatra") }) }),
                booking.itinerary_costs.map((cost, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "flex justify-between text-sm ml-4",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-600 dark:text-gray-400", children: [
                        cost.name,
                        cost.price_per === "person" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-500 dark:text-gray-500 ml-1", children: [
                          "(",
                          __("per person", "yatra"),
                          ")"
                        ] }),
                        cost.price_per === "group" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-500 dark:text-gray-500 ml-1", children: [
                          "(",
                          __("per booking", "yatra"),
                          ")"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: formatPriceForBooking(
                        cost.total_cost,
                        booking.currency
                      ) })
                    ]
                  },
                  index
                ))
              ] }),
              booking.tax_amount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: (() => {
                const taxBreakdown = booking.tax_breakdown;
                if (Array.isArray(taxBreakdown) && taxBreakdown.length > 0) {
                  return taxBreakdown.map((tax, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: "flex justify-between text-sm",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-600 dark:text-gray-400", children: [
                          tax.name,
                          " (",
                          tax.rate,
                          "%)"
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: formatPriceForBooking(
                          tax.amount,
                          booking.currency
                        ) })
                      ]
                    },
                    index
                  ));
                }
                const taxDetails = booking.tax_details;
                if (taxDetails) {
                  try {
                    const taxes = typeof taxDetails === "string" ? JSON.parse(taxDetails) : taxDetails;
                    if (Array.isArray(taxes) && taxes.length > 0) {
                      return taxes.map((tax, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "div",
                        {
                          className: "flex justify-between text-sm",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-600 dark:text-gray-400", children: [
                              tax.name,
                              " (",
                              tax.rate,
                              "%)"
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: formatPriceForBooking(
                              tax.amount,
                              booking.currency
                            ) })
                          ]
                        },
                        index
                      ));
                    }
                  } catch (e) {
                    console.error("Failed to parse tax_details:", e);
                  }
                }
                if (booking.tax_amount > 0) {
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-600 dark:text-gray-400", children: [
                      __("Tax", "yatra"),
                      " (",
                      booking.tax_rate,
                      "%)"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: formatPriceForBooking(
                      booking.tax_amount,
                      booking.currency
                    ) })
                  ] });
                }
                return null;
              })() }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-base font-semibold pt-2 border-t border-gray-200 dark:border-gray-700", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: __("Net Amount", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: formatPriceForBooking(
                  booking.total_amount,
                  booking.currency
                ) })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: __("Customer Information", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white mb-1", children: booking.customer_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400", children: [
              booking.customer_email && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
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
        booking.travelers_data && booking.travelers_data.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-5 h-5" }),
            __("Travelers Information", "yatra"),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-normal text-gray-500 dark:text-gray-400", children: [
              "(",
              booking.travelers_data.length,
              " ",
              booking.travelers_data.length === 1 ? __("traveler", "yatra") : __("travelers", "yatra"),
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: booking.travelers_data.map((traveler, index) => {
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
                className: `p-4 rounded-lg ${index === 0 ? "bg-yatra-soft dark:bg-yatra-surface-dark-muted border border-yatra-border-subtle dark:border-yatra-border-dark" : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`,
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
                    index === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs bg-yatra-chip-bg text-yatra-primary-dark dark:bg-yatra-surface-dark dark:text-yatra-primary-light px-2 py-0.5 rounded", children: __("Primary Contact", "yatra") })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: travelerEntries.map(([fieldId, fieldValue]) => {
                    if (fieldId === "first_name" || fieldId === "last_name")
                      return null;
                    const label = fieldId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                    let displayValue = String(fieldValue);
                    if (fieldId.includes("date") || fieldId.includes("expiry")) {
                      try {
                        displayValue = formatDate(fieldValue);
                      } catch {
                        displayValue = String(fieldValue);
                      }
                    }
                    if ((fieldId === "nationality" || fieldId === "country") && fieldValue && typeof fieldValue === "string" && fieldValue.length === 2) {
                      displayValue = getCountryName(fieldValue);
                    }
                    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mb-0.5", children: label }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          className: `text-sm text-gray-900 dark:text-white ${fieldId === "passport" ? "font-mono" : ""}`,
                          children: displayValue
                        }
                      )
                    ] }, fieldId);
                  }) })
                ]
              },
              index
            );
          }) })
        ] }),
        emergencyContact && Object.values(emergencyContact).some(
          (v) => v && String(v).trim() !== ""
        ) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-5 h-5" }),
            __("Emergency Contact", "yatra")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: Object.entries(emergencyContact).filter(
            ([_, value]) => value && String(value).trim() !== ""
          ).map(([fieldId, fieldValue]) => {
            const label = fieldId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mb-0.5", children: label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: String(fieldValue) })
            ] }, fieldId);
          }) })
        ] }),
        booking.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5" }),
            __("Special Requests", "yatra")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap", children: booking.notes })
        ] }),
        Array.isArray(booking.downloads) && booking.downloads.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-5 h-5" }),
            __("Downloads", "yatra")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: booking.downloads.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white truncate", children: d.title }),
                  d.access_label ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: d.access_label }) : null,
                  d.locked && d.locked_reason ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-amber-700 dark:text-amber-300 mt-1", children: d.locked_reason }) : null
                ] }),
                d.locked || !d.url ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium cursor-not-allowed", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4" }),
                  __("Not Available", "yatra")
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "a",
                  {
                    href: d.url,
                    target: "_blank",
                    rel: "noreferrer",
                    className: "inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-yatra-primary text-white hover:bg-yatra-primary-dark transition-colors text-sm font-medium",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4" }),
                      __("Download", "yatra")
                    ]
                  }
                )
              ]
            },
            d.id
          )) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: __("Payment Information", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Payment Status", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(booking.payment_status), children: __(
                booking.payment_status || "pending",
                booking.payment_status || "pending"
              ) }) })
            ] }),
            booking.payment_method && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-3 h-3" }),
                __("Payment Method", "yatra")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: booking.payment_method })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Total Amount", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: formatPriceForBooking(
                booking.total_amount,
                booking.currency
              ) })
            ] }),
            booking.amount_paid > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Amount Paid", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatPriceForBooking(
                booking.amount_paid,
                booking.currency
              ) })
            ] }),
            booking.amount_due > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Amount Due", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-amber-600 dark:text-amber-400", children: formatPriceForBooking(
                booking.amount_due,
                booking.currency
              ) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: __("Timeline", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Created", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatDate(booking.created_at || booking.booking_date) })
            ] }),
            booking.updated_at && booking.updated_at !== booking.created_at && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Last Updated", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatDate(booking.updated_at) })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
};
const Bookings = ({
  bookings,
  conciergePhone = "",
  conciergeEmail = "",
  onSectionChange
}) => {
  const conciergeTel = phoneToTelHref(conciergePhone);
  const conciergeMail = String(conciergeEmail || "").trim();
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [bookingFilter, setBookingFilter] = reactExports.useState("all");
  const [selectedBookingId, setSelectedBookingId] = reactExports.useState(
    null
  );
  const [payLoading, setPayLoading] = reactExports.useState(null);
  const {
    data: bookingDetailsData,
    isPending: isBookingDetailLoading,
    isError: isBookingDetailError
  } = useQuery({
    queryKey: ["booking-details", selectedBookingId],
    queryFn: async () => {
      if (!selectedBookingId) return null;
      const response = await apiClient.get(
        API_ENDPOINTS.CUSTOMER_MY_BOOKING(selectedBookingId)
      );
      const inner = response && typeof response === "object" && "data" in response && response.data && typeof response.data === "object" ? response.data : response;
      return inner;
    },
    enabled: !!selectedBookingId
  });
  const handleBookingSelect = (bookingId) => {
    setSelectedBookingId(bookingId);
  };
  const handleBackToList = () => {
    setSelectedBookingId(null);
  };
  const handleDownloadClick = async (bookingId) => {
    try {
      await downloadVoucher(bookingId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : __("Download failed.", "yatra");
      window.alert(msg);
    }
  };
  const startRemainingPaymentSession = async (bookingId) => {
    setPayLoading(bookingId);
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.PAYMENT_REMAINING_SESSION,
        { booking_id: bookingId }
      );
      const payload = response && typeof response === "object" && "data" in response && response.data && typeof response.data === "object" ? response.data : response;
      const checkoutUrl = payload && typeof payload === "object" && "checkout_url" in payload && typeof payload.checkout_url === "string" ? payload.checkout_url : "";
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        window.alert(__("Could not start payment. Please try again.", "yatra"));
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      const msg = error instanceof Error && error.message ? error.message : __("Could not start payment.", "yatra");
      window.alert(msg);
    } finally {
      setPayLoading(null);
    }
  };
  if (selectedBookingId) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      BookingDetails,
      {
        booking: isBookingDetailLoading || isBookingDetailError ? null : bookingDetailsData,
        isLoading: isBookingDetailLoading,
        onBack: handleBackToList
      }
    );
  }
  const displayBookings = bookings;
  let filteredDisplayBookings = displayBookings;
  if (bookingFilter === "upcoming") {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    filteredDisplayBookings = filteredDisplayBookings.filter((b) => {
      const travelDate = new Date(b.travel_date);
      return travelDate >= today;
    });
  } else if (bookingFilter === "pending") {
    filteredDisplayBookings = filteredDisplayBookings.filter(
      (b) => b.payment_status === "pending" || b.booking_status === "pending"
    );
  } else if (bookingFilter === "completed") {
    filteredDisplayBookings = filteredDisplayBookings.filter(
      (b) => b.booking_status === "completed"
    );
  }
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase().trim();
    filteredDisplayBookings = filteredDisplayBookings.filter(
      (b) => b.trip_title && b.trip_title.toLowerCase().includes(searchLower) || b.booking_number && b.booking_number.toLowerCase().includes(searchLower) || b.destination && b.destination.toLowerCase().includes(searchLower) || b.payment_status && b.payment_status.toLowerCase().includes(searchLower) || b.booking_status && b.booking_status.toLowerCase().includes(searchLower)
    );
  }
  const bookingStats = {
    total: displayBookings.length,
    upcoming: displayBookings.filter(
      (b) => new Date(b.travel_date) >= /* @__PURE__ */ new Date()
    ).length,
    pending: displayBookings.filter(
      (b) => b.payment_status === "pending" || b.booking_status === "pending"
    ).length,
    completed: displayBookings.filter((b) => b.booking_status === "completed").length,
    totalSpent: displayBookings.reduce((sum, b) => sum + b.total_amount, 0)
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-bookings-page space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-bookings-header bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold text-gray-900 dark:text-white", children: __("Bookings", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-2", children: __("Manage and view all your travel bookings", "yatra") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            placeholder: __("Search bookings...", "yatra"),
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "w-full lg:w-64 pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yatra-primary focus:border-transparent"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: bookingFilter,
            onChange: (e) => setBookingFilter(
              e.target.value
            ),
            className: "appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yatra-primary focus:border-transparent cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: __("All Bookings", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "upcoming", children: __("Upcoming", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pending", children: __("Pending", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "completed", children: __("Completed", "yatra") })
            ]
          }
        ) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-nowrap gap-6 overflow-x-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Total Bookings", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: bookingStats.total })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-yatra-soft dark:bg-yatra-surface-dark-muted rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "w-5 h-5 text-yatra-primary dark:text-yatra-on-dark" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Upcoming", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-emerald-600 dark:text-emerald-400", children: bookingStats.upcoming })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-5 h-5 text-emerald-600 dark:text-emerald-400" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Pending", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-amber-600 dark:text-amber-400", children: bookingStats.pending })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-5 h-5 text-amber-600 dark:text-amber-400" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Completed", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-600 dark:text-gray-400", children: bookingStats.completed })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-gray-50 dark:bg-gray-700 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-5 h-5 text-gray-600 dark:text-gray-400" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Total Spent", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: currency(bookingStats.totalSpent) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "w-5 h-5 text-purple-600 dark:text-purple-400" }) })
      ] }) })
    ] }),
    filteredDisplayBookings.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 dark:text-gray-400 font-medium mb-1", children: __("No bookings found", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 dark:text-gray-500", children: __("Try adjusting your filters or check back later.", "yatra") })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: filteredDisplayBookings.map((booking) => {
      const bookingId = Number(booking.id);
      const isUpcoming = new Date(booking.travel_date) > /* @__PURE__ */ new Date();
      const isCompleted = booking.booking_status === "completed";
      const paidNumeric = typeof booking.amount_paid === "number" ? booking.amount_paid : parseFloat(booking.amount_paid || "0");
      const totalNumeric = typeof booking.total_amount === "number" ? booking.total_amount : parseFloat(booking.total_amount || "0");
      const totalPaid = paidNumeric;
      const amountDue = totalNumeric - totalPaid;
      const canPayRemaining = amountDue > 0 && booking.payment_status !== "paid";
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: `p-2 rounded-lg ${isUpcoming ? "bg-emerald-50 dark:bg-emerald-900/20" : isCompleted ? "bg-gray-50 dark:bg-gray-700" : "bg-amber-50 dark:bg-amber-900/20"}`,
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      MapPin,
                      {
                        className: `w-5 h-5 ${isUpcoming ? "text-emerald-600 dark:text-emerald-400" : isCompleted ? "text-gray-400" : "text-amber-600 dark:text-amber-400"}`
                      }
                    )
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium mb-1", children: booking.booking_number }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-bold text-gray-900 dark:text-white mb-1", children: booking.trip_title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-4 h-4 text-gray-600 dark:text-gray-400" }),
                    booking.destination || __("Multiple destinations", "yatra")
                  ] })
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 items-start", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(booking.booking_status), children: __(booking.booking_status, booking.booking_status) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(booking.payment_status), children: __(booking.payment_status, booking.payment_status) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-booking-details grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Travel Date", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: formatTravelDateRange(
                  booking.travel_date,
                  booking.end_date
                ) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Travelers", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: booking.travelers })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Total Amount", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: currency(booking.total_amount) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Paid / Due", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: [
                  currency(totalPaid ?? 0),
                  amountDue !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-normal text-gray-500 dark:text-gray-400 ml-1", children: [
                    __("Due:", "yatra"),
                    " ",
                    currency(amountDue)
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Booked On", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: formatDate(booking.booking_date || booking.created_at) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-booking-actions flex flex-wrap gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  role: "button",
                  tabIndex: 0,
                  onClick: () => handleBookingSelect(bookingId),
                  className: "yatra-booking-action yatra-booking-action-view inline-flex items-center px-4 py-2 rounded-lg bg-yatra-primary text-white hover:bg-yatra-primary-dark transition-colors text-sm font-medium cursor-pointer",
                  children: __("View Details", "yatra")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  role: "button",
                  tabIndex: 0,
                  onClick: () => handleDownloadClick(bookingId),
                  className: "yatra-booking-action yatra-booking-action-download inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer",
                  children: __("Download Voucher", "yatra")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  role: "button",
                  tabIndex: 0,
                  onClick: () => onSectionChange("payments"),
                  className: "yatra-booking-action yatra-booking-action-payment inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer",
                  children: __("Payment", "yatra")
                }
              ),
              canPayRemaining && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => bookingId && startRemainingPaymentSession(bookingId),
                  disabled: payLoading === bookingId,
                  className: "yatra-booking-action inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50",
                  children: [
                    payLoading === bookingId ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "svg",
                      {
                        className: "w-4 h-4 animate-spin",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "circle",
                            {
                              cx: "12",
                              cy: "12",
                              r: "10",
                              strokeOpacity: "0.25"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 12a8 8 0 0 1 8-8" })
                        ]
                      }
                    ) : null,
                    __("Pay Remaining Balance", "yatra")
                  ]
                }
              ),
              conciergeTel ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  href: conciergeTel,
                  className: "yatra-booking-action yatra-booking-action-support inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium no-underline",
                  children: __("Call us", "yatra")
                }
              ) : conciergeMail ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  href: `mailto:${encodeURIComponent(conciergeMail)}`,
                  className: "yatra-booking-action yatra-booking-action-support inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium no-underline",
                  children: __("Email us", "yatra")
                }
              ) : null
            ] })
          ] })
        },
        booking.id
      );
    }) })
  ] });
};
function paymentTypeLabel(type) {
  switch (type) {
    case "deposit":
      return __("Deposit", "yatra");
    case "balance":
      return __("Balance", "yatra");
    case "installment":
      return __("Installment", "yatra");
    default:
      return type;
  }
}
const Payments = ({ payments, onSectionChange }) => {
  const displayPayments = payments;
  const bookingSummaries = React.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    displayPayments.forEach((payment) => {
      if (typeof payment.booking_id !== "number") {
        return;
      }
      const total = typeof payment.booking_total_amount === "number" ? payment.booking_total_amount : null;
      const dueValue = typeof payment.booking_amount_due === "number" ? payment.booking_amount_due : null;
      const paidValue = typeof payment.booking_amount_paid === "number" ? payment.booking_amount_paid : null;
      const paid = paidValue ?? (total !== null && dueValue !== null ? total - dueValue : null);
      const due = dueValue ?? (total !== null && paid !== null ? total - paid : null);
      const existing = map.get(payment.booking_id);
      const summary = {
        total: total ?? (existing == null ? void 0 : existing.total) ?? 0,
        paid: paid ?? (existing == null ? void 0 : existing.paid) ?? 0,
        due: due ?? (existing == null ? void 0 : existing.due) ?? 0
      };
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
        paidBookings: 0
      }
    );
    return {
      total: displayPayments.length,
      paid: totals.paidBookings,
      pending: totals.pendingBookings,
      totalPaidAmount: totals.paidAmount,
      outstandingAmount: totals.outstanding
    };
  }, [displayPayments, bookingSummaries]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-payments-page space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-payments-header bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-6 h-6 text-emerald-600 dark:text-emerald-400" }) }),
        __("Payments & Invoices", "yatra")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-2", children: __(
        "Track deposits, balances, and installment schedules with secure payment links.",
        "yatra"
      ) })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-payments-stats grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-payment-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Total Payments", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: paymentStats.total })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-yatra-soft dark:bg-yatra-surface-dark-muted rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-5 h-5 text-yatra-primary dark:text-yatra-on-dark" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-payment-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Paid", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-emerald-600 dark:text-emerald-400", children: paymentStats.paid }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 dark:text-gray-500", children: currency(paymentStats.totalPaidAmount) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-5 h-5 text-emerald-600 dark:text-emerald-400" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-payment-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Pending", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-amber-600 dark:text-amber-400", children: paymentStats.pending })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-5 h-5 text-amber-600 dark:text-amber-400" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-payment-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Outstanding", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: currency(paymentStats.outstandingAmount) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "w-5 h-5 text-purple-600 dark:text-purple-400" }) })
      ] }) })
    ] }),
    displayPayments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 dark:text-gray-400 font-medium mb-1", children: __("No payments found", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 dark:text-gray-500", children: __(
        "Payment history will appear here once you make a booking.",
        "yatra"
      ) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: displayPayments.map((payment) => {
      const bookingTotal = typeof payment.booking_total_amount === "number" ? payment.booking_total_amount : null;
      const bookingPaid = typeof payment.booking_amount_paid === "number" ? payment.booking_amount_paid : null;
      const bookingDue = typeof payment.booking_amount_due === "number" ? payment.booking_amount_due : null;
      const total = bookingTotal ?? payment.amount;
      const paid = bookingPaid ?? (bookingDue !== null && bookingTotal !== null ? bookingTotal - bookingDue : payment.amount);
      const dueRaw = bookingDue ?? (bookingTotal !== null ? bookingTotal - paid : total - paid);
      const due = Math.max(0, dueRaw || 0);
      const canPayRemaining = typeof payment.booking_id === "number" && due > 0.01;
      const isPaid = payment.status === "paid" || payment.status === "completed";
      const isPending = payment.status === "pending";
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: `p-2 rounded-lg ${payment.status === "paid" ? "bg-emerald-50 dark:bg-emerald-900/20" : payment.status === "pending" ? "bg-amber-50 dark:bg-amber-900/20" : "bg-gray-50 dark:bg-gray-700"}`,
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      CreditCard,
                      {
                        className: `w-5 h-5 ${payment.status === "paid" ? "text-emerald-600 dark:text-emerald-400" : payment.status === "pending" ? "text-amber-600 dark:text-amber-400" : "text-gray-400"}`
                      }
                    )
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium mb-1", children: payment.reference }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-base font-bold text-gray-900 dark:text-white mb-1", children: [
                    __("Booking", "yatra"),
                    ": ",
                    payment.booking_number
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-4 h-4" }),
                    formatDate(payment.date)
                  ] })
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 items-start", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(payment.status), children: __(payment.status, payment.status) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-3 py-1 rounded-lg text-xs font-medium bg-yatra-soft dark:bg-yatra-surface-dark-muted text-yatra-primary-dark dark:text-yatra-primary-light capitalize", children: paymentTypeLabel(payment.type) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-payment-details grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "w-3.5 h-3.5" }),
                  __("Amount", "yatra")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: currency(payment.amount) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-3.5 h-3.5" }),
                  __("Payment Method", "yatra")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: payment.method })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3.5 h-3.5" }),
                  __("Payment Date", "yatra")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: formatDate(payment.date) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-payment-actions flex flex-wrap gap-3", children: [
              isPaid && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: async () => {
                    try {
                      await downloadInvoice(payment.id);
                    } catch (err) {
                      alert(
                        err instanceof Error ? err.message : __("Download failed.", "yatra")
                      );
                    }
                  },
                  className: "yatra-payment-action yatra-payment-action-invoice inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  style: { backgroundColor: "#059669", color: "#ffffff" },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4" }),
                    __("Download Invoice", "yatra")
                  ]
                }
              ),
              isPaid && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: async () => {
                    try {
                      await previewPaymentInvoice(payment.id);
                    } catch (err) {
                      alert(
                        err instanceof Error ? err.message : __("Could not open receipt.", "yatra")
                      );
                    }
                  },
                  className: "yatra-payment-action yatra-payment-action-receipt inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  style: {
                    backgroundColor: "var(--yatra-primary-dark, #2563eb)",
                    color: "#ffffff"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4" }),
                    __("View Receipt", "yatra")
                  ]
                }
              ),
              isPending && !canPayRemaining && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  className: "yatra-payment-action inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-4 h-4" }),
                    __("Pending approval", "yatra")
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => onSectionChange("bookings"),
                  className: "yatra-payment-action yatra-payment-action-booking inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4" }),
                    __("View Booking Details", "yatra")
                  ]
                }
              )
            ] })
          ] })
        },
        payment.id
      );
    }) })
  ] });
};
function documentCategoryLabel(category) {
  switch (category) {
    case "itinerary":
      return __("Itinerary", "yatra");
    case "voucher":
      return __("Voucher", "yatra");
    case "invoice":
      return __("Invoice", "yatra");
    case "downloads":
      return __("Downloads", "yatra");
    default:
      return category;
  }
}
const Documents = ({ documents }) => {
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [selectedCategory, setSelectedCategory] = reactExports.useState("all");
  const displayDocuments = documents;
  let filteredDocuments = [...displayDocuments];
  if (selectedCategory !== "all") {
    filteredDocuments = filteredDocuments.filter(
      (d) => d.category === selectedCategory
    );
  }
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase().trim();
    filteredDocuments = filteredDocuments.filter((d) => {
      const name = d.name || "";
      const tripTitle = d.trip_title || "";
      const category = d.category || "";
      return name.toLowerCase().includes(searchLower) || tripTitle.toLowerCase().includes(searchLower) || category.toLowerCase().includes(searchLower);
    });
  }
  const documentsByCategory = {
    itinerary: filteredDocuments.filter((d) => d.category === "itinerary"),
    voucher: filteredDocuments.filter((d) => d.category === "voucher"),
    invoice: filteredDocuments.filter((d) => d.category === "invoice"),
    downloads: filteredDocuments.filter((d) => d.category === "downloads")
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-documents-page space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-documents-header bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold text-gray-900 dark:text-white", children: __("Travel Documents", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-2", children: __(
          "Download itineraries, vouchers, invoices, and other documents for each trip.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            placeholder: __("Search documents...", "yatra"),
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "w-full lg:w-64 pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: selectedCategory,
            onChange: (e) => setSelectedCategory(
              e.target.value
            ),
            className: "appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: __("All Documents", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "itinerary", children: __("Itineraries", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "voucher", children: __("Vouchers", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "invoice", children: __("Invoices", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "downloads", children: __("Downloads", "yatra") })
            ]
          }
        ) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-documents-stats flex flex-nowrap gap-6 overflow-x-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Itinerary", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-yatra-primary dark:text-yatra-on-dark", children: documentsByCategory.itinerary.length })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Voucher", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-emerald-600 dark:text-emerald-400", children: documentsByCategory.voucher.length })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Invoice", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-purple-600 dark:text-purple-400", children: documentsByCategory.invoice.length })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Downloads", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-amber-600 dark:text-amber-400", children: documentsByCategory.downloads.length })
      ] }) })
    ] }),
    filteredDocuments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 dark:text-gray-400 font-medium mb-1", children: __("No documents found", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 dark:text-gray-500", children: __(
        "No documents are available yet. Please check back later.",
        "yatra"
      ) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: filteredDocuments.map((doc) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: doc.trip_title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-bold text-gray-900 dark:text-white mb-1 truncate", children: doc.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: [
                __("Updated", "yatra"),
                ": ",
                formatDate(doc.updated_at)
              ] }),
              doc.category === "downloads" && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-2", children: [
                __("Access", "yatra"),
                ":",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-700 dark:text-gray-300", children: doc.access_label || doc.access || "-" }),
                doc.locked && doc.locked_reason ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-amber-700 dark:text-amber-300", children: [
                  "(",
                  doc.locked_reason,
                  ")"
                ] }) : null
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [
              doc.category === "downloads" && doc.access_label && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-3 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800", children: doc.access_label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize", children: documentCategoryLabel(doc.category) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-document-actions flex flex-wrap gap-3 mt-4", children: [
            doc.locked || !doc.url ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "inline-flex items-center px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors text-sm font-medium cursor-not-allowed",
                title: doc.locked_reason || __("Not available", "yatra"),
                children: __("Not Available", "yatra")
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: async () => {
                  try {
                    await downloadDocument({
                      bookingId: doc.booking_id,
                      paymentId: doc.payment_id,
                      documentType: doc.category,
                      fallbackUrl: doc.url
                    });
                  } catch (err) {
                    alert(
                      err instanceof Error ? err.message : __("Download failed.", "yatra")
                    );
                  }
                },
                className: "yatra-document-action yatra-document-action-download inline-flex items-center px-4 py-2 rounded-lg bg-yatra-primary text-white hover:bg-yatra-primary-dark transition-colors text-sm font-medium",
                children: __("Download", "yatra")
              }
            ),
            doc.url ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: async () => {
                  try {
                    await previewTravelDocument(doc);
                  } catch (err) {
                    alert(
                      err instanceof Error ? err.message : __("Preview failed.", "yatra")
                    );
                  }
                },
                className: "yatra-document-action yatra-document-action-preview inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium",
                children: __("Preview", "yatra")
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-500 text-sm font-medium cursor-not-allowed", children: __("Preview", "yatra") })
          ] })
        ] }) }) })
      },
      doc.id
    )) })
  ] });
};
const Profile = ({
  profile,
  savedTrips,
  wishlistEnabled = false
}) => {
  const [isEditing, setIsEditing] = reactExports.useState(false);
  const [formData, setFormData] = reactExports.useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: ""
  });
  const [isChangingPassword, setIsChangingPassword] = reactExports.useState(false);
  const [passwordData, setPasswordData] = reactExports.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  reactExports.useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        country: profile.country || ""
      });
    }
  }, [profile, isEditing]);
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handleSave = () => {
    setIsEditing(false);
  };
  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        country: profile.country || ""
      });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-page space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-profile-header bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-yatra-soft dark:bg-yatra-surface-dark-muted rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "w-6 h-6 text-yatra-primary dark:text-yatra-on-dark" }) }),
          __("Profile", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-2", children: __(
          "Update your contact details, address, and communication preferences.",
          "yatra"
        ) })
      ] }),
      !isEditing && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          role: "button",
          tabIndex: 0,
          onClick: () => setIsEditing(true),
          className: "yatra-profile-edit-btn inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yatra-primary text-white hover:bg-yatra-primary-dark transition-colors text-sm font-medium cursor-pointer",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(PenSquare, { className: "w-4 h-4" }),
            " ",
            __("Edit Profile", "yatra")
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-profile-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-fields space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
            __("Full Name", "yatra"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: formData.name,
              onChange: (e) => handleInputChange("name", e.target.value),
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent",
              placeholder: __("Enter your full name", "yatra")
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white py-2", children: formData.name || __("Not set", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
            __("Email Address", "yatra"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "email",
              value: formData.email,
              onChange: (e) => handleInputChange("email", e.target.value),
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent",
              placeholder: __("Enter your email address", "yatra")
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white py-2", children: formData.email || __("Not set", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Phone Number", "yatra") }),
          isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "tel",
              value: formData.phone,
              onChange: (e) => handleInputChange("phone", e.target.value),
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent",
              placeholder: __("Enter your phone number", "yatra")
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white py-2", children: formData.phone || __("Not set", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("City", "yatra") }),
          isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: formData.city,
              onChange: (e) => handleInputChange("city", e.target.value),
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent",
              placeholder: __("Enter your city", "yatra")
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white py-2", children: formData.city || __("Not set", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-field md:col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Address", "yatra") }),
          isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              value: formData.address,
              onChange: (e) => handleInputChange("address", e.target.value),
              rows: 3,
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent",
              placeholder: __("Enter your address", "yatra")
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white py-2", children: formData.address || __("Not set", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Country", "yatra") }),
          isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: formData.country,
              onChange: (e) => handleInputChange("country", e.target.value),
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent",
              placeholder: __("Enter your country", "yatra")
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white py-2", children: formData.country || __("Not set", "yatra") })
        ] })
      ] }),
      isEditing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-actions flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: handleSave,
            className: "inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-yatra-primary text-white hover:bg-yatra-primary-dark transition-colors text-sm font-medium",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4" }),
              __("Save Changes", "yatra")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            role: "button",
            tabIndex: 0,
            onClick: handleCancel,
            className: "inline-flex items-center gap-2 px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "w-4 h-4" }),
              __("Cancel", "yatra")
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-password bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "w-5 h-5 text-yatra-primary dark:text-yatra-on-dark" }),
            __("Change Password", "yatra")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __("Update your password to keep your account secure.", "yatra") })
        ] }),
        !isChangingPassword && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            role: "button",
            tabIndex: 0,
            onClick: () => setIsChangingPassword(true),
            className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yatra-primary text-white hover:bg-yatra-primary-dark transition-colors text-sm font-medium cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "w-4 h-4" }),
              __("Change Password", "yatra")
            ]
          }
        )
      ] }),
      isChangingPassword && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-password-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
            __("Current Password", "yatra"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "password",
              value: passwordData.currentPassword,
              onChange: (e) => setPasswordData((prev) => ({
                ...prev,
                currentPassword: e.target.value
              })),
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent",
              placeholder: __("Enter your current password", "yatra")
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-password-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
            __("New Password", "yatra"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "password",
              value: passwordData.newPassword,
              onChange: (e) => setPasswordData((prev) => ({
                ...prev,
                newPassword: e.target.value
              })),
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent",
              placeholder: __("Enter new password", "yatra")
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-password-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
            __("Confirm New Password", "yatra"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "password",
              value: passwordData.confirmPassword,
              onChange: (e) => setPasswordData((prev) => ({
                ...prev,
                confirmPassword: e.target.value
              })),
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent",
              placeholder: __("Confirm your new password", "yatra")
            }
          ),
          passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-red-500 mt-1", children: __("Passwords do not match", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-password-actions flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => {
                if (passwordData.newPassword !== passwordData.confirmPassword) {
                  return;
                }
                setIsChangingPassword(false);
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: ""
                });
              },
              disabled: !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || passwordData.newPassword !== passwordData.confirmPassword,
              className: "inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-yatra-primary text-white hover:bg-yatra-primary-dark transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4" }),
                __("Update Password", "yatra")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              role: "button",
              tabIndex: 0,
              onClick: () => {
                setIsChangingPassword(false);
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: ""
                });
              },
              className: "inline-flex items-center gap-2 px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "w-4 h-4" }),
                __("Cancel", "yatra")
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-sections grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-communication bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-5 h-5 text-yatra-primary dark:text-yatra-on-dark" }),
          __("Communication Preferences", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-preferences space-y-3 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                defaultChecked: true,
                className: "w-4 h-4 rounded text-yatra-primary focus:ring-yatra-primary"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-700 dark:text-gray-300", children: __("Booking reminders", "yatra") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                defaultChecked: true,
                className: "w-4 h-4 rounded text-yatra-primary focus:ring-yatra-primary"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-700 dark:text-gray-300", children: __("Payment notifications", "yatra") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                className: "w-4 h-4 rounded text-yatra-primary focus:ring-yatra-primary"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-700 dark:text-gray-300", children: __("Promotional offers", "yatra") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                defaultChecked: true,
                className: "w-4 h-4 rounded text-yatra-primary focus:ring-yatra-primary"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-700 dark:text-gray-300", children: __("Trip updates", "yatra") })
          ] })
        ] })
      ] }),
      wishlistEnabled && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-saved-trips bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "w-5 h-5 text-red-600 dark:text-red-400" }),
          __("Saved Trips", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-saved-trips-list space-y-3", children: savedTrips.length > 0 ? savedTrips.map((trip) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "yatra-saved-trip-item flex items-center justify-between border border-gray-100 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white truncate", children: trip.trip_title || trip.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: formatDate(trip.next_departure) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right ml-4 flex-shrink-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __("From", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: currency(trip.price_from || trip.price || 0) })
              ] })
            ]
          },
          trip.id || trip.trip_id
        )) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 text-center py-4", children: __("No saved trips yet", "yatra") }) })
      ] })
    ] })
  ] });
};
const SavedTrips = ({ savedTrips, isLoading }) => {
  const { showToast } = useToast();
  const handleRemoveTrip = async (tripId) => {
    try {
      await apiClient.delete(`/saved-trips/${tripId}`);
      window.location.reload();
    } catch (error) {
      console.error("Error removing trip:", error);
      showToast(__("Failed to remove trip from wishlist.", "yatra"), "error");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: __("Saved Trips", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __("Your wishlist of favorite trips", "yatra") })
    ] }) }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-trip-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-trip-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "yatra-trip-image",
          style: { backgroundColor: "#f3f4f6", minHeight: "200px" },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-pulse bg-gray-200 dark:bg-gray-700 w-full h-full" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-trip-content p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-pulse space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" })
      ] }) })
    ] }, i)) }) : savedTrips.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2", children: __("No saved trips yet", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 dark:text-gray-400 mb-6", children: __(
        "Start exploring and save your favorite trips to your wishlist!",
        "yatra"
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "a",
        {
          href: "/trip/",
          className: "inline-flex items-center gap-2 px-4 py-2 bg-yatra-primary text-white rounded-lg hover:bg-yatra-primary-dark transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-4 h-4" }),
            __("Browse Trips", "yatra")
          ]
        }
      )
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-trip-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", children: savedTrips.map((trip) => {
      var _a, _b;
      const tripUrl = trip.permalink || `/trip/${trip.trip_slug || trip.trip_id}`;
      const siteBase = typeof window !== "undefined" && (((_a = window.yatraAdmin) == null ? void 0 : _a.siteUrl) || ((_b = window.yatraAccountPage) == null ? void 0 : _b.siteUrl)) || (typeof window !== "undefined" ? window.location.origin : "");
      const imageUrl = trip.trip_image || `${siteBase}/wp-content/plugins/yatra/assets/images/trip-placeholder.svg`;
      const hasDiscount = trip.discount_percent && trip.discount_percent > 0;
      const displayPrice = trip.price !== void 0 && trip.price !== null ? trip.price : trip.sale_price !== void 0 && trip.sale_price !== null && trip.sale_price > 0 ? trip.sale_price : trip.original_price !== void 0 && trip.original_price !== null && trip.original_price > 0 ? trip.original_price : 0;
      const originalPrice = trip.original_price;
      const avgRating = trip.rating !== void 0 && trip.rating !== null ? trip.rating : trip.average_rating !== void 0 && trip.average_rating !== null ? trip.average_rating : 0;
      const reviewCount = trip.reviews !== void 0 && trip.reviews !== null ? trip.reviews : trip.review_count || trip.reviews_count || 0;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "yatra-trip-card flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800",
          "data-price": displayPrice,
          "data-rating": avgRating,
          "data-duration": trip.duration_days || 0,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-trip-image", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: imageUrl, alt: trip.trip_title }),
              hasDiscount && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-discount-badge", children: [
                trip.discount_percent,
                "% ",
                __("OFF", "yatra")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "yatra-favorite-btn saved is-saved",
                  title: __("Remove from favorites", "yatra"),
                  onClick: () => handleRemoveTrip(trip.trip_id),
                  style: { color: "#ef4444" },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "svg",
                    {
                      width: "20",
                      height: "20",
                      fill: "currentColor",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "path",
                        {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          strokeWidth: "2",
                          d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        }
                      )
                    }
                  )
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-trip-content flex flex-1 flex-col p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-trip-meta", children: [
                trip.location && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yatra-trip-location", children: trip.location }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yatra-trip-separator", children: "•" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yatra-trip-duration", children: trip.duration || __("Flexible", "yatra") }),
                trip.difficulty && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yatra-trip-separator", children: "•" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yatra-trip-difficulty", children: trip.difficulty })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "yatra-trip-title mb-2 text-lg font-semibold leading-snug text-gray-900 dark:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  href: tripUrl,
                  className: "text-yatra-primary-dark hover:text-yatra-primary-darker hover:underline dark:text-yatra-on-dark dark:hover:text-yatra-primary-light focus-visible:outline focus-visible:ring-2 focus-visible:ring-yatra-primary focus-visible:ring-offset-2 rounded-sm",
                  children: trip.trip_title
                }
              ) }),
              trip.highlights && trip.highlights.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-trip-highlights", children: trip.highlights.map((highlight, idx) => {
                const highlightText = typeof highlight === "string" ? highlight : highlight.text || highlight;
                const highlightLink = typeof highlight === "object" && highlight.link ? highlight.link : null;
                if (highlightLink) {
                  return /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "a",
                    {
                      href: highlightLink,
                      className: "yatra-highlight-badge yatra-highlight-link",
                      children: highlightText
                    },
                    idx
                  );
                }
                return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yatra-highlight-badge", children: highlightText }, idx);
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-trip-rating", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-rating-stars", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "svg",
                    {
                      width: "16",
                      height: "16",
                      fill: "#fbbf24",
                      viewBox: "0 0 24 24",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yatra-rating-value", children: avgRating > 0 ? avgRating.toFixed(1) : "0.0" })
                ] }),
                reviewCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yatra-reviews-count", children: [
                  "(",
                  reviewCount,
                  " ",
                  __("reviews", "yatra"),
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-trip-footer mt-auto flex flex-row items-center justify-between gap-4 border-t border-gray-100 pt-4 dark:border-gray-700", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-trip-price flex min-w-0 flex-col items-start gap-1 text-left", children: [
                  hasDiscount && originalPrice && originalPrice > displayPrice && !trip.is_traveler_based && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-original-price text-sm text-gray-500 line-through", children: formatPrice(originalPrice) }),
                  trip.is_traveler_based ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yatra-starting-from text-xs font-normal leading-tight text-gray-500 dark:text-gray-400", children: __("Starting from", "yatra") }) : null,
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-current-price text-xl font-bold leading-none text-yatra-primary tabular-nums dark:text-yatra-on-dark", children: formatPrice(displayPrice) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-price-note text-xs leading-tight text-gray-400 dark:text-gray-500", children: __("Per person", "yatra") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "a",
                  {
                    href: tripUrl,
                    className: "yatra-card-view-btn inline-flex shrink-0 items-center justify-center self-center rounded-lg bg-yatra-primary px-4 py-2 text-sm font-medium text-white no-underline transition-colors hover:bg-yatra-primary-dark",
                    children: __("View Details", "yatra")
                  }
                )
              ] })
            ] })
          ]
        },
        trip.id || trip.trip_id
      );
    }) })
  ] });
};
const navigation = [
  { id: "dashboard", label: __("Dashboard", "yatra"), icon: LayoutDashboard },
  { id: "bookings", label: __("Bookings", "yatra"), icon: Calendar },
  { id: "payments", label: __("Payments", "yatra"), icon: CreditCard },
  { id: "documents", label: __("Documents", "yatra"), icon: FileText },
  { id: "saved-trips", label: __("Saved Trips", "yatra"), icon: Heart },
  { id: "profile", label: __("Profile", "yatra"), icon: User }
];
const AccountPage = () => {
  var _a;
  const accountShell = reactExports.useMemo(() => getYatraAccountPageGlobals(), []);
  const accountNavigation = React.useMemo(() => {
    var _a2;
    const wl = typeof window !== "undefined" && !!((_a2 = window.yatraAccountPage) == null ? void 0 : _a2.wishlistEnabled);
    return navigation.filter((n) => n.id !== "saved-trips" || wl);
  }, []);
  const [urlKey, setUrlKey] = reactExports.useState(0);
  React.useEffect(() => {
    const handleLocationChange = () => {
      setUrlKey((prev) => prev + 1);
    };
    window.addEventListener("popstate", handleLocationChange);
    const interval = setInterval(() => {
      const currentSearch = window.location.search;
      if (currentSearch !== window.__lastAccountSearch) {
        window.__lastAccountSearch = currentSearch;
        handleLocationChange();
      }
    }, 100);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      clearInterval(interval);
    };
  }, []);
  const getSectionFromUrl = () => {
    var _a2, _b;
    if (typeof window !== "undefined") {
      const wl = !!((_a2 = window.yatraAccountPage) == null ? void 0 : _a2.wishlistEnabled);
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "saved-trips" && !wl) {
        return "dashboard";
      }
      if (tab && [
        "dashboard",
        "bookings",
        "payments",
        "documents",
        "profile",
        "saved-trips"
      ].includes(tab)) {
        return tab;
      }
      const saved = localStorage.getItem("yatra-account-active-section");
      const wlSaved = !!((_b = window.yatraAccountPage) == null ? void 0 : _b.wishlistEnabled);
      if (saved === "saved-trips" && !wlSaved) {
        return "dashboard";
      }
      if (saved && [
        "dashboard",
        "bookings",
        "payments",
        "documents",
        "profile",
        "saved-trips"
      ].includes(saved)) {
        return saved;
      }
    }
    return "dashboard";
  };
  const [section, setSection] = reactExports.useState(getSectionFromUrl);
  React.useEffect(() => {
    const newSection = getSectionFromUrl();
    setSection(newSection);
  }, [urlKey]);
  const handleSectionChange = (newSection) => {
    setSection(newSection);
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set("tab", newSection);
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.pushState({}, "", newUrl);
      localStorage.setItem("yatra-account-active-section", newSection);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };
  const unwrapArrayResponse = (response) => {
    if (!response) return [];
    if (typeof response === "object" && response.success === true && Array.isArray(response.data)) {
      return response.data;
    }
    if (typeof response === "object" && response.data && typeof response.data === "object") {
      const inner = response.data;
      if (inner.success === true && Array.isArray(inner.data)) {
        return inner.data;
      }
      if (Array.isArray(inner)) {
        return inner;
      }
    }
    if (Array.isArray(response)) {
      return response;
    }
    if (typeof response === "object" && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  };
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["account-profile"],
    queryFn: async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.CUSTOMER_ME);
        const raw = response && typeof response === "object" && "data" in response && response.data && typeof response.data === "object" ? response.data : response;
        if (!raw || typeof raw !== "object" || !("id" in raw) && !("user_id" in raw) && !("email" in raw)) {
          return null;
        }
        const row = raw;
        const fromParts = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
        const name = typeof row.name === "string" && row.name.trim() || fromParts || (typeof row.email === "string" ? row.email.split("@")[0] || "" : "") || "";
        return {
          ...row,
          name,
          registered_at: row.registered_at || row.created_at || ""
        };
      } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
    },
    refetchOnMount: "always"
  });
  const displayProfile = profile;
  const { data: bookings = [] } = useQuery({
    queryKey: ["account-bookings"],
    queryFn: async () => {
      try {
        const response = await apiClient.get(
          API_ENDPOINTS.CUSTOMER_MY_BOOKINGS
        );
        return unwrapArrayResponse(response);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        return [];
      }
    },
    refetchOnMount: "always"
  });
  const { data: payments = [] } = useQuery({
    queryKey: ["account-payments"],
    queryFn: async () => {
      try {
        const response = await apiClient.get(
          API_ENDPOINTS.CUSTOMER_MY_PAYMENTS
        );
        return unwrapArrayResponse(response);
      } catch (error) {
        console.error("Error fetching payments:", error);
        return [];
      }
    },
    refetchOnMount: "always"
  });
  const { data: documents = [] } = useQuery({
    queryKey: ["account-documents"],
    queryFn: async () => {
      try {
        const response = await apiClient.get(
          API_ENDPOINTS.CUSTOMER_MY_DOCUMENTS
        );
        return unwrapArrayResponse(response);
      } catch (error) {
        console.error("Error fetching documents:", error);
        return [];
      }
    },
    refetchOnMount: "always"
  });
  const notifications = [];
  const wishlistEnabled = typeof window !== "undefined" && !!((_a = window.yatraAccountPage) == null ? void 0 : _a.wishlistEnabled);
  const { data: savedTripsData, isLoading: isLoadingSavedTrips } = useQuery({
    queryKey: ["account-saved-trips"],
    enabled: wishlistEnabled,
    queryFn: async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.SAVED_TRIPS);
        let trips = [];
        if (response && typeof response === "object") {
          if (response.data && typeof response.data === "object") {
            if (response.data.success === true && Array.isArray(response.data.data)) {
              trips = response.data.data;
            } else if (Array.isArray(response.data.data)) {
              trips = response.data.data;
            } else if (Array.isArray(response.data)) {
              trips = response.data;
            }
          } else if (response.success === true && Array.isArray(response.data)) {
            trips = response.data;
          } else if (Array.isArray(response.data)) {
            trips = response.data;
          } else if (Array.isArray(response)) {
            trips = response;
          }
        }
        if (trips.length > 0) {
        }
        return trips;
      } catch (error) {
        console.error("Error fetching saved trips:", error);
        return [];
      }
    }
  });
  const savedTrips = Array.isArray(savedTripsData) ? savedTripsData : [];
  const stats = reactExports.useMemo(() => {
    const outstanding = payments.filter((p) => p.status === "pending").reduce((sum, payment) => sum + payment.amount, 0);
    const upcoming = bookings.filter(
      (b) => new Date(b.travel_date) > /* @__PURE__ */ new Date()
    ).length;
    const totalSpent = (displayProfile == null ? void 0 : displayProfile.total_spent) ?? 0;
    const totalBookings = bookings.length;
    return [
      {
        label: __("Total Bookings", "yatra"),
        value: (displayProfile == null ? void 0 : displayProfile.total_bookings) ?? totalBookings,
        icon: Package,
        badge: (displayProfile == null ? void 0 : displayProfile.loyalty_tier) || ""
      },
      {
        label: __("Upcoming Trips", "yatra"),
        value: upcoming,
        icon: Calendar
      },
      {
        label: __("Outstanding Balance", "yatra"),
        value: currency(outstanding),
        icon: DollarSign
      },
      {
        label: __("Total Spent", "yatra"),
        value: currency(totalSpent),
        icon: ShieldCheck
      }
    ];
  }, [bookings, payments, displayProfile]);
  const renderSection = () => {
    switch (section) {
      case "dashboard":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Dashboard,
          {
            bookings,
            payments,
            displayProfile: displayProfile || null,
            stats,
            notifications,
            conciergePhone: accountShell.companyPhone,
            conciergeEmail: accountShell.companyEmail,
            onSectionChange: (section2) => handleSectionChange(section2)
          }
        );
      case "bookings":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Bookings,
          {
            bookings,
            conciergePhone: accountShell.companyPhone,
            conciergeEmail: accountShell.companyEmail,
            onSectionChange: (section2) => handleSectionChange(section2)
          }
        );
      case "payments":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Payments,
          {
            payments,
            onSectionChange: (section2) => handleSectionChange(section2)
          }
        );
      case "documents":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Documents, { documents });
      case "saved-trips":
        if (!wishlistEnabled) {
          return null;
        }
        return /* @__PURE__ */ jsxRuntimeExports.jsx(SavedTrips, { savedTrips, isLoading: isLoadingSavedTrips });
      case "profile":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Profile,
          {
            profile: displayProfile || null,
            savedTrips,
            wishlistEnabled
          }
        );
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 py-10 pb-16 px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-[var(--yatra-container-max-width,80rem)] mx-auto space-y-6 pb-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: (displayProfile == null ? void 0 : displayProfile.registered_at) ? formatDate(displayProfile.registered_at) : "" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-xl font-bold text-gray-900 dark:text-white", children: [
          __("Hello,", "yatra"),
          " ",
          (displayProfile == null ? void 0 : displayProfile.name) || __("Guest", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: __(
          "Manage bookings, payments, and documents – everything for your adventures in one place.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          role: "button",
          tabIndex: 0,
          onClick: () => {
            const url = accountShell.logoutUrl;
            if (url) {
              window.location.href = url;
            }
          },
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const url = accountShell.logoutUrl;
              if (url) {
                window.location.href = url;
              }
            }
          },
          className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer text-sm",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "w-4 h-4" }),
            " ",
            __("Logout", "yatra")
          ]
        }
      ) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 lg:flex-row lg:items-start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "w-full lg:w-64 flex-shrink-0 space-y-4 lg:sticky lg:top-10 self-start bg-transparent", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 space-y-1", children: accountNavigation.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            role: "button",
            tabIndex: 0,
            onClick: () => handleSectionChange(item.id),
            className: `yatra-nav-item yatra-nav-item-${item.id} w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${section === item.id ? "bg-yatra-soft text-yatra-primary-dark dark:bg-yatra-surface-dark dark:text-yatra-primary-light" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/40"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { className: "w-4 h-4" }),
              item.label
            ]
          },
          item.id
        )) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "rounded-xl p-6 text-white space-y-2 shadow-xl",
            style: {
              backgroundImage: "linear-gradient(to bottom right, var(--yatra-primary-dark, #2563eb), var(--yatra-primary-darker, #1e40af))"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "w-6 h-6 text-white" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-white", children: __("Need help right away?", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-lg text-white", children: accountShell.companyName || __("Concierge Desk", "yatra") }),
              accountShell.companyPhone ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  href: phoneToTelHref(accountShell.companyPhone),
                  className: "text-sm font-medium text-white hover:underline",
                  children: accountShell.companyPhone
                }
              ) : accountShell.companyEmail ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  href: `mailto:${encodeURIComponent(accountShell.companyEmail)}`,
                  className: "text-sm font-medium text-white hover:underline break-all",
                  children: accountShell.companyEmail
                }
              ) : null
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "flex-1 min-w-0 space-y-6", style: { minWidth: 0 }, children: isLoadingProfile && !profile ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-pulse", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-96" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-nowrap gap-6 overflow-x-auto", children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" })
            ] })
          },
          i
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" })
            ] })
          },
          i
        )) })
      ] }) : renderSection() })
    ] })
  ] }) });
};
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1e3
      // 5 minutes
    }
  }
});
const rootElement = document.getElementById("yatra-account-page-root");
if (rootElement) {
  try {
    const root = client.createRoot(rootElement);
    root.render(
      /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ToastProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccountPage, {}) }) }) })
    );
  } catch (error) {
    console.error("Error rendering account page:", error);
    const wrap = document.createElement("div");
    wrap.style.cssText = "padding: 40px; text-align: center;";
    const h2 = document.createElement("h2");
    h2.textContent = __("Error loading account page", "yatra");
    const p = document.createElement("p");
    p.textContent = __(
      "Please refresh the page or contact support if the problem continues.",
      "yatra"
    );
    wrap.appendChild(h2);
    wrap.appendChild(p);
    rootElement.replaceChildren(wrap);
  }
}
//# sourceMappingURL=account-page.js.map
