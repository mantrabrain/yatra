import { L as LayoutDashboard, i as Calendar, h as CreditCard, g as FileText, w as User, aY as LifeBuoy, r as reactExports, aD as React, u as useQuery, V as Package, D as DollarSign, aZ as ShieldCheck, j as jsxRuntimeExports, a_ as LogOut, ap as AlertTriangle, G as CheckCircle, x as Clock, Y as Eye, aE as Phone, aq as Mail, Z as PenSquare, X as XCircle, a2 as Heart, aF as Download, d as MapPin, U as Users, z as Plane, y as ArrowRight, o as ChevronRight, av as Sparkles, v as Bell, E as AlertCircle, al as CheckCircle2, aV as QueryClient, aW as client, aX as QueryClientProvider } from "./react-vendor-BXPbDqwT.js";
import { _ as __, a as apiClient, T as ToastProvider } from "./index-C-oyR4ku.js";
const navigation = [
  { id: "dashboard", label: __("Dashboard", "Dashboard"), icon: LayoutDashboard },
  { id: "bookings", label: __("Bookings", "Bookings"), icon: Calendar },
  { id: "payments", label: __("Payments", "Payments"), icon: CreditCard },
  { id: "documents", label: __("Documents", "Documents"), icon: FileText },
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
      if (tab && ["dashboard", "bookings", "payments", "documents", "profile", "support"].includes(tab)) {
        return tab;
      }
      const saved = localStorage.getItem("yatra-account-active-section");
      if (saved && ["dashboard", "bookings", "payments", "documents", "profile", "support"].includes(saved)) {
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
  const [bookingFilter, setBookingFilter] = reactExports.useState("all");
  const [isEditing, setIsEditing] = reactExports.useState(false);
  const [formData, setFormData] = reactExports.useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: ""
  });
  const [ticketSubject, setTicketSubject] = reactExports.useState("");
  const [ticketMessage, setTicketMessage] = reactExports.useState("");
  const [passwordData, setPasswordData] = reactExports.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isChangingPassword, setIsChangingPassword] = reactExports.useState(false);
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
        console.warn("Account profile endpoint unavailable. Using fallback data.", error);
        return {
          id: 1,
          name: "John Smith",
          email: "john.smith@example.com",
          phone: "+1 234-567-8900",
          address: "123 Main Street, Apt 4B",
          city: "New York",
          country: "United States",
          registered_at: "2024-05-10T00:00:00Z",
          total_bookings: 4,
          total_spent: 6425,
          loyalty_tier: "Gold Explorer"
        };
      }
    }
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ["account-bookings"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/customers/my-bookings");
        const data = response && typeof response === "object" && "data" in response ? response.data : response;
        if (Array.isArray(data)) {
          return data;
        }
      } catch (error) {
        console.warn("Bookings endpoint unavailable. Using fallback data.", error);
      }
      const today = /* @__PURE__ */ new Date();
      const iso = (offset) => {
        const d = new Date(today);
        d.setDate(d.getDate() + offset);
        return d.toISOString();
      };
      return [
        {
          id: 1,
          booking_number: "YT-2025-001",
          trip_title: "Everest Base Camp Trek",
          trip_id: 42,
          booking_date: iso(-40),
          travel_date: iso(28),
          travelers: 2,
          total_amount: 2750,
          payment_status: "partial",
          booking_status: "confirmed",
          destination: "Nepal"
        },
        {
          id: 2,
          booking_number: "YT-2024-017",
          trip_title: "Golden Triangle & Tigers",
          trip_id: 18,
          booking_date: iso(-120),
          travel_date: iso(-5),
          travelers: 4,
          total_amount: 4120,
          payment_status: "paid",
          booking_status: "completed",
          destination: "India"
        },
        {
          id: 3,
          booking_number: "YT-2025-008",
          trip_title: "Bhutan Cultural Discovery",
          trip_id: 55,
          booking_date: iso(-10),
          travel_date: iso(65),
          travelers: 1,
          total_amount: 1980,
          payment_status: "pending",
          booking_status: "pending",
          destination: "Bhutan"
        }
      ];
    }
  });
  const { data: payments = [] } = useQuery({
    queryKey: ["account-payments"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/customers/my-payments");
        const data = response && typeof response === "object" && "data" in response ? response.data : response;
        if (Array.isArray(data)) {
          return data;
        }
      } catch (error) {
        console.warn("Payments endpoint unavailable. Using fallback data.", error);
      }
      return [
        {
          id: 101,
          reference: "PAY-934812",
          booking_number: "YT-2025-001",
          amount: 1500,
          status: "paid",
          method: "Credit Card",
          date: "2025-02-10T08:00:00Z",
          type: "deposit"
        },
        {
          id: 102,
          reference: "PAY-935114",
          booking_number: "YT-2025-001",
          amount: 1250,
          status: "pending",
          method: "Bank Transfer",
          date: "2025-03-12T08:00:00Z",
          type: "balance"
        },
        {
          id: 103,
          reference: "PAY-920014",
          booking_number: "YT-2024-017",
          amount: 2060,
          status: "paid",
          method: "UPI",
          date: "2024-11-10T09:00:00Z",
          type: "installment"
        }
      ];
    }
  });
  const { data: documents = [] } = useQuery({
    queryKey: ["account-documents"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/customers/my-documents");
        const data = response && typeof response === "object" && "data" in response ? response.data : response;
        if (Array.isArray(data)) {
          return data;
        }
      } catch (error) {
        console.warn("Documents endpoint unavailable. Using fallback data.", error);
      }
      return [
        {
          id: 401,
          name: "Everest Base Camp Detailed Itinerary.pdf",
          trip_title: "Everest Base Camp Trek",
          category: "itinerary",
          updated_at: "2025-02-01T10:00:00Z",
          url: "#"
        },
        {
          id: 402,
          name: "Payment Receipt #PAY-934812.pdf",
          trip_title: "Everest Base Camp Trek",
          category: "invoice",
          updated_at: "2025-02-11T09:00:00Z",
          url: "#"
        },
        {
          id: 403,
          name: "Golden Triangle Travel Voucher.pdf",
          trip_title: "Golden Triangle & Tigers",
          category: "voucher",
          updated_at: "2024-12-01T12:00:00Z",
          url: "#"
        }
      ];
    }
  });
  const { data: supportTickets = [] } = useQuery({
    queryKey: ["account-support"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/customers/my-support-tickets");
        const data = response && typeof response === "object" && "data" in response ? response.data : response;
        if (Array.isArray(data)) {
          return data;
        }
      } catch (error) {
        console.warn("Support endpoint unavailable. Using fallback data.", error);
      }
      return [
        {
          id: 9001,
          subject: "Request vegetarian meal preference",
          status: "awaiting_response",
          updated_at: "2025-02-20T14:00:00Z"
        },
        {
          id: 9002,
          subject: "Need insurance letter for visa",
          status: "resolved",
          updated_at: "2025-01-18T08:00:00Z"
        }
      ];
    }
  });
  const savedTrips = [
    {
      id: 501,
      title: "Kilimanjaro Summit & Serengeti",
      summary: "12-day expedition across Tanzania",
      next_departure: "2025-09-04T00:00:00Z",
      price_from: 3890
    },
    {
      id: 502,
      title: "Iceland Northern Lights Escape",
      summary: "6-night boutique aurora experience",
      next_departure: "2025-01-14T00:00:00Z",
      price_from: 2450
    }
  ];
  const notifications = [
    {
      id: "n1",
      title: __("Balance due soon", "Balance due soon"),
      message: __("Your Everest Base Camp balance is due on March 12th.", "Your Everest Base Camp balance is due on March 12th."),
      type: "warning"
    },
    {
      id: "n2",
      title: __("Document updated", "Document updated"),
      message: __("New itinerary uploaded for Golden Triangle tour.", "New itinerary uploaded for Golden Triangle tour."),
      type: "info"
    }
  ];
  const displayProfile = profile || {
    id: 0,
    name: "Guest",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    registered_at: (/* @__PURE__ */ new Date()).toISOString(),
    total_bookings: 0,
    total_spent: 0,
    loyalty_tier: void 0
  };
  React.useEffect(() => {
    if (displayProfile && !isEditing) {
      setFormData({
        name: displayProfile.name || "",
        email: displayProfile.email || "",
        phone: displayProfile.phone || "",
        address: displayProfile.address || "",
        city: displayProfile.city || "",
        country: displayProfile.country || ""
      });
    }
  }, [displayProfile, isEditing]);
  const currency = (value) => new Intl.NumberFormat(void 0, { style: "currency", currency: "USD" }).format(value);
  const formatDate = (value) => new Date(value).toLocaleDateString(void 0, { year: "numeric", month: "long", day: "numeric" });
  const stats = reactExports.useMemo(() => {
    const outstanding = payments.filter((p) => p.status === "pending").reduce((sum, payment) => sum + payment.amount, 0);
    const upcoming = bookings.filter((b) => new Date(b.travel_date) > /* @__PURE__ */ new Date()).length;
    const totalBookings = bookings.length > 0 ? bookings.length : 12;
    const upcomingTrips = upcoming > 0 ? upcoming : 3;
    const outstandingBalance = outstanding > 0 ? outstanding : 2e3;
    const totalSpent = bookings.length === 0 ? 15200 : (displayProfile == null ? void 0 : displayProfile.total_spent) ?? 0;
    return [
      {
        label: __("Total Bookings", "Total Bookings"),
        value: (displayProfile == null ? void 0 : displayProfile.total_bookings) ?? totalBookings,
        icon: Package,
        badge: (displayProfile == null ? void 0 : displayProfile.loyalty_tier) || "Gold Member"
      },
      {
        label: __("Upcoming Trips", "Upcoming Trips"),
        value: upcomingTrips,
        icon: Calendar
      },
      {
        label: __("Outstanding Balance", "Outstanding Balance"),
        value: currency(outstandingBalance),
        icon: DollarSign
      },
      {
        label: __("Total Spent", "Total Spent"),
        value: currency(totalSpent),
        icon: ShieldCheck
      }
    ];
  }, [bookings, payments, displayProfile]);
  const getBadge = (status) => {
    const base = "px-2.5 py-0.5 rounded-full text-xs font-medium";
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
  const renderDashboard = () => {
    var _a;
    const dummyUpcomingBookings = [
      {
        id: 1001,
        booking_number: "YT-2025-001",
        trip_title: "Everest Base Camp Trek",
        trip_id: 1,
        booking_date: (/* @__PURE__ */ new Date()).toISOString(),
        travel_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
        travelers: 2,
        total_amount: 2890,
        payment_status: "partial",
        booking_status: "confirmed",
        destination: "Nepal, Himalayas"
      },
      {
        id: 1002,
        booking_number: "YT-2025-002",
        trip_title: "Safari Adventure in Serengeti",
        trip_id: 2,
        booking_date: (/* @__PURE__ */ new Date()).toISOString(),
        travel_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1e3).toISOString(),
        travelers: 4,
        total_amount: 4250,
        payment_status: "paid",
        booking_status: "confirmed",
        destination: "Tanzania, Africa"
      },
      {
        id: 1003,
        booking_number: "YT-2025-003",
        trip_title: "Iceland Northern Lights Expedition",
        trip_id: 3,
        booking_date: (/* @__PURE__ */ new Date()).toISOString(),
        travel_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1e3).toISOString(),
        travelers: 2,
        total_amount: 3200,
        payment_status: "pending",
        booking_status: "confirmed",
        destination: "Reykjavik, Iceland"
      }
    ];
    const dummyRecentBookings = [
      {
        id: 2001,
        booking_number: "YT-2024-998",
        trip_title: "Golden Triangle India Tour",
        trip_id: 4,
        booking_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1e3).toISOString(),
        travel_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3).toISOString(),
        travelers: 3,
        total_amount: 1850,
        payment_status: "paid",
        booking_status: "completed",
        destination: "Delhi, Agra, Jaipur"
      },
      {
        id: 2002,
        booking_number: "YT-2024-997",
        trip_title: "Machu Picchu & Sacred Valley",
        trip_id: 5,
        booking_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString(),
        travel_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1e3).toISOString(),
        travelers: 2,
        total_amount: 2450,
        payment_status: "paid",
        booking_status: "completed",
        destination: "Cusco, Peru"
      }
    ];
    const dummyPendingPayments = [
      {
        id: 3001,
        reference: "PAY-2025-001",
        booking_number: "YT-2025-001",
        amount: 1200,
        status: "pending",
        method: "Credit Card",
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1e3).toISOString(),
        type: "balance"
      },
      {
        id: 3002,
        reference: "PAY-2025-002",
        booking_number: "YT-2025-003",
        amount: 800,
        status: "pending",
        method: "Bank Transfer",
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1e3).toISOString(),
        type: "deposit"
      }
    ];
    const dummyNotifications = [
      {
        id: "n1",
        title: __("Balance due soon", "Balance due soon"),
        message: __("Your Everest Base Camp balance of $1,200 is due on March 12th. Please complete payment to secure your booking.", "Your Everest Base Camp balance of $1,200 is due on March 12th. Please complete payment to secure your booking."),
        type: "warning"
      },
      {
        id: "n2",
        title: __("Document updated", "Document updated"),
        message: __("New itinerary and travel guide have been uploaded for your Serengeti Safari Adventure. Check your documents section.", "New itinerary and travel guide have been uploaded for your Serengeti Safari Adventure. Check your documents section."),
        type: "info"
      },
      {
        id: "n3",
        title: __("Booking confirmed", "Booking confirmed"),
        message: __("Your Iceland Northern Lights Expedition has been confirmed! Your travel documents will be available 14 days before departure.", "Your Iceland Northern Lights Expedition has been confirmed! Your travel documents will be available 14 days before departure."),
        type: "info"
      }
    ];
    const upcomingBookings = bookings.filter((b) => new Date(b.travel_date) > /* @__PURE__ */ new Date()).length > 0 ? bookings.filter((b) => new Date(b.travel_date) > /* @__PURE__ */ new Date()).slice(0, 3) : dummyUpcomingBookings;
    const recentBookings = bookings.length > 0 ? bookings.slice(0, 2) : dummyRecentBookings;
    const pendingPayments = payments.filter((p) => p.status === "pending").length > 0 ? payments.filter((p) => p.status === "pending").slice(0, 2) : dummyPendingPayments;
    const displayNotifications = notifications.length > 0 ? notifications : dummyNotifications;
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
                      onClick: () => handleSectionChange("bookings"),
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
                      onClick: () => handleSectionChange("documents"),
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
                onClick: () => handleSectionChange("bookings"),
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
                  onClick: () => handleSectionChange("bookings"),
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
                  onClick: () => handleSectionChange("payments"),
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
                  onClick: () => handleSectionChange("documents"),
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
                  onClick: () => handleSectionChange("support"),
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
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: formatDate(booking.booking_date) })
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
  const renderBookings = () => {
    const dummyAllBookings = [
      {
        id: 1001,
        booking_number: "YT-2025-001",
        trip_title: "Everest Base Camp Trek",
        trip_id: 1,
        booking_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1e3).toISOString(),
        travel_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
        travelers: 2,
        total_amount: 2890,
        payment_status: "partial",
        booking_status: "confirmed",
        destination: "Nepal, Himalayas"
      },
      {
        id: 1002,
        booking_number: "YT-2025-002",
        trip_title: "Safari Adventure in Serengeti",
        trip_id: 2,
        booking_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString(),
        travel_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1e3).toISOString(),
        travelers: 4,
        total_amount: 4250,
        payment_status: "paid",
        booking_status: "confirmed",
        destination: "Tanzania, Africa"
      },
      {
        id: 1003,
        booking_number: "YT-2025-003",
        trip_title: "Iceland Northern Lights Expedition",
        trip_id: 3,
        booking_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1e3).toISOString(),
        travel_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1e3).toISOString(),
        travelers: 2,
        total_amount: 3200,
        payment_status: "pending",
        booking_status: "confirmed",
        destination: "Reykjavik, Iceland"
      },
      {
        id: 2001,
        booking_number: "YT-2024-998",
        trip_title: "Golden Triangle India Tour",
        trip_id: 4,
        booking_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1e3).toISOString(),
        travel_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3).toISOString(),
        travelers: 3,
        total_amount: 1850,
        payment_status: "paid",
        booking_status: "completed",
        destination: "Delhi, Agra, Jaipur"
      },
      {
        id: 2002,
        booking_number: "YT-2024-997",
        trip_title: "Machu Picchu & Sacred Valley",
        trip_id: 5,
        booking_date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1e3).toISOString(),
        travel_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1e3).toISOString(),
        travelers: 2,
        total_amount: 2450,
        payment_status: "paid",
        booking_status: "completed",
        destination: "Cusco, Peru"
      },
      {
        id: 2003,
        booking_number: "YT-2024-996",
        trip_title: "Bali Paradise Escape",
        trip_id: 6,
        booking_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1e3).toISOString(),
        travel_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1e3).toISOString(),
        travelers: 2,
        total_amount: 1650,
        payment_status: "paid",
        booking_status: "completed",
        destination: "Ubud, Bali"
      }
    ];
    const displayBookings = bookings.length > 0 ? bookings : dummyAllBookings;
    let filteredDisplayBookings = displayBookings;
    if (bookingFilter === "upcoming") {
      filteredDisplayBookings = displayBookings.filter((b) => new Date(b.travel_date) >= /* @__PURE__ */ new Date());
    } else if (bookingFilter === "pending") {
      filteredDisplayBookings = displayBookings.filter((b) => b.payment_status === "pending" || b.booking_status === "pending");
    } else if (bookingFilter === "completed") {
      filteredDisplayBookings = displayBookings.filter((b) => b.booking_status === "completed");
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
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "w-6 h-6 text-blue-600 dark:text-blue-400" }) }),
            __("My Bookings", "My Bookings")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-2", children: __("Manage your trips, download documents, and track your travel history.", "Manage your trips, download documents, and track your travel history.") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: ["all", "upcoming", "pending", "completed"].map((filter) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            role: "button",
            tabIndex: 0,
            onClick: () => setBookingFilter(filter),
            className: `px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${bookingFilter === filter ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`,
            children: __(filter.charAt(0).toUpperCase() + filter.slice(1), filter)
          },
          filter
        )) })
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
        const isUpcoming = new Date(booking.travel_date) > /* @__PURE__ */ new Date();
        const isCompleted = booking.booking_status === "completed";
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
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-4 h-4" }),
                      booking.destination || __("Multiple destinations", "Multiple destinations")
                    ] })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 items-start", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(booking.booking_status), children: __(booking.booking_status, booking.booking_status) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: getBadge(booking.payment_status), children: __(booking.payment_status, booking.payment_status) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-booking-details grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg mb-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3.5 h-3.5" }),
                    __("Travel Date", "Travel Date")
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: formatDate(booking.travel_date) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-3.5 h-3.5" }),
                    __("Travelers", "Travelers")
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: booking.travelers })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "w-3.5 h-3.5" }),
                    __("Total Amount", "Total Amount")
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: currency(booking.total_amount) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3.5 h-3.5" }),
                    __("Booked On", "Booked On")
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: formatDate(booking.booking_date) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-booking-actions flex flex-wrap gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "button", tabIndex: 0, onClick: () => {
                }, className: "yatra-booking-action yatra-booking-action-view inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4" }),
                  __("View Details", "View Details")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "button", tabIndex: 0, onClick: () => {
                }, className: "yatra-booking-action yatra-booking-action-download inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4" }),
                  __("Download Voucher", "Download Voucher")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "button", tabIndex: 0, onClick: () => handleSectionChange("payments"), className: "yatra-booking-action yatra-booking-action-payment inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-4 h-4" }),
                  __("Payment", "Payment")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "button", tabIndex: 0, onClick: () => handleSectionChange("support"), className: "yatra-booking-action yatra-booking-action-support inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LifeBuoy, { className: "w-4 h-4" }),
                  __("Support", "Support")
                ] })
              ] })
            ] })
          },
          booking.id
        );
      }) })
    ] });
  };
  const renderPayments = () => {
    const dummyPayments = [
      {
        id: 101,
        reference: "PAY-934812",
        booking_number: "YT-2025-001",
        amount: 1500,
        status: "paid",
        method: "Credit Card",
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1e3).toISOString(),
        type: "deposit"
      },
      {
        id: 102,
        reference: "PAY-935114",
        booking_number: "YT-2025-001",
        amount: 1390,
        status: "pending",
        method: "Bank Transfer",
        date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1e3).toISOString(),
        type: "balance"
      },
      {
        id: 103,
        reference: "PAY-920014",
        booking_number: "YT-2025-002",
        amount: 2125,
        status: "paid",
        method: "UPI",
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString(),
        type: "deposit"
      },
      {
        id: 104,
        reference: "PAY-920015",
        booking_number: "YT-2025-002",
        amount: 2125,
        status: "pending",
        method: "Credit Card",
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1e3).toISOString(),
        type: "balance"
      },
      {
        id: 105,
        reference: "PAY-910001",
        booking_number: "YT-2025-003",
        amount: 1600,
        status: "paid",
        method: "PayPal",
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1e3).toISOString(),
        type: "deposit"
      },
      {
        id: 106,
        reference: "PAY-910002",
        booking_number: "YT-2025-003",
        amount: 1600,
        status: "pending",
        method: "Bank Transfer",
        date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1e3).toISOString(),
        type: "balance"
      },
      {
        id: 107,
        reference: "PAY-899001",
        booking_number: "YT-2024-998",
        amount: 1850,
        status: "paid",
        method: "Credit Card",
        date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1e3).toISOString(),
        type: "deposit"
      },
      {
        id: 108,
        reference: "PAY-899002",
        booking_number: "YT-2024-998",
        amount: 0,
        status: "paid",
        method: "Credit Card",
        date: new Date(Date.now() - 85 * 24 * 60 * 60 * 1e3).toISOString(),
        type: "balance"
      }
    ];
    const displayPayments = payments.length > 0 ? payments : dummyPayments;
    const paymentStats = {
      total: displayPayments.length,
      paid: displayPayments.filter((p) => p.status === "paid").length,
      pending: displayPayments.filter((p) => p.status === "pending").length,
      totalPaid: displayPayments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0),
      totalPending: displayPayments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
    };
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
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-emerald-600 dark:text-emerald-400", children: paymentStats.paid })
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
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: currency(paymentStats.totalPending) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "w-5 h-5 text-purple-600 dark:text-purple-400" }) })
        ] }) })
      ] }),
      displayPayments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 dark:text-gray-400 font-medium mb-1", children: __("No payments found", "No payments found") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 dark:text-gray-500", children: __("Payment history will appear here once you make a booking.", "Payment history will appear here once you make a booking.") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: displayPayments.map((payment) => {
        const isPending = payment.status === "pending";
        const isPaid = payment.status === "paid";
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-2 rounded-lg ${isPaid ? "bg-emerald-50 dark:bg-emerald-900/20" : isPending ? "bg-amber-50 dark:bg-amber-900/20" : "bg-gray-50 dark:bg-gray-700"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: `w-5 h-5 ${isPaid ? "text-emerald-600 dark:text-emerald-400" : isPending ? "text-amber-600 dark:text-amber-400" : "text-gray-400"}` }) }),
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
                isPaid && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "button", tabIndex: 0, onClick: () => {
                }, className: "yatra-payment-action yatra-payment-action-receipt inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4" }),
                  __("View Receipt", "View Receipt")
                ] }),
                isPending && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "button", tabIndex: 0, onClick: () => {
                }, className: "yatra-payment-action yatra-payment-action-pay inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-medium cursor-pointer", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-4 h-4" }),
                  __("Pay Now", "Pay Now")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "button", tabIndex: 0, onClick: () => handleSectionChange("bookings"), className: "yatra-payment-action yatra-payment-action-booking inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4" }),
                  __("View Booking", "View Booking")
                ] })
              ] })
            ] })
          },
          payment.id
        );
      }) })
    ] });
  };
  const renderDocuments = () => {
    const dummyDocuments = [
      {
        id: 401,
        name: "Everest Base Camp Detailed Itinerary.pdf",
        trip_title: "Everest Base Camp Trek",
        category: "itinerary",
        updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1e3).toISOString(),
        url: "#"
      },
      {
        id: 402,
        name: "Payment Receipt #PAY-934812.pdf",
        trip_title: "Everest Base Camp Trek",
        category: "invoice",
        updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1e3).toISOString(),
        url: "#"
      },
      {
        id: 403,
        name: "Travel Voucher - Everest Base Camp.pdf",
        trip_title: "Everest Base Camp Trek",
        category: "voucher",
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3).toISOString(),
        url: "#"
      },
      {
        id: 404,
        name: "Safari Adventure Itinerary.pdf",
        trip_title: "Safari Adventure in Serengeti",
        category: "itinerary",
        updated_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1e3).toISOString(),
        url: "#"
      },
      {
        id: 405,
        name: "Payment Receipt #PAY-920014.pdf",
        trip_title: "Safari Adventure in Serengeti",
        category: "invoice",
        updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1e3).toISOString(),
        url: "#"
      },
      {
        id: 406,
        name: "Iceland Northern Lights Itinerary.pdf",
        trip_title: "Iceland Northern Lights Expedition",
        category: "itinerary",
        updated_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1e3).toISOString(),
        url: "#"
      },
      {
        id: 407,
        name: "Golden Triangle Travel Voucher.pdf",
        trip_title: "Golden Triangle India Tour",
        category: "voucher",
        updated_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1e3).toISOString(),
        url: "#"
      },
      {
        id: 408,
        name: "Machu Picchu Final Itinerary.pdf",
        trip_title: "Machu Picchu & Sacred Valley",
        category: "itinerary",
        updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1e3).toISOString(),
        url: "#"
      }
    ];
    const displayDocuments = documents.length > 0 ? documents : dummyDocuments;
    const documentsByCategory = {
      itinerary: displayDocuments.filter((d) => d.category === "itinerary"),
      voucher: displayDocuments.filter((d) => d.category === "voucher"),
      invoice: displayDocuments.filter((d) => d.category === "invoice")
    };
    const getCategoryIcon = (category) => {
      switch (category) {
        case "itinerary":
          return /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" });
        case "voucher":
          return /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5 text-emerald-600 dark:text-emerald-400" });
        case "invoice":
          return /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5 text-purple-600 dark:text-purple-400" });
        default:
          return /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5 text-gray-600 dark:text-gray-400" });
      }
    };
    const getCategoryBg = (category) => {
      switch (category) {
        case "itinerary":
          return "bg-blue-50 dark:bg-blue-900/20";
        case "voucher":
          return "bg-emerald-50 dark:bg-emerald-900/20";
        case "invoice":
          return "bg-purple-50 dark:bg-purple-900/20";
        default:
          return "bg-gray-50 dark:bg-gray-900/40";
      }
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-documents-page space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yatra-documents-header bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-6 h-6 text-purple-600 dark:text-purple-400" }) }),
          __("Travel Documents", "Travel Documents")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-2", children: __("Download itineraries, vouchers, invoices, and other documents for each trip.", "Download itineraries, vouchers, invoices, and other documents for each trip.") })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-documents-stats flex flex-nowrap gap-6 overflow-x-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Itineraries", "Itineraries") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-blue-600 dark:text-blue-400", children: documentsByCategory.itinerary.length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Vouchers", "Vouchers") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-emerald-600 dark:text-emerald-400", children: documentsByCategory.voucher.length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5 text-emerald-600 dark:text-emerald-400" }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Invoices", "Invoices") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-purple-600 dark:text-purple-400", children: documentsByCategory.invoice.length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5 text-purple-600 dark:text-purple-400" }) })
        ] }) })
      ] }),
      displayDocuments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 dark:text-gray-400 font-medium mb-1", children: __("No documents found", "No documents found") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 dark:text-gray-500", children: __("Documents will appear here once you make a booking.", "Documents will appear here once you make a booking.") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: displayDocuments.map((doc) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-3 rounded-lg ${getCategoryBg(doc.category)} flex-shrink-0`, children: getCategoryIcon(doc.category) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4 mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: doc.trip_title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-bold text-gray-900 dark:text-white mb-1 truncate", children: doc.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-4 h-4" }),
                    __("Updated", "Updated"),
                    ": ",
                    formatDate(doc.updated_at)
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize flex-shrink-0", children: doc.category })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yatra-document-actions flex flex-wrap gap-3 mt-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "button", tabIndex: 0, onClick: () => {
                }, className: "yatra-document-action yatra-document-action-download inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4" }),
                  __("Download", "Download")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "button", tabIndex: 0, onClick: () => {
                }, className: "yatra-document-action yatra-document-action-preview inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4" }),
                  __("Preview", "Preview")
                ] })
              ] })
            ] })
          ] }) })
        },
        doc.id
      )) })
    ] });
  };
  const renderProfile = () => {
    const handleInputChange = (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    };
    const handleSave = () => {
      setIsEditing(false);
    };
    const handleCancel = () => {
      setIsEditing(false);
      if (displayProfile) {
        setFormData({
          name: displayProfile.name || "",
          email: displayProfile.email || "",
          phone: displayProfile.phone || "",
          address: displayProfile.address || "",
          city: displayProfile.city || "",
          country: displayProfile.country || ""
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
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white truncate", children: trip.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: formatDate(trip.next_departure) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right ml-4 flex-shrink-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __("From", "From") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: currency(trip.price_from) })
            ] })
          ] }, trip.id)) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 text-center py-4", children: __("No saved trips yet", "No saved trips yet") }) })
        ] })
      ] })
    ] });
  };
  const renderSupport = () => {
    const dummyTickets = [
      {
        id: 9001,
        subject: "Request vegetarian meal preference",
        status: "awaiting_response",
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: 9002,
        subject: "Need insurance letter for visa",
        status: "resolved",
        updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: 9003,
        subject: "Flight booking assistance needed",
        status: "open",
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: 9004,
        subject: "Question about trekking equipment",
        status: "resolved",
        updated_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: 9005,
        subject: "Payment issue with booking YT-2025-001",
        status: "resolved",
        updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1e3).toISOString()
      }
    ];
    const displayTickets = supportTickets.length > 0 ? supportTickets : dummyTickets;
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
  const renderSection = () => {
    switch (section) {
      case "dashboard":
        return renderDashboard();
      case "bookings":
        return renderBookings();
      case "payments":
        return renderPayments();
      case "documents":
        return renderDocuments();
      case "profile":
        return renderProfile();
      case "support":
        return renderSupport();
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
