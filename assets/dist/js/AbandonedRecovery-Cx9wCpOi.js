import { d as Mail, ar as Clock, bn as BarChart, Z as Zap, T as TrendingUp, as as DollarSign, U as Users, az as AlertCircle, bh as Send, au as Shield, j as jsxRuntimeExports, S as Sparkles, at as ArrowRight, J as RefreshCw, av as CheckCircle, t as useQueryClient, r as reactExports, u as useQuery, v as useMutation, aQ as Eye, aN as Trash2, l as Settings } from "./react-vendor-zODANjVp.js";
import { B as Button, C as Card, d as CardContent, e as Badge, P as PageHeader, Q as Skeleton, f as CardHeader, g as CardTitle, w as Label, h as CardDescription, aw as SearchFilterToolbar, a2 as BulkActionToolbar, U as Table, W as Pagination, I as Input, k as ConfirmationDialog, M as Modal } from "../../admin/dist/js/app.js";
import { T as Toggle } from "./toggle-B0m9K-Pk.js";
import { _ as __, u as useToast, f as formatYatraMoney, b as apiService } from "./index-zauBMzvd.js";
const AbandonedRecoveryPremium = () => {
  const features = [
    {
      icon: Mail,
      title: __("Automated Recovery Emails"),
      description: __(
        "Send automated follow-up emails to customers who abandoned their bookings."
      )
    },
    {
      icon: Clock,
      title: __("Smart Timing"),
      description: __(
        "Configure intelligent timing for recovery emails based on customer behavior."
      )
    },
    {
      icon: BarChart,
      title: __("Recovery Analytics"),
      description: __(
        "Track recovery rates, email performance, and revenue recovered."
      )
    },
    {
      icon: Zap,
      title: __("Instant Notifications"),
      description: __(
        "Get real-time alerts when new abandoned bookings are detected."
      )
    }
  ];
  const stats = [
    {
      icon: TrendingUp,
      value: "35%",
      label: __("Average Recovery Rate")
    },
    {
      icon: DollarSign,
      value: "$2.5k",
      label: __("Revenue Recovered")
    },
    {
      icon: Users,
      value: "89%",
      label: __("Customer Retention")
    },
    {
      icon: Mail,
      value: "1.2k",
      label: __("Emails Sent")
    }
  ];
  const recoverySteps = [
    {
      icon: AlertCircle,
      title: __("Detection"),
      description: __(
        "Automatically detect when a booking is abandoned during checkout."
      ),
      timing: __("Real-time")
    },
    {
      icon: Mail,
      title: __("First Follow-up"),
      description: __(
        "Send initial recovery email within customizable timeframe."
      ),
      timing: __("1-2 hours")
    },
    {
      icon: Send,
      title: __("Sequence Emails"),
      description: __(
        "Send multiple follow-up emails with increasing urgency."
      ),
      timing: __("24-72 hours")
    },
    {
      icon: Shield,
      title: __("Conversion"),
      description: __(
        "Track recovered bookings and calculate recovery success."
      ),
      timing: __("Ongoing")
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-6 h-6 text-amber-600 dark:text-amber-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-amber-900 dark:text-amber-100", children: __("Premium Feature") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-amber-700 dark:text-amber-300 text-sm", children: __(
            "Abandoned Booking Recovery is a premium module. Upgrade to Yatra Pro to recover lost revenue."
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          className: "bg-amber-600 text-white hover:bg-amber-700 px-6 py-2 text-sm font-medium",
          onClick: () => window.open(
            "https://wpyatra.com/pricing?module=abandoned-recovery",
            "_blank"
          ),
          children: [
            __("Upgrade to Pro"),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-8 h-8 text-green-600 dark:text-green-400" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center space-x-2 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl font-bold text-gray-900 dark:text-white", children: __("Abandoned Booking Recovery") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-3 h-3 mr-1" }),
          __("PRO")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto", children: __(
        "Recover lost revenue from abandoned bookings with intelligent automated email sequences and recovery analytics."
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-12", children: stats.map((stat, index) => {
      const Icon = stat.icon;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        Card,
        {
          className: "border border-gray-200 dark:border-gray-700",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-5 h-5 text-green-600 dark:text-green-400" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: stat.value }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: stat.label })
            ] })
          ] }) })
        },
        index
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center", children: __("Powerful Features") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: features.map((feature, index) => {
        const Icon = feature.icon;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Card,
          {
            className: "border border-gray-200 dark:border-gray-700",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-6 h-6 text-green-600 dark:text-green-400" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2", children: feature.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400 text-sm", children: feature.description })
              ] })
            ] }) })
          },
          index
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center", children: __("How Recovery Works") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: recoverySteps.map((step, index) => {
        const Icon = step.icon;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Card,
          {
            className: "border border-gray-200 dark:border-gray-700",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-5 h-5 text-green-600 dark:text-green-400" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-gray-900 dark:text-white mb-2", children: step.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-3", children: step.description }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", children: step.timing })
              ] })
            ] }) })
          },
          index
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 md:mb-0 md:pr-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-6 h-6 text-green-600 dark:text-green-400" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: __("Recover Lost Revenue") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-4", children: __(
          "Turn abandoned bookings into completed reservations with intelligent automated recovery sequences and maximize your revenue with Yatra Pro."
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Automated recovery emails") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Smart timing sequences") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Recovery analytics") })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            className: "bg-green-600 text-white hover:bg-green-700 px-8 py-3 text-sm font-medium mb-3",
            onClick: () => window.open(
              "https://wpyatra.com/pricing?module=abandoned-recovery",
              "_blank"
            ),
            children: [
              __("Upgrade to Pro"),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __("14-day money-back guarantee") })
      ] })
    ] }) })
  ] });
};
const SkeletonStatCard = () => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-32 mb-2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-24" })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-8 h-8 rounded-full" })
] }) }) });
const SkeletonBookingCard = () => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-40 mb-2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-48 mb-1" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-32" })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right mr-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-20 mb-1" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24" })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-20 mr-4" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-28" })
] });
const isModuleAvailable = () => {
  const yatraAdmin = window == null ? void 0 : window.yatraAdmin;
  return Boolean(yatraAdmin == null ? void 0 : yatraAdmin.isPro);
};
const formatPrice = (price, currencyCode) => {
  var _a;
  const globalCurrency = ((_a = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a.currency) || "USD";
  const currency = globalCurrency;
  return formatYatraMoney(Number(price) || 0, currency, {
    zeroAsUnknown: false
  });
};
const AbandonedRecoveryPage = ({ tab }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get("action");
  const bookingId = urlParams.get("id");
  const [viewModalOpen, setViewModalOpen] = reactExports.useState(false);
  const [selectedBooking, setSelectedBooking] = reactExports.useState(null);
  const [activeTab, setActiveTab] = reactExports.useState(
    tab === "abandoned-booking" ? "bookings" : tab === "settings" ? "settings" : "dashboard"
  );
  reactExports.useEffect(() => {
    const newTab = tab === "abandoned-booking" ? "bookings" : tab === "settings" ? "settings" : "dashboard";
    setActiveTab(newTab);
  }, [tab]);
  const [page, setPage] = reactExports.useState(1);
  const [perPage] = reactExports.useState(20);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [selectedIds, setSelectedIds] = reactExports.useState([]);
  const [bulkAction, setBulkAction] = reactExports.useState("");
  const [settings, setSettings] = reactExports.useState({
    enabled: true,
    tracking_enabled: true,
    first_email_delay_hours: 1,
    second_email_delay_hours: 24,
    final_email_delay_hours: 72
  });
  const [isSavingSettings, setIsSavingSettings] = reactExports.useState(false);
  const [confirmDialog, setConfirmDialog] = reactExports.useState({ isOpen: false, title: "", message: "", onConfirm: () => {
  } });
  const openGlobalAbandonedTemplate = (stage = "first") => {
    const coreTemplate = stage === "second" ? "abandoned_booking_recovery_second" : stage === "final" ? "abandoned_booking_recovery_final" : "abandoned_booking_recovery_first";
    window.location.href = `admin.php?page=yatra&subpage=email-automation&tab=template&action=edit&core_template=${coreTemplate}`;
  };
  const moduleAvailable = isModuleAvailable();
  const queryParams = reactExports.useMemo(() => {
    const params = {
      page,
      per_page: perPage
    };
    if (searchTerm) {
      params.search = searchTerm;
    }
    if (statusFilter !== "all") {
      params.status = statusFilter;
    }
    return params;
  }, [searchTerm, statusFilter, page, perPage]);
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ["abandoned-bookings", queryParams],
    queryFn: async () => {
      const paramsObj = {};
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== void 0) paramsObj[key] = value;
      });
      const response = await apiService.getAbandonedBookings(paramsObj);
      return response;
    }
  });
  const { data: bookingDetailsData, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["abandoned-booking-details", bookingId],
    queryFn: async () => {
      const response = await apiService.getAbandonedBooking(bookingId);
      return response.data;
    },
    enabled: !!bookingId
  });
  const { data: modalBookingData, isLoading: isModalLoading } = useQuery({
    queryKey: ["abandoned-booking-modal", selectedBooking == null ? void 0 : selectedBooking.id],
    queryFn: async () => {
      const response = await apiService.getAbandonedBooking(
        selectedBooking.id
      );
      return response.data;
    },
    enabled: !!(selectedBooking == null ? void 0 : selectedBooking.id) && viewModalOpen
  });
  const { data: settingsData } = useQuery({
    queryKey: ["abandoned-recovery-settings"],
    queryFn: async () => {
      const response = await apiService.getAbandonedBookingsSettings();
      return response;
    }
  });
  reactExports.useEffect(() => {
    if (settingsData == null ? void 0 : settingsData.data) {
      setSettings(settingsData.data);
    }
  }, [settingsData]);
  const { data: statsData } = useQuery({
    queryKey: ["abandoned-statistics"],
    queryFn: async () => {
      const response = await apiService.getAbandonedBookingsStatistics();
      return response;
    }
  });
  const sendEmailMutation = useMutation({
    mutationFn: async (id) => {
      return await apiService.sendAbandonedBookingEmail(id);
    },
    onSuccess: () => {
      showToast(__("Recovery email sent successfully"), "success");
      queryClient.invalidateQueries({ queryKey: ["abandoned-bookings"] });
    },
    onError: () => {
      showToast(__("Failed to send recovery email"), "error");
    }
  });
  const stats = (statsData == null ? void 0 : statsData.data) || {};
  const bookings = (bookingsData == null ? void 0 : bookingsData.data) || [];
  const pagination = (bookingsData == null ? void 0 : bookingsData.pagination) || {
    total: 0,
    current_page: 1,
    total_pages: 1
  };
  const deleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map((id) => apiService.deleteAbandonedBooking(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abandoned-bookings"] });
      setSelectedIds([]);
      showToast(__("Bookings deleted successfully"), "success");
    },
    onError: () => {
      showToast(__("Failed to delete bookings"), "error");
    }
  });
  const handleBulkApply = () => {
    if (!bulkAction) {
      showToast(__("Select a bulk action first"), "warning");
      return;
    }
    if (selectedIds.length === 0) {
      showToast(__("Select at least one booking"), "warning");
      return;
    }
    if (bulkAction === "delete") {
      setConfirmDialog({
        isOpen: true,
        title: __("Delete Bookings"),
        message: __(
          "Are you sure you want to delete {count} booking(s)?"
        ).replace("{count}", selectedIds.length.toString()),
        onConfirm: () => {
          deleteMutation.mutate(selectedIds);
          setConfirmDialog({
            isOpen: false,
            title: "",
            message: "",
            onConfirm: () => {
            }
          });
        }
      });
    }
  };
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPage(1);
    setSelectedIds([]);
    setBulkAction("");
  };
  const hasFilters = Boolean(searchTerm || statusFilter !== "all");
  const viewFilters = [
    { key: "all", label: __("All"), count: stats.total_abandoned || 0 },
    {
      key: "abandoned",
      label: __("Abandoned"),
      count: stats.total_abandoned - stats.total_recovered - stats.total_expired - stats.total_contacted || 0
    },
    {
      key: "contacted",
      label: __("Contacted"),
      count: stats.total_contacted || 0
    },
    {
      key: "recovered",
      label: __("Recovered"),
      count: stats.total_recovered || 0
    },
    { key: "expired", label: __("Expired"), count: stats.total_expired || 0 }
  ];
  const columns = [
    {
      key: "customer",
      label: __("Customer"),
      render: (booking) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: booking.customer_name || __("Unknown") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-500 dark:text-gray-400", children: booking.customer_email })
      ] })
    },
    {
      key: "trip",
      label: __("Trip"),
      render: (booking) => {
        var _a, _b;
        const tripBase = ((_a = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a.tripBase) || "trip";
        const siteUrl = ((_b = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _b.siteUrl) || "";
        const tripUrl = booking.trip_slug ? `${siteUrl}/${tripBase}/${booking.trip_slug}` : `${siteUrl}/?p=${booking.trip_id}`;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "a",
            {
              href: tripUrl,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium",
              children: booking.trip_name
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: [
            "ID: ",
            booking.trip_id
          ] })
        ] });
      }
    },
    {
      key: "amount",
      label: __("Amount"),
      render: (booking) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: formatPrice(booking.total_amount) })
    },
    {
      key: "emails_sent",
      label: __("Emails Sent"),
      render: (booking) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", children: booking.recovery_emails_sent || 0 })
    },
    {
      key: "status",
      label: __("Status"),
      render: (booking) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: booking.status === "recovered" ? "success" : "default", children: booking.status })
    },
    {
      key: "date",
      label: __("Date"),
      render: (booking) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-500 dark:text-gray-400", children: new Date(booking.created_at).toLocaleDateString() })
    }
  ];
  const actions = [
    {
      key: "view",
      label: __("View Details"),
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4" }),
      onClick: (item) => {
        setSelectedBooking(item);
        setViewModalOpen(true);
      }
    },
    {
      key: "send-email",
      label: __("Send Email"),
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-4 h-4" }),
      onClick: (item) => {
        setConfirmDialog({
          isOpen: true,
          title: __("Send Recovery Email"),
          message: __(
            "Are you sure you want to send a recovery email to {email}?"
          ).replace("{email}", item.customer_email),
          onConfirm: () => {
            sendEmailMutation.mutate(item.id);
            setConfirmDialog({
              isOpen: false,
              title: "",
              message: "",
              onConfirm: () => {
              }
            });
          }
        });
      },
      condition: (item) => item.status !== "recovered"
    },
    {
      key: "delete",
      label: __("Delete"),
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" }),
      onClick: (item) => {
        setConfirmDialog({
          isOpen: true,
          title: __("Delete Booking"),
          message: __(
            "Are you sure you want to delete this abandoned booking?"
          ),
          onConfirm: () => {
            deleteMutation.mutate([item.id]);
            setConfirmDialog({
              isOpen: false,
              title: "",
              message: "",
              onConfirm: () => {
              }
            });
          }
        });
      },
      variant: "destructive"
    }
  ];
  const saveSettingsMutation = useMutation({
    mutationFn: async (data) => {
      return await apiService.saveAbandonedBookingsSettings(data);
    },
    onSuccess: () => {
      showToast(__("Settings saved successfully"), "success");
      queryClient.invalidateQueries({
        queryKey: ["abandoned-recovery-settings"]
      });
      setIsSavingSettings(false);
    },
    onError: () => {
      showToast(__("Failed to save settings"), "error");
      setIsSavingSettings(false);
    }
  });
  const handleSaveSettings = () => {
    setIsSavingSettings(true);
    saveSettingsMutation.mutate(settings);
  };
  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };
  if (action === "view" && bookingId) {
    const booking = bookingDetailsData == null ? void 0 : bookingDetailsData.data;
    if (isLoadingDetails) {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PageHeader, { title: __("Loading Booking Details..."), description: "" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-64" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-full" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-full" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-3/4" })
        ] }) }) })
      ] });
    }
    if (!booking) {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PageHeader, { title: __("Booking Not Found"), description: "" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500", children: __("The booking you are looking for does not exist.") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              className: "mt-4",
              onClick: () => {
                var _a;
                return window.location.href = `${((_a = window.yatraAdmin) == null ? void 0 : _a.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=abandoned-recovery&tab=abandoned-booking`;
              },
              children: __("Back to Abandoned Bookings")
            }
          )
        ] }) })
      ] });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        PageHeader,
        {
          title: __("Abandoned Booking Details"),
          description: `Booking ID: ${booking.id}`,
          actions: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              onClick: () => {
                var _a;
                return window.location.href = `${((_a = window.yatraAdmin) == null ? void 0 : _a.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=abandoned-recovery&tab=abandoned-booking`;
              },
              children: __("Back to List")
            }
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Customer Information") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Name") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white mt-1", children: booking.customer_name || __("Unknown") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Email") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white mt-1", children: booking.customer_email })
              ] }),
              booking.customer_phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Phone") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white mt-1", children: booking.customer_phone })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Trip Information") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Trip Name") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white mt-1", children: booking.trip_name })
              ] }),
              booking.departure_date && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Departure Date") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white mt-1", children: new Date(booking.departure_date).toLocaleDateString() })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Travelers") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white mt-1", children: booking.travelers_count || 1 })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Total Amount") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white mt-1", children: formatPrice(booking.total_amount) })
              ] })
            ] }) })
          ] }),
          booking.booking_data && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Additional Details") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gray-50 dark:bg-gray-900 rounded-lg p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-xs text-gray-700 dark:text-gray-300 overflow-x-auto", children: JSON.stringify(booking.booking_data, null, 2) }) }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Booking Status") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Status") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Badge,
                  {
                    variant: booking.status === "recovered" ? "success" : "default",
                    children: booking.status
                  }
                ) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Recovery Emails Sent") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white mt-1", children: booking.recovery_emails_sent || 0 })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Created At") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white mt-1", children: new Date(booking.created_at).toLocaleString() })
              ] }),
              booking.last_email_sent_at && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Last Email Sent") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white mt-1", children: new Date(booking.last_email_sent_at).toLocaleString() })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Actions") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  className: "w-full",
                  onClick: () => {
                    setConfirmDialog({
                      isOpen: true,
                      title: __("Send Recovery Email"),
                      message: __(
                        "Are you sure you want to send a recovery email to {email}?"
                      ).replace("{email}", booking.customer_email),
                      onConfirm: () => {
                        sendEmailMutation.mutate(booking.id);
                        setConfirmDialog({
                          isOpen: false,
                          title: "",
                          message: "",
                          onConfirm: () => {
                          }
                        });
                      }
                    });
                  },
                  disabled: booking.status === "recovered" || sendEmailMutation.isPending,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-4 h-4 mr-2" }),
                    __("Send Recovery Email")
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "destructive",
                  className: "w-full",
                  onClick: () => {
                    setConfirmDialog({
                      isOpen: true,
                      title: __("Delete Booking"),
                      message: __(
                        "Are you sure you want to delete this abandoned booking?"
                      ),
                      onConfirm: () => {
                        deleteMutation.mutate([booking.id]);
                        setConfirmDialog({
                          isOpen: false,
                          title: "",
                          message: "",
                          onConfirm: () => {
                          }
                        });
                        setTimeout(() => {
                          var _a;
                          window.location.href = `${((_a = window.yatraAdmin) == null ? void 0 : _a.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=abandoned-recovery&tab=abandoned-booking`;
                        }, 1e3);
                      }
                    });
                  },
                  disabled: deleteMutation.isPending,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 mr-2" }),
                    __("Delete Booking")
                  ]
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] });
  }
  if (!moduleAvailable) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AbandonedRecoveryPremium, {});
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        title: __("Abandoned Booking Recovery"),
        description: __(
          "Track and recover abandoned bookings with automated email campaigns"
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "-mb-px flex space-x-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setActiveTab("dashboard"),
          className: `py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "dashboard" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BarChart, { className: "w-5 h-5 inline-block mr-2" }),
            __("Dashboard")
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => {
            var _a;
            window.location.href = `${((_a = window.yatraAdmin) == null ? void 0 : _a.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=abandoned-recovery&tab=abandoned-booking`;
          },
          className: `py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "bookings" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-5 h-5 inline-block mr-2" }),
            __("Abandoned Bookings")
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => {
            var _a;
            window.location.href = `${((_a = window.yatraAdmin) == null ? void 0 : _a.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=abandoned-recovery&tab=settings`;
          },
          className: `py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "settings" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "w-5 h-5 inline-block mr-2" }),
            __("Settings")
          ]
        }
      )
    ] }) }) }),
    activeTab === "dashboard" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonStatCard, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonStatCard, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonStatCard, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonStatCard, {})
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Total Abandoned") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold", children: stats.total_abandoned || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-8 h-8 text-orange-600 dark:text-orange-400" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Recovered") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-green-600 dark:text-green-400", children: stats.total_recovered || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-8 h-8 text-green-600 dark:text-green-400" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Recovery Rate") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-3xl font-bold text-blue-600 dark:text-blue-400", children: [
              stats.recovery_rate || 0,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "w-8 h-8 text-blue-600 dark:text-blue-400" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Revenue Recovered") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-3xl font-bold text-purple-600 dark:text-purple-400", children: [
              "$",
              (stats.total_recovered_value || 0).toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "w-8 h-8 text-purple-600 dark:text-purple-400" })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Recent Abandoned Bookings") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __("Latest bookings that were started but not completed") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBookingCard, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBookingCard, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBookingCard, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBookingCard, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBookingCard, {})
        ] }) : bookings.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-gray-500", children: __("No abandoned bookings found") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: bookings.slice(0, 5).map((booking) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: booking.customer_name || __("Unknown Customer") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: booking.customer_email }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: booking.trip_name })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right mr-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: formatPrice(booking.total_amount) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-500", children: [
                  booking.travelers_count,
                  " ",
                  __("travelers")
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  variant: booking.status === "recovered" ? "success" : "default",
                  children: booking.status
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  size: "sm",
                  variant: "outline",
                  className: "ml-4",
                  onClick: () => {
                    setConfirmDialog({
                      isOpen: true,
                      title: __("Send Recovery Email"),
                      message: __(
                        "Are you sure you want to send a recovery email to {email}?"
                      ).replace("{email}", booking.customer_email),
                      onConfirm: () => {
                        sendEmailMutation.mutate(booking.id);
                        setConfirmDialog({
                          isOpen: false,
                          title: "",
                          message: "",
                          onConfirm: () => {
                          }
                        });
                      }
                    });
                  },
                  disabled: sendEmailMutation.isPending,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-4 h-4 mr-2" }),
                    __("Send Email")
                  ]
                }
              )
            ]
          },
          booking.id
        )) }) })
      ] })
    ] }),
    activeTab === "bookings" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        SearchFilterToolbar,
        {
          searchTerm,
          onSearchChange: setSearchTerm,
          statusFilter,
          onStatusChange: (value) => {
            setStatusFilter(value);
            setPage(1);
            setSelectedIds([]);
            setBulkAction("");
          },
          statusOptions: [
            { value: "all", label: __("All Status") },
            { value: "abandoned", label: __("Abandoned") },
            { value: "contacted", label: __("Contacted") },
            { value: "recovered", label: __("Recovered") },
            { value: "expired", label: __("Expired") }
          ],
          sortBy: "created_at",
          onSortByChange: () => {
          },
          sortOrder: "desc",
          onSortOrderChange: () => {
          },
          sortOptions: [
            { value: "created_at", label: __("Date") },
            { value: "customer_email", label: __("Email") }
          ],
          onResetFilters: handleResetFilters,
          hasFilters,
          placeholder: __("Search by customer email...")
        }
      ) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        BulkActionToolbar,
        {
          selectedIds,
          bulkAction,
          setBulkAction,
          onApply: handleBulkApply,
          onClearSelection: () => setSelectedIds([]),
          statusFilter,
          setStatusFilter: (value) => {
            setStatusFilter(value);
            setPage(1);
            setSelectedIds([]);
            setBulkAction("");
          },
          statusOptions: viewFilters,
          bulkMutationPending: deleteMutation.isPending,
          totalItems: bookings.length,
          bulkActionOptions: [
            { value: "delete", label: __("Delete", "yatra") }
          ],
          showColumnsDropdown: false,
          setShowColumnsDropdown: () => {
          },
          columnOptions: [],
          onToggleColumn: () => {
          }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-visible", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0 overflow-visible", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Table,
        {
          data: bookings,
          columns,
          actions,
          isLoading,
          selectedItemIds: selectedIds,
          onSelectItem: (id, checked) => {
            if (checked) {
              setSelectedIds([...selectedIds, id]);
            } else {
              setSelectedIds(
                selectedIds.filter((selectedId) => selectedId !== id)
              );
            }
          },
          onSelectAll: (checked) => {
            if (checked) {
              setSelectedIds(bookings.map((b) => b.id));
            } else {
              setSelectedIds([]);
            }
          },
          isAllSelected: selectedIds.length === bookings.length && bookings.length > 0,
          emptyText: __("No abandoned bookings found"),
          emptyDescription: __(
            "Abandoned bookings will appear here when customers start but don't complete the booking process"
          )
        }
      ) }) }),
      pagination.total_pages > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Pagination,
        {
          currentPage: pagination.current_page,
          totalPages: pagination.total_pages,
          onPageChange: setPage,
          totalItems: pagination.total,
          itemsPerPage: perPage
        }
      )
    ] }),
    activeTab === "settings" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("General Settings") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __("Configure abandoned booking tracking") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: "tracking_enabled",
                className: "text-base font-medium",
                children: __("Enable Tracking")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __("Track when customers abandon the booking process") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Toggle,
            {
              checked: settings.tracking_enabled,
              onChange: (checked) => handleSettingChange("tracking_enabled", checked)
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Email Timing") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __("Configure when recovery emails are sent") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "first_email_delay", children: __("First Email Delay (hours)") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "first_email_delay",
                type: "number",
                min: "0",
                value: settings.first_email_delay_hours,
                onChange: (e) => handleSettingChange(
                  "first_email_delay_hours",
                  parseInt(e.target.value)
                ),
                placeholder: "1"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __("Send first recovery email after this many hours") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "second_email_delay", children: __("Second Email Delay (hours)") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "second_email_delay",
                type: "number",
                min: "0",
                value: settings.second_email_delay_hours,
                onChange: (e) => handleSettingChange(
                  "second_email_delay_hours",
                  parseInt(e.target.value)
                ),
                placeholder: "24"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __("Send second recovery email after this many hours") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "final_email_delay", children: __("Final Email Delay (hours)") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "final_email_delay",
                type: "number",
                min: "0",
                value: settings.final_email_delay_hours,
                onChange: (e) => handleSettingChange(
                  "final_email_delay_hours",
                  parseInt(e.target.value)
                ),
                placeholder: "72"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __("Send final recovery email after this many hours") })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Email Templates") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
            "Abandoned Recovery uses the centralized email template system (Email → Templates)."
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300", children: __(
              "To keep designs consistent across all emails, Abandoned Recovery uses the global template. Edit it from the centralized Templates screen."
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "list-disc pl-5 mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                "Templates: Abandoned booking recovery (First / Second / Final)"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                "Merge tags include {{recovery_intro_html}}, {{recovery_link}}, and {{recovery_reminder_label}}."
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-2 justify-end", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => openGlobalAbandonedTemplate("first"),
                children: __("Edit First email template")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => openGlobalAbandonedTemplate("second"),
                children: __("Edit Second email template")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => openGlobalAbandonedTemplate("final"),
                children: __("Edit Final email template")
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: handleSaveSettings,
          disabled: isSavingSettings,
          size: "lg",
          children: isSavingSettings ? __("Saving...") : __("Save Settings")
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: confirmDialog.isOpen,
        onClose: () => setConfirmDialog({
          isOpen: false,
          title: "",
          message: "",
          onConfirm: () => {
          }
        }),
        onConfirm: confirmDialog.onConfirm,
        title: confirmDialog.title,
        message: confirmDialog.message
      }
    ),
    false,
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: viewModalOpen,
        onClose: () => {
          setViewModalOpen(false);
          setSelectedBooking(null);
        },
        title: __("Booking Details"),
        size: "lg",
        footer: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end space-x-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "outline",
            onClick: () => {
              setViewModalOpen(false);
              setSelectedBooking(null);
            },
            children: __("Close")
          }
        ) }),
        children: isModalLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-32" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-full" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-3/4" })
        ] }) : modalBookingData ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold mb-3", children: __("Customer Information") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500", children: __("Name") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: modalBookingData.customer_name || __("Unknown") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500", children: __("Email") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: modalBookingData.customer_email || __("Not provided") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500", children: __("Phone") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: modalBookingData.customer_phone || __("Not provided") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500", children: __("Session ID") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-sm", children: modalBookingData.session_id })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold mb-3", children: __("Trip Information") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500", children: __("Trip") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: modalBookingData.trip_name || __("Unknown Trip") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500", children: __("Departure Date") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: modalBookingData.departure_date || __("Not set") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500", children: __("Travelers") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: modalBookingData.travelers_count || 1 })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500", children: __("Total Amount") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: formatPrice(modalBookingData.total_amount || 0) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold mb-3", children: __("Status & Dates") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500", children: __("Status") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Badge,
                  {
                    variant: modalBookingData.status === "recovered" ? "success" : "warning",
                    children: modalBookingData.status
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500", children: __("Created") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: new Date(modalBookingData.created_at).toLocaleString() })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500", children: __("Expires") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: new Date(modalBookingData.expires_at).toLocaleString() })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-gray-500", children: __("Emails Sent") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: modalBookingData.recovery_emails_sent || 0 })
              ] })
            ] })
          ] }),
          modalBookingData.booking_data && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold mb-3", children: __("Form Data") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gray-50 dark:bg-gray-900 p-4 rounded-md max-h-40 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-xs", children: JSON.stringify(modalBookingData.booking_data, null, 2) }) })
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500", children: __("No booking data available.") })
      }
    )
  ] });
};
export {
  AbandonedRecoveryPage as default
};
//# sourceMappingURL=AbandonedRecovery-Cx9wCpOi.js.map
