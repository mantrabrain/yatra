import { j as jsxRuntimeExports, i as Calendar, h as FileText, l as Plane, Q as ArrowRight, e as MapPin, U as User, w as ChevronRight, aH as Sparkles, P as Package, k as CreditCard, bi as LifeBuoy, D as Bell, ab as AlertCircle, ay as CheckCircle2, N as Clock, a0 as ExternalLink, K as Users, O as DollarSign, o as Mail, aO as Phone, aC as Download, r as reactExports, u as useQuery, I as React, W as CheckCircle, al as Eye, a2 as PenSquare, ac as XCircle, bj as ShieldCheck, af as Heart, Z as AlertTriangle, L as LayoutDashboard, bk as LogOut, bf as QueryClient, bg as client, bh as QueryClientProvider } from "./react-vendor-BKl5nxb-.js";
import { _ as __, g as getCurrencySymbol, b as getCurrency, a as apiClient, T as ToastProvider } from "./index-BbqMnhnK.js";
const formatDate = (value) => {
  if (!value) {
    return __("N/A", "N/A");
  }
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return __("Invalid date", "Invalid date");
    }
    return date.toLocaleDateString(void 0, { year: "numeric", month: "long", day: "numeric" });
  } catch (error) {
    return __("Invalid date", "Invalid date");
  }
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
      return `${base} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`;
  }
};
const formatPrice = (price) => {
  var _a, _b, _c, _d, _e;
  const globalCurrency = ((_a = window.yatraAdmin) == null ? void 0 : _a.currency) || "USD";
  const currencyPosition = ((_b = window.yatraAdmin) == null ? void 0 : _b.currencyPosition) || "before";
  const decimalPlaces = ((_c = window.yatraAdmin) == null ? void 0 : _c.decimalPlaces) || 2;
  const thousandSeparator = ((_d = window.yatraAdmin) == null ? void 0 : _d.thousandSeparator) || ",";
  const decimalSeparator = ((_e = window.yatraAdmin) == null ? void 0 : _e.decimalSeparator) || ".";
  if (!price || price === 0) {
    return __("Contact for pricing", "Contact for pricing");
  }
  const formattedAmount = new Intl.NumberFormat(void 0, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(price).replace(/,/g, "TEMP_THOUSAND").replace(/\./g, decimalSeparator).replace(/TEMP_THOUSAND/g, thousandSeparator);
  const currencySymbol = new Intl.NumberFormat(void 0, {
    style: "currency",
    currency: globalCurrency
  }).format(0).replace(/[\d\s.,]/g, "").trim();
  if (currencyPosition === "right" || currencyPosition === "after") {
    return `${formattedAmount} ${currencySymbol}`;
  }
  return `${currencySymbol} ${formattedAmount}`;
};
const formatPriceForBooking = (price, currency2) => {
  var _a, _b, _c, _d, _e;
  const globalCurrency = ((_a = window.yatraAdmin) == null ? void 0 : _a.currency) || "USD";
  const currencyPosition = ((_b = window.yatraAdmin) == null ? void 0 : _b.currencyPosition) || "before";
  const decimalPlaces = ((_c = window.yatraAdmin) == null ? void 0 : _c.decimalPlaces) || 2;
  const thousandSeparator = ((_d = window.yatraAdmin) == null ? void 0 : _d.thousandSeparator) || ",";
  const decimalSeparator = ((_e = window.yatraAdmin) == null ? void 0 : _e.decimalSeparator) || ".";
  const currencyToUse = currency2 || globalCurrency;
  const numPrice = Number(price) || 0;
  const formattedAmount = new Intl.NumberFormat(void 0, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(numPrice).replace(/,/g, "TEMP_THOUSAND").replace(/\./g, decimalSeparator).replace(/TEMP_THOUSAND/g, thousandSeparator);
  const currencySymbol = new Intl.NumberFormat(void 0, {
    style: "currency",
    currency: currencyToUse
  }).format(0).replace(/[\d\s.,]/g, "").trim();
  if (currencyPosition === "right" || currencyPosition === "after") {
    return `${formattedAmount} ${currencySymbol}`;
  }
  return `${currencySymbol} ${formattedAmount}`;
};
const currency = (value, currencyCode = "USD") => {
  const symbol = getCurrencySymbol(currencyCode);
  const currencyData = getCurrency(currencyCode);
  const decimals = (currencyData == null ? void 0 : currencyData.decimalDigits) ?? 2;
  const formatted = new Intl.NumberFormat(void 0, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
  return `${symbol}${formatted}`;
};
const Dashboard = ({
  bookings,
  payments,
  displayProfile,
  stats,
  notifications,
  onSectionChange
}) => {
  var _a;
  const upcomingBookings = bookings.filter((b) => new Date(b.travel_date) > /* @__PURE__ */ new Date()).length > 0 ? bookings.filter((b) => new Date(b.travel_date) > /* @__PURE__ */ new Date()).slice(0, 3) : bookings.filter((b) => new Date(b.travel_date) > /* @__PURE__ */ new Date()).slice(0, 3);
  const recentBookings = bookings.length > 0 ? bookings.slice(0, 2) : [];
  const pendingPayments = payments.filter((p) => p.status === "pending").length > 0 ? payments.filter((p) => p.status === "pending").slice(0, 2) : [];
  const displayNotifications = notifications;
  const enhancedStats = [
    {
      ...stats[0],
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400"
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
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #4f46e5 100%)",
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
                    __("Welcome back,", "Welcome back,"),
                    " ",
                    ((_a = displayProfile == null ? void 0 : displayProfile.name) == null ? void 0 : _a.split(" ")[0]) || __("Traveler", "Traveler"),
                    "! 👋"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "p",
                {
                  className: "text-sm mb-4",
                  style: { color: "#e0e7ff" },
                  children: [
                    __("You have", "You have"),
                    " ",
                    upcomingBookings.length,
                    " ",
                    upcomingBookings.length === 1 ? __("upcoming adventure", "upcoming adventure") : __("upcoming adventures", "upcoming adventures"),
                    " ",
                    __("coming up", "coming up")
                  ]
                }
              ),
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
                      __("View Calendar", "View Calendar")
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
                      __("My Documents", "My Documents")
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
              stat.badge && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 font-medium", children: stat.badge })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-1", children: stat.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: stat.value })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity` })
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
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-gray-900 dark:text-white", children: __("Upcoming Trips", "Upcoming Trips") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Your next adventures", "Your next adventures") })
            ] })
          ] }),
          upcomingBookings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              role: "button",
              tabIndex: 0,
              onClick: () => onSectionChange("bookings"),
              className: "text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors cursor-pointer",
              children: [
                __("View all", "View all"),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4" })
              ]
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: upcomingBookings.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: upcomingBookings.map((booking) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "yatra-booking-card yatra-booking-card-upcoming group relative border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-6 h-6 text-white" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2 mb-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors", children: booking.trip_title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(booking.booking_status), children: __(booking.booking_status, booking.booking_status) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-4 h-4" }),
                  booking.destination || __("Multiple destinations", "Multiple destinations")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3.5 h-3.5" }),
                    formatDate(booking.travel_date)
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "w-3.5 h-3.5" }),
                    booking.travelers,
                    " ",
                    booking.travelers === 1 ? __("Traveler", "Traveler") : __("Travelers", "Travelers")
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" })
            ] })
          },
          booking.id
        )) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-8 h-8 text-gray-400" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 dark:text-gray-400 font-medium mb-1", children: __("No upcoming trips", "No upcoming trips") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 dark:text-gray-500", children: __("Start planning your next adventure!", "Start planning your next adventure!") })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-dashboard-quick-actions bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-dashboard-quick-actions-header p-6 border-b border-gray-100 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-5 h-5 text-purple-600 dark:text-purple-400" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-gray-900 dark:text-white", children: __("Quick Actions", "Quick Actions") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                role: "button",
                tabIndex: 0,
                onClick: () => onSectionChange("bookings"),
                className: "w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group cursor-pointer text-sm",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400", children: __("View Bookings", "View Bookings") })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                role: "button",
                tabIndex: 0,
                onClick: () => onSectionChange("payments"),
                className: "w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group cursor-pointer text-sm",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400", children: __("Make Payment", "Make Payment") })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                role: "button",
                tabIndex: 0,
                onClick: () => onSectionChange("documents"),
                className: "w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group cursor-pointer text-sm",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400", children: __("My Documents", "My Documents") })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                role: "button",
                tabIndex: 0,
                onClick: () => onSectionChange("support"),
                className: "w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group cursor-pointer text-sm",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LifeBuoy, { className: "w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400", children: __("Get Support", "Get Support") })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-dashboard-notifications bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-dashboard-notifications-header p-6 border-b border-gray-100 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "w-5 h-5 text-amber-600 dark:text-amber-400" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-gray-900 dark:text-white", children: __("Notifications", "Notifications") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __("Updates & reminders", "Updates & reminders") })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 space-y-3", children: displayNotifications.length > 0 ? displayNotifications.map((notif) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `p-4 rounded-lg border ${notif.type === "warning" ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"}`,
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
                notif.type === "warning" ? /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm text-gray-900 dark:text-white mb-1", children: notif.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 leading-relaxed", children: notif.message })
                ] })
              ] })
            },
            notif.id
          )) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 dark:text-gray-500", children: __("No new notifications", "No new notifications") })
          ] }) })
        ] })
      ] })
    ] }),
    (recentBookings.length > 0 || pendingPayments.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-dashboard-recent-activity bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-dashboard-recent-activity-header p-6 border-b border-gray-100 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-5 h-5 text-indigo-600 dark:text-indigo-400" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-gray-900 dark:text-white", children: __("Recent Activity", "Recent Activity") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Your latest updates", "Your latest updates") })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        recentBookings.map((booking) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: [
              __("Booking confirmed:", "Booking confirmed:"),
              " ",
              booking.trip_title
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: formatDate(booking.booking_date || booking.created_at) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(booking.booking_status), children: __(booking.booking_status, booking.booking_status) })
        ] }, booking.id)),
        pendingPayments.map((payment) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-5 h-5 text-amber-600 dark:text-amber-400" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: [
              __("Payment pending:", "Payment pending:"),
              " ",
              currency(payment.amount)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: formatDate(payment.date) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(payment.status), children: __(payment.status, payment.status) })
        ] }, payment.id))
      ] }) })
    ] })
  ] });
};
const downloadDocument = async (options) => {
  try {
    let documents = [];
    let targetDoc = null;
    if (options.bookingId) {
      const response = await apiClient.get(`/customer/bookings/${options.bookingId}/documents`);
      documents = response.data || [];
      targetDoc = documents.find((doc) => doc.category === options.documentType);
      if (!targetDoc && options.fallbackUrl) {
        const link = document.createElement("a");
        link.href = options.fallbackUrl;
        link.download = `${options.documentType}-${options.bookingId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
    } else if (options.paymentId && options.fallbackUrl) {
      const link = document.createElement("a");
      link.href = options.fallbackUrl;
      link.download = `${options.documentType}-${options.paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    if (targetDoc && targetDoc.url) {
      const link = document.createElement("a");
      link.href = targetDoc.url;
      link.download = targetDoc.name || `${options.documentType}-${options.bookingId || options.paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error(`No ${options.documentType} document found`);
    }
  } catch (error) {
    console.error(`Error downloading ${options.documentType}:`, error);
  }
};
const downloadVoucher = (bookingId) => {
  return downloadDocument({
    bookingId,
    documentType: "voucher"
  });
};
const downloadInvoice = (paymentId) => {
  var _a, _b;
  const siteUrl = ((_a = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a.siteUrl) || "";
  const nonce = ((_b = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _b.nonce) || "";
  const fallbackUrl = `${siteUrl}/?yatra_invoice=${paymentId}&_wpnonce=${nonce}`;
  return downloadDocument({
    paymentId,
    documentType: "invoice",
    fallbackUrl
  });
};
const COUNTRY_NAMES = {
  "AF": "Afghanistan",
  "AL": "Albania",
  "DZ": "Algeria",
  "AD": "Andorra",
  "AO": "Angola",
  "AG": "Antigua and Barbuda",
  "AR": "Argentina",
  "AM": "Armenia",
  "AU": "Australia",
  "AT": "Austria",
  "AZ": "Azerbaijan",
  "BS": "Bahamas",
  "BH": "Bahrain",
  "BD": "Bangladesh",
  "BB": "Barbados",
  "BY": "Belarus",
  "BE": "Belgium",
  "BZ": "Belize",
  "BJ": "Benin",
  "BT": "Bhutan",
  "BO": "Bolivia",
  "BA": "Bosnia and Herzegovina",
  "BW": "Botswana",
  "BR": "Brazil",
  "BN": "Brunei",
  "BG": "Bulgaria",
  "BF": "Burkina Faso",
  "BI": "Burundi",
  "KH": "Cambodia",
  "CM": "Cameroon",
  "CA": "Canada",
  "CV": "Cape Verde",
  "CF": "Central African Republic",
  "TD": "Chad",
  "CL": "Chile",
  "CN": "China",
  "CO": "Colombia",
  "KM": "Comoros",
  "CG": "Congo",
  "CD": "DR Congo",
  "CR": "Costa Rica",
  "CI": "Ivory Coast",
  "HR": "Croatia",
  "CU": "Cuba",
  "CY": "Cyprus",
  "CZ": "Czech Republic",
  "DK": "Denmark",
  "DJ": "Djibouti",
  "DM": "Dominica",
  "DO": "Dominican Republic",
  "EC": "Ecuador",
  "EG": "Egypt",
  "SV": "El Salvador",
  "GQ": "Equatorial Guinea",
  "ER": "Eritrea",
  "EE": "Estonia",
  "SZ": "Eswatini",
  "ET": "Ethiopia",
  "FJ": "Fiji",
  "FI": "Finland",
  "FR": "France",
  "GA": "Gabon",
  "GM": "Gambia",
  "GE": "Georgia",
  "DE": "Germany",
  "GH": "Ghana",
  "GR": "Greece",
  "GD": "Grenada",
  "GT": "Guatemala",
  "GN": "Guinea",
  "GW": "Guinea-Bissau",
  "GY": "Guyana",
  "HT": "Haiti",
  "HN": "Honduras",
  "HU": "Hungary",
  "IS": "Iceland",
  "IN": "India",
  "ID": "Indonesia",
  "IR": "Iran",
  "IQ": "Iraq",
  "IE": "Ireland",
  "IL": "Israel",
  "IT": "Italy",
  "JM": "Jamaica",
  "JP": "Japan",
  "JO": "Jordan",
  "KZ": "Kazakhstan",
  "KE": "Kenya",
  "KI": "Kiribati",
  "KP": "North Korea",
  "KR": "South Korea",
  "KW": "Kuwait",
  "KG": "Kyrgyzstan",
  "LA": "Laos",
  "LV": "Latvia",
  "LB": "Lebanon",
  "LS": "Lesotho",
  "LR": "Liberia",
  "LY": "Libya",
  "LI": "Liechtenstein",
  "LT": "Lithuania",
  "LU": "Luxembourg",
  "MG": "Madagascar",
  "MW": "Malawi",
  "MY": "Malaysia",
  "MV": "Maldives",
  "ML": "Mali",
  "MT": "Malta",
  "MH": "Marshall Islands",
  "MR": "Mauritania",
  "MU": "Mauritius",
  "MX": "Mexico",
  "FM": "Micronesia",
  "MD": "Moldova",
  "MC": "Monaco",
  "MN": "Mongolia",
  "ME": "Montenegro",
  "MA": "Morocco",
  "MZ": "Mozambique",
  "MM": "Myanmar",
  "NA": "Namibia",
  "NR": "Nauru",
  "NP": "Nepal",
  "NL": "Netherlands",
  "NZ": "New Zealand",
  "NI": "Nicaragua",
  "NE": "Niger",
  "NG": "Nigeria",
  "MK": "North Macedonia",
  "NO": "Norway",
  "OM": "Oman",
  "PK": "Pakistan",
  "PW": "Palau",
  "PS": "Palestine",
  "PA": "Panama",
  "PG": "Papua New Guinea",
  "PY": "Paraguay",
  "PE": "Peru",
  "PH": "Philippines",
  "PL": "Poland",
  "PT": "Portugal",
  "QA": "Qatar",
  "RO": "Romania",
  "RU": "Russia",
  "RW": "Rwanda",
  "KN": "Saint Kitts and Nevis",
  "LC": "Saint Lucia",
  "VC": "Saint Vincent and the Grenadines",
  "WS": "Samoa",
  "SM": "San Marino",
  "ST": "Sao Tome and Principe",
  "SA": "Saudi Arabia",
  "SN": "Senegal",
  "RS": "Serbia",
  "SC": "Seychelles",
  "SL": "Sierra Leone",
  "SG": "Singapore",
  "SK": "Slovakia",
  "SI": "Slovenia",
  "SB": "Solomon Islands",
  "SO": "Somalia",
  "ZA": "South Africa",
  "SS": "South Sudan",
  "ES": "Spain",
  "LK": "Sri Lanka",
  "SD": "Sudan",
  "SR": "Suriname",
  "SE": "Sweden",
  "CH": "Switzerland",
  "SY": "Syria",
  "TW": "Taiwan",
  "TJ": "Tajikistan",
  "TZ": "Tanzania",
  "TH": "Thailand",
  "TL": "Timor-Leste",
  "TG": "Togo",
  "TO": "Tonga",
  "TT": "Trinidad and Tobago",
  "TN": "Tunisia",
  "TR": "Turkey",
  "TM": "Turkmenistan",
  "TV": "Tuvalu",
  "UG": "Uganda",
  "UA": "Ukraine",
  "AE": "United Arab Emirates",
  "GB": "United Kingdom",
  "US": "United States",
  "UY": "Uruguay",
  "UZ": "Uzbekistan",
  "VU": "Vanuatu",
  "VA": "Vatican City",
  "VE": "Venezuela",
  "VN": "Vietnam",
  "YE": "Yemen",
  "ZM": "Zambia",
  "ZW": "Zimbabwe"
};
const getCountryName = (code) => {
  if (!code) return "";
  const upperCode = code.toUpperCase();
  return COUNTRY_NAMES[upperCode] || code;
};
const BookingDetails = ({ booking, isLoading, onBack }) => {
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: __("Booking Details", "Booking Details") }) }) }),
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
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: __("Booking Details", "Booking Details") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            role: "button",
            tabIndex: 0,
            onClick: onBack,
            className: "inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4 rotate-180" }),
              __("Back to Bookings", "Back to Bookings")
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6 text-center text-red-500", children: __("Booking not found or error loading booking", "Booking not found or error loading booking") })
    ] });
  }
  const normalizeRecord = (value) => {
    if (!value) return null;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
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
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: __("Booking Details", "Booking Details") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __("Complete booking information", "Complete booking information") })
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
            __("Back to Bookings", "Back to Bookings")
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Booking Overview", "Booking Overview") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(booking.booking_status), children: __(booking.booking_status || "pending", booking.booking_status || "pending") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(booking.payment_status), children: __(booking.payment_status || "pending", booking.payment_status || "pending") })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Booking Number", "Booking Number") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: booking.booking_number || `#${booking.id}` })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Trip", "Trip") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: booking.trip_title }),
              booking.trip_url ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: booking.trip_url,
                  className: "mt-2 inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-4 h-4" }),
                    __("View Trip", "View Trip")
                  ]
                }
              ) : null
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3 h-3" }),
                __("Booking Date", "Booking Date")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatDate(booking.booking_date || booking.created_at) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3 h-3" }),
                __("Travel Date", "Travel Date")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatDate(booking.travel_date) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-3 h-3" }),
                __("Number of Travelers", "Number of Travelers")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-gray-900 dark:text-white", children: [
                booking.travelers,
                " ",
                booking.travelers === 1 ? __("Traveler", "Traveler") : __("Travelers", "Travelers")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "w-3 h-3" }),
                __("Total Amount", "Total Amount")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: formatPriceForBooking(booking.total_amount, booking.currency) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: __("Customer Information", "Customer Information") }),
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
            __("Travelers Information", "Travelers Information"),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-normal text-gray-500 dark:text-gray-400", children: [
              "(",
              booking.travelers_data.length,
              " ",
              booking.travelers_data.length === 1 ? __("traveler", "traveler") : __("travelers", "travelers"),
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: booking.travelers_data.map((traveler, index) => {
            const travelerFieldsData = traveler.fields || traveler;
            const systemFields = ["id", "booking_id", "traveller_index", "is_lead", "created_at", "updated_at", "fields"];
            const travelerEntries = Object.entries(travelerFieldsData).filter(([key, value]) => {
              if (systemFields.includes(key)) return false;
              if (!value || typeof value === "string" && value.trim() === "") return false;
              if (typeof value === "object" && !Array.isArray(value)) return false;
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
                      index === 0 ? __("Lead Traveler", "Lead Traveler") : `${__("Traveler", "Traveler")} ${index + 1}`,
                      (firstName || lastName) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-normal text-gray-500 dark:text-gray-400 ml-2", children: [
                        "- ",
                        [firstName, lastName].filter(Boolean).join(" ")
                      ] })
                    ] }),
                    index === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded", children: __("Primary Contact", "Primary Contact") })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: travelerEntries.map(([fieldId, fieldValue]) => {
                    if (fieldId === "first_name" || fieldId === "last_name") return null;
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
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-sm text-gray-900 dark:text-white ${fieldId === "passport" ? "font-mono" : ""}`, children: displayValue })
                    ] }, fieldId);
                  }) })
                ]
              },
              index
            );
          }) })
        ] }),
        emergencyContact && Object.values(emergencyContact).some((v) => v && String(v).trim() !== "") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-5 h-5" }),
            __("Emergency Contact", "Emergency Contact")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: Object.entries(emergencyContact).filter(([_, value]) => value && String(value).trim() !== "").map(([fieldId, fieldValue]) => {
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
            __("Special Requests", "Special Requests")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap", children: booking.notes })
        ] }),
        Array.isArray(booking.downloads) && booking.downloads.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-5 h-5" }),
            __("Downloads", "Downloads")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: booking.downloads.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white truncate", children: d.title }),
              d.access_label ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: d.access_label }) : null,
              d.locked && d.locked_reason ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-amber-700 dark:text-amber-300 mt-1", children: d.locked_reason }) : null
            ] }),
            d.locked || !d.url ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium cursor-not-allowed", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4" }),
              __("Not Available", "Not Available")
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "a",
              {
                href: d.url,
                target: "_blank",
                rel: "noreferrer",
                className: "inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4" }),
                  __("Download", "Download")
                ]
              }
            )
          ] }, d.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: __("Payment Information", "Payment Information") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Payment Status", "Payment Status") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(booking.payment_status), children: __(booking.payment_status || "pending", booking.payment_status || "pending") }) })
            ] }),
            booking.payment_method && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-3 h-3" }),
                __("Payment Method", "Payment Method")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: booking.payment_method })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Total Amount", "Total Amount") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: formatPriceForBooking(booking.total_amount, booking.currency) })
            ] }),
            booking.amount_paid > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Amount Paid", "Amount Paid") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatPriceForBooking(booking.amount_paid, booking.currency) })
            ] }),
            booking.amount_due > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Amount Due", "Amount Due") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-amber-600 dark:text-amber-400", children: formatPriceForBooking(booking.amount_due, booking.currency) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: __("Timeline", "Timeline") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Created", "Created") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatDate(booking.created_at || booking.booking_date) })
            ] }),
            booking.updated_at && booking.updated_at !== booking.created_at && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Last Updated", "Last Updated") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatDate(booking.updated_at) })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
};
const Bookings = ({ bookings, onSectionChange }) => {
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [bookingFilter, setBookingFilter] = reactExports.useState("all");
  const [selectedBookingId, setSelectedBookingId] = reactExports.useState(null);
  const [isLoadingBookingDetails, setIsLoadingBookingDetails] = reactExports.useState(false);
  const [bookingDetails, setBookingDetails] = reactExports.useState(null);
  const [payLoading, setPayLoading] = reactExports.useState(null);
  const { data: bookingDetailsData } = useQuery({
    queryKey: ["booking-details", selectedBookingId],
    queryFn: async () => {
      if (!selectedBookingId) return null;
      const response = await apiClient.get(`/bookings/${selectedBookingId}`);
      return response.data;
    },
    enabled: !!selectedBookingId
  });
  React.useEffect(() => {
    if (bookingDetailsData) {
      setBookingDetails(bookingDetailsData);
      setIsLoadingBookingDetails(false);
    }
  }, [bookingDetailsData]);
  const handleBookingSelect = (bookingId) => {
    setSelectedBookingId(bookingId);
    setIsLoadingBookingDetails(true);
  };
  const handleBackToList = () => {
    setSelectedBookingId(null);
    setBookingDetails(null);
  };
  const handleDownloadClick = (bookingId) => {
    downloadVoucher(bookingId);
  };
  const startRemainingPaymentSession = async (bookingId) => {
    setPayLoading(bookingId);
    try {
      const response = await apiClient.post(`/bookings/${bookingId}/pay-remaining`);
      const { payment_url } = response.data;
      if (payment_url) {
        window.location.href = payment_url;
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
    } finally {
      setPayLoading(null);
    }
  };
  if (selectedBookingId && bookingDetails) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      BookingDetails,
      {
        booking: bookingDetails,
        isLoading: isLoadingBookingDetails,
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
    filteredDisplayBookings = filteredDisplayBookings.filter((b) => b.payment_status === "pending" || b.booking_status === "pending");
  } else if (bookingFilter === "completed") {
    filteredDisplayBookings = filteredDisplayBookings.filter((b) => b.booking_status === "completed");
  }
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase().trim();
    filteredDisplayBookings = filteredDisplayBookings.filter(
      (b) => b.trip_title && b.trip_title.toLowerCase().includes(searchLower) || b.booking_number && b.booking_number.toLowerCase().includes(searchLower) || b.destination && b.destination.toLowerCase().includes(searchLower) || b.payment_status && b.payment_status.toLowerCase().includes(searchLower) || b.booking_status && b.booking_status.toLowerCase().includes(searchLower)
    );
  }
  const bookingStats = {
    total: displayBookings.length,
    upcoming: displayBookings.filter((b) => new Date(b.travel_date) >= /* @__PURE__ */ new Date()).length,
    pending: displayBookings.filter((b) => b.payment_status === "pending" || b.booking_status === "pending").length,
    completed: displayBookings.filter((b) => b.booking_status === "completed").length,
    totalSpent: displayBookings.reduce((sum, b) => sum + b.total_amount, 0)
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-bookings-page space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-bookings-header bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold text-gray-900 dark:text-white", children: __("Bookings", "Bookings") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-2", children: __("Manage and view all your travel bookings", "Manage and view all your travel bookings") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            placeholder: __("Search bookings...", "Search bookings..."),
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "w-full lg:w-64 pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: bookingFilter,
            onChange: (e) => setBookingFilter(e.target.value),
            className: "appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: __("All Bookings", "All Bookings") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "upcoming", children: __("Upcoming", "Upcoming") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pending", children: __("Pending", "Pending") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "completed", children: __("Completed", "Completed") })
            ]
          }
        ) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-nowrap gap-6 overflow-x-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Total Bookings", "Total Bookings") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: bookingStats.total })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Upcoming", "Upcoming") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-emerald-600 dark:text-emerald-400", children: bookingStats.upcoming })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-5 h-5 text-emerald-600 dark:text-emerald-400" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Pending", "Pending") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-amber-600 dark:text-amber-400", children: bookingStats.pending })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-5 h-5 text-amber-600 dark:text-amber-400" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Completed", "Completed") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-600 dark:text-gray-400", children: bookingStats.completed })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-gray-50 dark:bg-gray-700 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-5 h-5 text-gray-600 dark:text-gray-400" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Total Spent", "Total Spent") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: currency(bookingStats.totalSpent) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "w-5 h-5 text-purple-600 dark:text-purple-400" }) })
      ] }) })
    ] }),
    filteredDisplayBookings.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 dark:text-gray-400 font-medium mb-1", children: __("No bookings found", "No bookings found") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 dark:text-gray-500", children: __("Try adjusting your filters or check back later.", "Try adjusting your filters or check back later.") })
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
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-2 rounded-lg ${isUpcoming ? "bg-emerald-50 dark:bg-emerald-900/20" : isCompleted ? "bg-gray-50 dark:bg-gray-700" : "bg-amber-50 dark:bg-amber-900/20"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: `w-5 h-5 ${isUpcoming ? "text-emerald-600 dark:text-emerald-400" : isCompleted ? "text-gray-400" : "text-amber-600 dark:text-amber-400"}` }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium mb-1", children: booking.booking_number }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-bold text-gray-900 dark:text-white mb-1", children: booking.trip_title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-4 h-4 text-gray-600 dark:text-gray-400" }),
                    booking.destination || __("Multiple destinations", "Multiple destinations")
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
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Travel Date", "Travel Date") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: formatDate(booking.travel_date) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Travelers", "Travelers") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: booking.travelers })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Total Amount", "Total Amount") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: currency(booking.total_amount) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Paid / Due", "Paid / Due") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: [
                  currency(totalPaid ?? 0),
                  amountDue !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-normal text-gray-500 dark:text-gray-400 ml-1", children: [
                    __("Due:", "Due:"),
                    " ",
                    currency(amountDue)
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Booked On", "Booked On") }),
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
                  className: "yatra-booking-action yatra-booking-action-view inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer",
                  children: __("View Details", "View Details")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  role: "button",
                  tabIndex: 0,
                  onClick: () => handleDownloadClick(bookingId),
                  className: "yatra-booking-action yatra-booking-action-download inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer",
                  children: __("Download Voucher", "Download Voucher")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  role: "button",
                  tabIndex: 0,
                  onClick: () => onSectionChange("payments"),
                  className: "yatra-booking-action yatra-booking-action-payment inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer",
                  children: __("Payment", "Payment")
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
                    payLoading === bookingId ? /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "w-4 h-4 animate-spin", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10", strokeOpacity: "0.25" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 12a8 8 0 0 1 8-8" })
                    ] }) : null,
                    __("Pay Remaining Balance", "Pay Remaining Balance")
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  role: "button",
                  tabIndex: 0,
                  onClick: () => onSectionChange("support"),
                  className: "yatra-booking-action yatra-booking-action-support inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer",
                  children: __("Support", "Support")
                }
              )
            ] })
          ] })
        },
        booking.id
      );
    }) })
  ] });
};
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
      { totalAmount: 0, paidAmount: 0, outstanding: 0, pendingBookings: 0, paidBookings: 0 }
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
        __("Payments & Invoices", "Payments & Invoices")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-2", children: __("Track deposits, balances, and installment schedules with secure payment links.", "Track deposits, balances, and installment schedules with secure payment links.") })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-payments-stats grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-payment-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Total Payments", "Total Payments") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: paymentStats.total })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-payment-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Paid", "Paid") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-emerald-600 dark:text-emerald-400", children: paymentStats.paid }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 dark:text-gray-500", children: currency(paymentStats.totalPaidAmount) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-5 h-5 text-emerald-600 dark:text-emerald-400" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-payment-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Pending", "Pending") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-amber-600 dark:text-amber-400", children: paymentStats.pending })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-5 h-5 text-amber-600 dark:text-amber-400" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-payment-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Outstanding", "Outstanding") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: currency(paymentStats.outstandingAmount) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "w-5 h-5 text-purple-600 dark:text-purple-400" }) })
      ] }) })
    ] }),
    displayPayments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 dark:text-gray-400 font-medium mb-1", children: __("No payments found", "No payments found") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 dark:text-gray-500", children: __("Payment history will appear here once you make a booking.", "Payment history will appear here once you make a booking.") })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: displayPayments.map((payment) => {
      var _a, _b;
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
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-2 rounded-lg ${payment.status === "paid" ? "bg-emerald-50 dark:bg-emerald-900/20" : payment.status === "pending" ? "bg-amber-50 dark:bg-amber-900/20" : "bg-gray-50 dark:bg-gray-700"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: `w-5 h-5 ${payment.status === "paid" ? "text-emerald-600 dark:text-emerald-400" : payment.status === "pending" ? "text-amber-600 dark:text-amber-400" : "text-gray-400"}` }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium mb-1", children: payment.reference }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-base font-bold text-gray-900 dark:text-white mb-1", children: [
                    __("Booking", "Booking"),
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
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-3 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 capitalize", children: payment.type })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-payment-details grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "w-3.5 h-3.5" }),
                  __("Amount", "Amount")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: currency(payment.amount) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-3.5 h-3.5" }),
                  __("Payment Method", "Payment Method")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: payment.method })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3.5 h-3.5" }),
                  __("Payment Date", "Payment Date")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: formatDate(payment.date) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-payment-actions flex flex-wrap gap-3", children: [
              isPaid && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => downloadInvoice(payment.id),
                  className: "yatra-payment-action yatra-payment-action-invoice inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  style: { backgroundColor: "#059669", color: "#ffffff" },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4" }),
                    __("Download Invoice", "Download Invoice")
                  ]
                }
              ),
              isPaid && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: `${((_a = window.yatraAdmin) == null ? void 0 : _a.siteUrl) || ""}/?yatra_invoice=${payment.id}&_wpnonce=${((_b = window.yatraAdmin) == null ? void 0 : _b.nonce) || ""}&view=1`,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "yatra-payment-action yatra-payment-action-receipt inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  style: { backgroundColor: "#2563eb", color: "#ffffff" },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4" }),
                    __("View Receipt", "View Receipt")
                  ]
                }
              ),
              isPending && !canPayRemaining && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yatra-payment-action inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-4 h-4" }),
                __("Pending approval", "Pending approval")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => onSectionChange("bookings"),
                  className: "yatra-payment-action yatra-payment-action-booking inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4" }),
                    __("View Booking", "View Booking")
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
const Documents = ({ documents }) => {
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [selectedCategory, setSelectedCategory] = reactExports.useState("all");
  const displayDocuments = documents;
  let filteredDocuments = [...displayDocuments];
  if (selectedCategory !== "all") {
    filteredDocuments = filteredDocuments.filter((d) => d.category === selectedCategory);
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
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold text-gray-900 dark:text-white", children: __("Travel Documents", "Travel Documents") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-2", children: __("Download itineraries, vouchers, invoices, and other documents for each trip.", "Download itineraries, vouchers, invoices, and other documents for each trip.") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            placeholder: __("Search documents...", "Search documents..."),
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "w-full lg:w-64 pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: selectedCategory,
            onChange: (e) => setSelectedCategory(e.target.value),
            className: "appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: __("All Documents", "All Documents") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "itinerary", children: __("Itineraries", "Itineraries") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "voucher", children: __("Vouchers", "Vouchers") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "invoice", children: __("Invoices", "Invoices") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "downloads", children: __("Downloads", "Downloads") })
            ]
          }
        ) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-documents-stats flex flex-nowrap gap-6 overflow-x-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Itineraries", "Itineraries") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-blue-600 dark:text-blue-400", children: documentsByCategory.itinerary.length })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Vouchers", "Vouchers") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-emerald-600 dark:text-emerald-400", children: documentsByCategory.voucher.length })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Invoices", "Invoices") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-purple-600 dark:text-purple-400", children: documentsByCategory.invoice.length })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Downloads", "Downloads") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-amber-600 dark:text-amber-400", children: documentsByCategory.downloads.length })
      ] }) })
    ] }),
    filteredDocuments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 dark:text-gray-400 font-medium mb-1", children: __("No documents found", "No documents found") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 dark:text-gray-500", children: __("Documents will appear here once you make a booking.", "Documents will appear here once you make a booking.") })
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
                __("Updated", "Updated"),
                ": ",
                formatDate(doc.updated_at)
              ] }),
              doc.category === "downloads" && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-2", children: [
                __("Access", "Access"),
                ": ",
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
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize", children: doc.category })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-document-actions flex flex-wrap gap-3 mt-4", children: [
            doc.locked || !doc.url ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors text-sm font-medium cursor-not-allowed", title: doc.locked_reason || __("Not available", "Not available"), children: __("Not Available", "Not Available") }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => downloadDocument({
                  documentType: doc.category,
                  fallbackUrl: doc.url
                }),
                className: "yatra-document-action yatra-document-action-download inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium",
                children: __("Download", "Download")
              }
            ),
            doc.url ? /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: doc.url, target: "_blank", rel: "noreferrer", className: "yatra-document-action yatra-document-action-preview inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium", children: __("Preview", "Preview") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-500 text-sm font-medium cursor-not-allowed", children: __("Preview", "Preview") })
          ] })
        ] }) }) })
      },
      doc.id
    )) })
  ] });
};
const Profile = ({ profile, savedTrips }) => {
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
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "w-6 h-6 text-indigo-600 dark:text-indigo-400" }) }),
          __("Profile", "Profile")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-2", children: __("Update your contact details, address, and communication preferences.", "Update your contact details, address, and communication preferences.") })
      ] }),
      !isEditing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "button", tabIndex: 0, onClick: () => setIsEditing(true), className: "yatra-profile-edit-btn inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PenSquare, { className: "w-4 h-4" }),
        " ",
        __("Edit Profile", "Edit Profile")
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-profile-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-fields space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
            __("Full Name", "Full Name"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: formData.name,
              onChange: (e) => handleInputChange("name", e.target.value),
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              placeholder: __("Enter your full name", "Enter your full name")
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white py-2", children: formData.name || __("Not set", "Not set") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
            __("Email Address", "Email Address"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "email",
              value: formData.email,
              onChange: (e) => handleInputChange("email", e.target.value),
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              placeholder: __("Enter your email", "Enter your email")
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white py-2", children: formData.email || __("Not set", "Not set") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Phone Number", "Phone Number") }),
          isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "tel",
              value: formData.phone,
              onChange: (e) => handleInputChange("phone", e.target.value),
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              placeholder: __("Enter your phone number", "Enter your phone number")
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white py-2", children: formData.phone || __("Not set", "Not set") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("City", "City") }),
          isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: formData.city,
              onChange: (e) => handleInputChange("city", e.target.value),
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              placeholder: __("Enter your city", "Enter your city")
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white py-2", children: formData.city || __("Not set", "Not set") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-field md:col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Address", "Address") }),
          isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              value: formData.address,
              onChange: (e) => handleInputChange("address", e.target.value),
              rows: 3,
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              placeholder: __("Enter your address", "Enter your address")
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white py-2", children: formData.address || __("Not set", "Not set") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Country", "Country") }),
          isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: formData.country,
              onChange: (e) => handleInputChange("country", e.target.value),
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              placeholder: __("Enter your country", "Enter your country")
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white py-2", children: formData.country || __("Not set", "Not set") })
        ] })
      ] }),
      isEditing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-actions flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: handleSave,
            className: "inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4" }),
              __("Save Changes", "Save Changes")
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
              __("Cancel", "Cancel")
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-password bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }),
            __("Change Password", "Change Password")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __("Update your password to keep your account secure.", "Update your password to keep your account secure.") })
        ] }),
        !isChangingPassword && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            role: "button",
            tabIndex: 0,
            onClick: () => setIsChangingPassword(true),
            className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "w-4 h-4" }),
              __("Change Password", "Change Password")
            ]
          }
        )
      ] }),
      isChangingPassword && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-password-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
            __("Current Password", "Current Password"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "password",
              value: passwordData.currentPassword,
              onChange: (e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value })),
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              placeholder: __("Enter your current password", "Enter your current password")
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-password-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
            __("New Password", "New Password"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "password",
              value: passwordData.newPassword,
              onChange: (e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value })),
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              placeholder: __("Enter your new password", "Enter your new password")
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-password-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
            __("Confirm New Password", "Confirm New Password"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "password",
              value: passwordData.confirmPassword,
              onChange: (e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value })),
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              placeholder: __("Confirm your new password", "Confirm your new password")
            }
          ),
          passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-red-500 mt-1", children: __("Passwords do not match", "Passwords do not match") })
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
              className: "inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4" }),
                __("Update Password", "Update Password")
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
                __("Cancel", "Cancel")
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-sections grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-communication bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }),
          __("Communication Preferences", "Communication Preferences")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-preferences space-y-3 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", defaultChecked: true, className: "w-4 h-4 rounded text-blue-600 focus:ring-blue-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-700 dark:text-gray-300", children: __("Booking reminders", "Booking reminders") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", defaultChecked: true, className: "w-4 h-4 rounded text-blue-600 focus:ring-blue-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-700 dark:text-gray-300", children: __("Payment notifications", "Payment notifications") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", className: "w-4 h-4 rounded text-blue-600 focus:ring-blue-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-700 dark:text-gray-300", children: __("Promotional offers", "Promotional offers") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", defaultChecked: true, className: "w-4 h-4 rounded text-blue-600 focus:ring-blue-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-700 dark:text-gray-300", children: __("Trip updates", "Trip updates") })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-profile-saved-trips bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "w-5 h-5 text-red-600 dark:text-red-400" }),
          __("Saved Trips", "Saved Trips")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-saved-trips-list space-y-3", children: savedTrips.length > 0 ? savedTrips.map((trip) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-saved-trip-item flex items-center justify-between border border-gray-100 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white truncate", children: trip.trip_title || trip.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: formatDate(trip.next_departure) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right ml-4 flex-shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __("From", "From") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: currency(trip.price_from || trip.price || 0) })
          ] })
        ] }, trip.id || trip.trip_id)) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 text-center py-4", children: __("No saved trips yet", "No saved trips yet") }) })
      ] })
    ] })
  ] });
};
const Support = ({ tickets }) => {
  const [ticketSubject, setTicketSubject] = reactExports.useState("");
  const [ticketMessage, setTicketMessage] = reactExports.useState("");
  const displayTickets = tickets;
  const handleSubmitTicket = (e) => {
    e.preventDefault();
    setTicketSubject("");
    setTicketMessage("");
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case "resolved":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4 text-emerald-600 dark:text-emerald-400" });
      case "awaiting_response":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-4 h-4 text-amber-600 dark:text-amber-400" });
      case "open":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "w-4 h-4 text-blue-600 dark:text-blue-400" });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(LifeBuoy, { className: "w-4 h-4 text-gray-600 dark:text-gray-400" });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-support-page space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-support-header bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LifeBuoy, { className: "w-6 h-6 text-blue-600 dark:text-blue-400" }) }),
        __("Support & Help Center", "Support & Help Center")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-2", children: __("Our team is available 24/7 for urgent requests. Submit a ticket or contact us directly.", "Our team is available 24/7 for urgent requests. Submit a ticket or contact us directly.") })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-support-stats flex flex-nowrap gap-6 overflow-x-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 yatra-support-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Total Tickets", "Total Tickets") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: displayTickets.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LifeBuoy, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 yatra-support-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Open", "Open") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-blue-600 dark:text-blue-400", children: displayTickets.filter((t) => t.status === "open" || t.status === "awaiting_response").length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 yatra-support-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Resolved", "Resolved") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-emerald-600 dark:text-emerald-400", children: displayTickets.filter((t) => t.status === "resolved").length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-5 h-5 text-emerald-600 dark:text-emerald-400" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-support-form-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-support-form-header flex items-center gap-3 mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LifeBuoy, { className: "w-6 h-6 text-blue-600 dark:text-blue-400" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-gray-900 dark:text-white", children: __("Create New Support Ticket", "Create New Support Ticket") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Describe your issue and we'll get back to you as soon as possible.", "Describe your issue and we'll get back to you as soon as possible.") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmitTicket, className: "yatra-support-form space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
            __("Subject", "Subject"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: ticketSubject,
              onChange: (e) => setTicketSubject(e.target.value),
              placeholder: __("Enter ticket subject", "Enter ticket subject"),
              required: true,
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
            __("Message", "Message"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              value: ticketMessage,
              onChange: (e) => setTicketMessage(e.target.value),
              placeholder: __("How can we help?", "How can we help?"),
              required: true,
              rows: 6,
              className: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "submit",
            className: "yatra-support-submit-btn inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LifeBuoy, { className: "w-4 h-4" }),
              " ",
              __("Submit Ticket", "Submit Ticket")
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-support-tickets bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5 text-gray-600 dark:text-gray-400" }),
        __("Your Support Tickets", "Your Support Tickets")
      ] }) }),
      displayTickets.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LifeBuoy, { className: "w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 dark:text-gray-400 font-medium mb-1", children: __("No support tickets yet", "No support tickets yet") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 dark:text-gray-500", children: __("Create a ticket above to get started.", "Create a ticket above to get started.") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-support-tickets-list space-y-4", children: displayTickets.map((ticket) => {
        const isResolved = ticket.status === "resolved";
        const isAwaiting = ticket.status === "awaiting_response";
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "yatra-support-ticket-card group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-all",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 mb-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-2 rounded-lg ${isResolved ? "bg-emerald-50 dark:bg-emerald-900/20" : isAwaiting ? "bg-amber-50 dark:bg-amber-900/20" : "bg-blue-50 dark:bg-blue-900/20"}`, children: getStatusIcon(ticket.status) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-base font-semibold text-gray-900 dark:text-white mb-1", children: ticket.subject }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-4 h-4" }),
                    __("Last updated", "Last updated"),
                    ": ",
                    formatDate(ticket.updated_at)
                  ] })
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(ticket.status), children: __(ticket.status, ticket.status) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "button", tabIndex: 0, onClick: () => {
                }, className: "yatra-support-ticket-view inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4" }),
                  __("View", "View")
                ] })
              ] })
            ] })
          },
          ticket.id
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-support-contact rounded-xl p-6 text-white shadow-xl", style: { backgroundColor: "#2563eb", backgroundImage: "linear-gradient(to bottom right, #2563eb, #4f46e5)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-white/20 rounded-lg flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "w-6 h-6 text-white" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-white mb-2", children: __("Need Immediate Assistance?", "Need Immediate Assistance?") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-white/90 mb-4", children: __("Call our 24/7 concierge desk for urgent travel support.", "Call our 24/7 concierge desk for urgent travel support.") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "w-4 h-4 text-white flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "tel:+18005550199", className: "text-sm font-medium text-white hover:underline", children: "+1-800-555-0199" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-4 h-4 text-white flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "mailto:support@yatra.com", className: "text-sm font-medium text-white hover:underline", children: "support@yatra.com" })
          ] })
        ] })
      ] })
    ] }) })
  ] });
};
const SavedTrips = ({ savedTrips, isLoading }) => {
  const handleRemoveTrip = async (tripId) => {
    try {
      await apiClient.delete(`/saved-trips/${tripId}`);
      window.location.reload();
    } catch (error) {
      console.error("Error removing trip:", error);
      alert(__("Failed to remove trip from wishlist.", "Failed to remove trip from wishlist."));
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: __("Saved Trips", "Saved Trips") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __("Your wishlist of favorite trips", "Your wishlist of favorite trips") })
    ] }) }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-trip-grid", style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }, children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-trip-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-trip-image", style: { backgroundColor: "#f3f4f6", minHeight: "200px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-pulse bg-gray-200 dark:bg-gray-700 w-full h-full" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-trip-content p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-pulse space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" })
      ] }) })
    ] }, i)) }) : savedTrips.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2", children: __("No saved trips yet", "No saved trips yet") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 dark:text-gray-400 mb-6", children: __("Start exploring and save your favorite trips to your wishlist!", "Start exploring and save your favorite trips to your wishlist!") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "a",
        {
          href: "/trip/",
          className: "inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-4 h-4" }),
            __("Browse Trips", "Browse Trips")
          ]
        }
      )
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-trip-grid", style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }, children: savedTrips.map((trip) => {
      const tripUrl = trip.permalink || `/trip/${trip.trip_slug || trip.trip_id}`;
      const imageUrl = trip.trip_image || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop";
      const hasDiscount = trip.discount_percent && trip.discount_percent > 0;
      const displayPrice = trip.price !== void 0 && trip.price !== null ? trip.price : trip.sale_price !== void 0 && trip.sale_price !== null && trip.sale_price > 0 ? trip.sale_price : trip.original_price !== void 0 && trip.original_price !== null && trip.original_price > 0 ? trip.original_price : 0;
      const originalPrice = trip.original_price;
      const avgRating = trip.rating !== void 0 && trip.rating !== null ? trip.rating : trip.average_rating !== void 0 && trip.average_rating !== null ? trip.average_rating : 0;
      const reviewCount = trip.reviews !== void 0 && trip.reviews !== null ? trip.reviews : trip.review_count || trip.reviews_count || 0;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "yatra-trip-card",
          "data-price": displayPrice,
          "data-rating": avgRating,
          "data-duration": trip.duration_days || 0,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-trip-image", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: imageUrl, alt: trip.trip_title }),
              hasDiscount && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-discount-badge", children: [
                trip.discount_percent,
                "% ",
                __("OFF", "OFF")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "yatra-favorite-btn saved is-saved",
                  title: __("Remove from favorites", "Remove from favorites"),
                  onClick: () => handleRemoveTrip(trip.trip_id),
                  style: { color: "#ef4444" },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "20", height: "20", fill: "currentColor", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-trip-content", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-trip-meta", children: [
                trip.location && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yatra-trip-location", children: trip.location }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yatra-trip-separator", children: "•" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yatra-trip-duration", children: trip.duration || __("Flexible", "Flexible") }),
                trip.difficulty && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yatra-trip-separator", children: "•" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yatra-trip-difficulty", children: trip.difficulty })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "yatra-trip-title", children: trip.trip_title }),
              trip.highlights && trip.highlights.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-trip-highlights", children: trip.highlights.map((highlight, idx) => {
                const highlightText = typeof highlight === "string" ? highlight : highlight.text || highlight;
                const highlightLink = typeof highlight === "object" && highlight.link ? highlight.link : null;
                if (highlightLink) {
                  return /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: highlightLink, className: "yatra-highlight-badge yatra-highlight-link", children: highlightText }, idx);
                }
                return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yatra-highlight-badge", children: highlightText }, idx);
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-trip-rating", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-rating-stars", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "16", height: "16", fill: "#fbbf24", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yatra-rating-value", children: avgRating > 0 ? avgRating.toFixed(1) : "0.0" })
                ] }),
                reviewCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yatra-reviews-count", children: [
                  "(",
                  reviewCount,
                  " ",
                  __("reviews", "reviews"),
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-trip-footer", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-trip-price", children: [
                  hasDiscount && originalPrice && originalPrice > displayPrice && !trip.is_traveler_based && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-original-price", children: formatPrice(originalPrice) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-current-price", children: trip.is_traveler_based ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yatra-starting-from", style: { fontSize: "0.75rem", fontWeight: "normal" }, children: [
                      __("Starting from", "Starting from"),
                      " "
                    ] }),
                    formatPrice(displayPrice)
                  ] }) : formatPrice(displayPrice) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-price-note", children: __("per person", "per person") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: tripUrl, className: "yatra-card-view-btn", children: __("View Details", "View Details") })
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
  { id: "dashboard", label: __("Dashboard", "Dashboard"), icon: LayoutDashboard },
  { id: "bookings", label: __("Bookings", "Bookings"), icon: Calendar },
  { id: "payments", label: __("Payments", "Payments"), icon: CreditCard },
  { id: "documents", label: __("Documents", "Documents"), icon: FileText },
  { id: "saved-trips", label: __("Saved Trips", "Saved Trips"), icon: Heart },
  { id: "profile", label: __("Profile", "Profile"), icon: User },
  { id: "support", label: __("Support", "Support"), icon: LifeBuoy }
];
const AccountPage = () => {
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
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["dashboard", "bookings", "payments", "documents", "profile", "support", "saved-trips"].includes(tab)) {
        return tab;
      }
      const saved = localStorage.getItem("yatra-account-active-section");
      if (saved && ["dashboard", "bookings", "payments", "documents", "profile", "support", "saved-trips"].includes(saved)) {
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
        const response = await apiClient.get("/customers/me");
        if (response && typeof response === "object" && ("id" in response || "name" in response || "email" in response)) {
          return response;
        }
        if (response && typeof response === "object" && "data" in response) {
          return response.data;
        }
        return response || null;
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
        const response = await apiClient.get("/customers/my-bookings");
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
        const response = await apiClient.get("/customers/my-payments");
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
        const response = await apiClient.get("/customers/my-documents");
        return unwrapArrayResponse(response);
      } catch (error) {
        console.error("Error fetching documents:", error);
        return [];
      }
    },
    refetchOnMount: "always"
  });
  const { data: supportTickets = [] } = useQuery({
    queryKey: ["account-support"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/customers/my-support-tickets");
        return unwrapArrayResponse(response);
      } catch (error) {
        console.error("Error fetching support tickets:", error);
        return [];
      }
    },
    refetchOnMount: "always"
  });
  const notifications = [];
  const { data: savedTripsData, isLoading: isLoadingSavedTrips } = useQuery({
    queryKey: ["account-saved-trips"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/saved-trips");
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
          console.log("Saved trips data sample:", trips[0]);
        }
        return trips;
      } catch (error) {
        console.error("Error fetching saved trips:", error);
        return [];
      }
    }
  });
  const savedTrips = Array.isArray(savedTripsData) ? savedTripsData : [];
  const currency2 = (value) => new Intl.NumberFormat(void 0, { style: "currency", currency: "USD" }).format(value);
  const stats = reactExports.useMemo(() => {
    const outstanding = payments.filter((p) => p.status === "pending").reduce((sum, payment) => sum + payment.amount, 0);
    const upcoming = bookings.filter((b) => new Date(b.travel_date) > /* @__PURE__ */ new Date()).length;
    const totalSpent = (displayProfile == null ? void 0 : displayProfile.total_spent) ?? 0;
    const totalBookings = bookings.length;
    return [
      {
        label: __("Total Bookings", "Total Bookings"),
        value: (displayProfile == null ? void 0 : displayProfile.total_bookings) ?? totalBookings,
        icon: Package,
        badge: (displayProfile == null ? void 0 : displayProfile.loyalty_tier) || ""
      },
      {
        label: __("Upcoming Trips", "Upcoming Trips"),
        value: upcoming,
        icon: Calendar
      },
      {
        label: __("Outstanding Balance", "Outstanding Balance"),
        value: currency2(outstanding),
        icon: DollarSign
      },
      {
        label: __("Total Spent", "Total Spent"),
        value: currency2(totalSpent),
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
            onSectionChange: (section2) => handleSectionChange(section2)
          }
        );
      case "bookings":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Bookings,
          {
            bookings,
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
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Documents,
          {
            documents
          }
        );
      case "saved-trips":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          SavedTrips,
          {
            savedTrips,
            isLoading: isLoadingSavedTrips
          }
        );
      case "profile":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Profile,
          {
            profile: displayProfile || null,
            savedTrips
          }
        );
      case "support":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Support,
          {
            tickets: supportTickets
          }
        );
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 py-10 pb-16 px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto space-y-6 pb-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: (displayProfile == null ? void 0 : displayProfile.registered_at) ? formatDate(displayProfile.registered_at) : "" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-xl font-bold text-gray-900 dark:text-white", children: [
          __("Hello,", "Hello,"),
          " ",
          (displayProfile == null ? void 0 : displayProfile.name) || __("Guest", "Guest")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Manage bookings, payments, and documents – everything for your adventures in one place.", "Manage bookings, payments, and documents – everything for your adventures in one place.") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "button", tabIndex: 0, onClick: () => {
      }, className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "w-4 h-4" }),
        " ",
        __("Logout", "Logout")
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 lg:flex-row lg:items-start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "w-full lg:w-64 flex-shrink-0 space-y-4 lg:sticky lg:top-10 self-start bg-transparent", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 space-y-1", children: navigation.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            role: "button",
            tabIndex: 0,
            onClick: () => handleSectionChange(item.id),
            className: `yatra-nav-item yatra-nav-item-${item.id} w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${section === item.id ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/40"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { className: "w-4 h-4" }),
              item.label
            ]
          },
          item.id
        )) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 text-white space-y-2 shadow-xl", style: { backgroundColor: "#2563eb", backgroundImage: "linear-gradient(to bottom right, #2563eb, #4f46e5)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "w-6 h-6 text-white" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-white", children: __("Need help right away?", "Need help right away?") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-lg text-white", children: __("Concierge Desk", "Concierge Desk") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-white", children: "+1-800-555-0199" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "flex-1 min-w-0 space-y-6", style: { minWidth: 0 }, children: isLoadingProfile && !profile ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-pulse", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-96" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-nowrap gap-6 overflow-x-auto", children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-pulse", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" })
        ] }) }, i)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-pulse", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" })
        ] }) }, i)) })
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
    rootElement.innerHTML = '<div style="padding: 40px; text-align: center;"><h2>Error loading account page</h2><p>Please refresh the page or contact support.</p></div>';
  }
}
//# sourceMappingURL=account-page.js.map
