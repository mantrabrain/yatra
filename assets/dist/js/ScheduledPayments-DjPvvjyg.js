import { i as CreditCard, b_ as Link, c2 as BellRing, c3 as ListChecks, p as CalendarClock, bC as ShieldCheck, j as jsxRuntimeExports, S as Sparkles, au as ArrowRight, r as reactExports, v as useQueryClient, u as useQuery, bg as Ban, aA as AlertCircle } from "./react-vendor-Dl45l0PD.js";
import { _ as __, u as useToast, q as formatDateTime, s as sprintf, e as formatDate, f as formatYatraMoney, b as apiService } from "./index-0YqMQ0Gb.js";
import { B as Button, C as Card, d as CardContent, u as usePermissions, $ as isModuleActive, P as PageHeader, a9 as SearchFilterToolbar, O as Table, U as Pagination, M as Modal, e as Badge, a2 as useNavigate } from "../../admin/dist/js/app.js";
const ScheduledPaymentsPremium = () => {
  const features = [
    {
      icon: CreditCard,
      title: __("Automatic balance collection"),
      description: __(
        "Take the deposit at checkout and let Yatra charge the remaining balance on the date you choose."
      )
    },
    {
      icon: Link,
      title: __("Secure payment links"),
      description: __(
        "For deposits paid by bank transfer or Pay Later, the customer gets a secure link to settle the balance."
      )
    },
    {
      icon: BellRing,
      title: __("Balance reminders"),
      description: __(
        "Reminder emails go out before the balance is due, with success and failure notices for you and the customer."
      )
    },
    {
      icon: ListChecks,
      title: __("Instalment plans"),
      description: __(
        "Split the balance into several instalments, or collect it in one payment a set number of days before departure."
      )
    },
    {
      icon: CalendarClock,
      title: __("Scheduled payments list"),
      description: __(
        "See every upcoming, paid, failed and cancelled balance payment in one place, and cancel any that should not run."
      )
    },
    {
      icon: ShieldCheck,
      title: __("Safe by design"),
      description: __(
        "A balance is re-checked before every charge, so a booking that was cancelled or already settled is never charged."
      )
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-6 h-6 text-amber-600 dark:text-amber-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-amber-900 dark:text-amber-100", children: __("Premium Feature") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-amber-700 dark:text-amber-300 text-sm", children: __(
            "Scheduled Payments is a premium module. Upgrade to Yatra Pro to collect booking balances automatically."
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          className: "bg-amber-600 text-white hover:bg-amber-700 px-6 py-2 text-sm font-medium",
          onClick: () => window.open(
            "https://wpyatra.com/pricing?module=scheduled-payments",
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
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarClock, { className: "w-8 h-8 text-blue-600 dark:text-blue-400" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center space-x-2 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl font-bold text-gray-900 dark:text-white", children: __("Scheduled Payments") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-3 h-3 mr-1" }),
          __("PRO")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto", children: __(
        "Let travellers pay a deposit today and have Yatra collect the balance before departure — automatically, or with a secure payment link."
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: features.map((feature, index) => {
      const Icon = feature.icon;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-gray-900 dark:text-white mb-2", children: feature.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: feature.description })
      ] }) }, index);
    }) })
  ] });
};
const PER_PAGE = 20;
const ScheduledPayments = () => {
  var _a, _b;
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [page, setPage] = reactExports.useState(1);
  const [toCancel, setToCancel] = reactExports.useState(null);
  const [cancelling, setCancelling] = reactExports.useState(false);
  const [view, setView] = reactExports.useState("scheduled");
  const [sendingLinkFor, setSendingLinkFor] = reactExports.useState(null);
  const { can } = usePermissions();
  const { navigate } = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [moduleAvailable, setModuleAvailable] = reactExports.useState(
    () => isModuleActive("scheduled_payments")
  );
  reactExports.useEffect(() => {
    const sync = () => setModuleAvailable(isModuleActive("scheduled_payments"));
    window.addEventListener("yatra-modules-updated", sync);
    window.addEventListener("yatra-force-nav-refresh", sync);
    return () => {
      window.removeEventListener("yatra-modules-updated", sync);
      window.removeEventListener("yatra-force-nav-refresh", sync);
    };
  }, []);
  const canView = can("yatra_view_bookings") || can("yatra_view_financial_reports");
  const queryParams = reactExports.useMemo(
    () => ({
      page,
      per_page: PER_PAGE,
      ...searchTerm ? { search: searchTerm } : {},
      ...statusFilter !== "all" ? { status: statusFilter } : {}
    }),
    [page, searchTerm, statusFilter]
  );
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["scheduled-payments", queryParams],
    queryFn: async () => await apiService.getScheduledPayments(queryParams),
    enabled: moduleAvailable && canView && view === "scheduled"
  });
  const outstandingParams = reactExports.useMemo(
    () => ({
      page,
      per_page: PER_PAGE,
      ...searchTerm ? { search: searchTerm } : {}
    }),
    [page, searchTerm]
  );
  const {
    data: outstandingData,
    isLoading: outstandingLoading,
    error: outstandingError,
    refetch: refetchOutstanding
  } = useQuery({
    queryKey: ["scheduled-payments-outstanding", outstandingParams],
    queryFn: async () => await apiService.getOutstandingBalances(outstandingParams),
    enabled: moduleAvailable && canView && view === "outstanding"
  });
  const { data: statsRaw } = useQuery({
    queryKey: ["scheduled-payments-stats"],
    queryFn: async () => await apiService.getScheduledPaymentsStats(),
    enabled: moduleAvailable && canView
  });
  const isOutstandingView = view === "outstanding";
  const response = (isOutstandingView ? outstandingData : data) ?? {};
  const payments = isOutstandingView ? [] : (response == null ? void 0 : response.data) ?? [];
  const outstanding = isOutstandingView ? (response == null ? void 0 : response.data) ?? [] : [];
  const total = Number(((_a = response == null ? void 0 : response.meta) == null ? void 0 : _a.total) ?? 0) || 0;
  const totalPages = Number(((_b = response == null ? void 0 : response.meta) == null ? void 0 : _b.total_pages) ?? 0) || 0;
  const listLoading = isOutstandingView ? outstandingLoading : isLoading;
  const listError = isOutstandingView ? outstandingError : error;
  const reload = isOutstandingView ? refetchOutstanding : refetch;
  const stats = (statsRaw == null ? void 0 : statsRaw.data) ?? {};
  const statusCount = (key) => Number((stats == null ? void 0 : stats[key]) ?? 0) || 0;
  const outstandingCount = Number((statsRaw == null ? void 0 : statsRaw.outstanding) ?? 0) || 0;
  const formatMoney = (amount, currency) => {
    var _a2;
    return formatYatraMoney(
      Number(amount) || 0,
      currency || ((_a2 = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a2.currency) || "USD",
      { zeroAsUnknown: false }
    );
  };
  const getStatusBadge = (status) => {
    const map = {
      pending: {
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        label: __("Scheduled", "yatra")
      },
      processing: {
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        label: __("Processing", "yatra")
      },
      completed: {
        className: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: __("Paid", "yatra")
      },
      failed: {
        className: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        label: __("Failed", "yatra")
      },
      cancelled: {
        className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
        label: __("Cancelled", "yatra")
      }
    };
    const info = map[status] || {
      className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
      label: status
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `text-xs ${info.className}`, children: info.label });
  };
  const columns = [
    {
      key: "booking",
      label: __("Booking", "yatra"),
      visible: true,
      render: (item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: item.booking_reference || /* translators: %d: booking ID. */
        __("Booking #", "yatra") + item.booking_id }),
        item.customer_name ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: item.customer_name }) : null,
        !item.booking_exists ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-red-600 dark:text-red-400", children: __("Booking no longer exists", "yatra") }) : null
      ] })
    },
    {
      key: "amount",
      label: __("Amount", "yatra"),
      visible: true,
      render: (item) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: formatMoney(item.amount, item.currency) })
    },
    {
      key: "scheduled_date",
      label: __("Scheduled for", "yatra"),
      visible: true,
      render: (item) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: item.scheduled_date ? formatDateTime(item.scheduled_date) : "—" })
    },
    {
      key: "collection_method",
      label: __("Collection", "yatra"),
      visible: true,
      render: (item) => item.collection_method === "auto" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-3.5 h-3.5" }),
        __("Auto-charge", "yatra")
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { className: "w-3.5 h-3.5" }),
        __("Payment link", "yatra")
      ] })
    },
    {
      key: "status",
      label: __("Status", "yatra"),
      visible: true,
      render: (item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
        getStatusBadge(item.status),
        item.status === "failed" && item.last_error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "text-xs text-red-600 dark:text-red-400 truncate max-w-[220px]",
            title: item.last_error,
            children: item.last_error
          }
        ) : null,
        item.attempt_count > 0 && item.status !== "completed" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: [
          __("Attempts:", "yatra"),
          " ",
          item.attempt_count,
          "/",
          item.max_attempts
        ] }) : null
      ] })
    }
  ];
  const notScheduledLabel = (reason) => {
    switch (reason) {
      case "no_payment_yet":
        return __("No payment received yet", "yatra");
      case "anchored_to_booking":
        return __("Balance due is anchored to the booking date", "yatra");
      case "no_tour_date":
        return __("Booking has no tour date", "yatra");
      case "not_due_yet":
        return __("Reminder starts closer to the tour", "yatra");
      case "due_next_run":
        return __("Reminder goes out on the next daily run", "yatra");
      default:
        return reason;
    }
  };
  const outstandingColumns = [
    {
      key: "booking",
      label: __("Booking", "yatra"),
      visible: true,
      render: (item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: item.booking_reference || `#${item.booking_id}` }),
        item.customer_name ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: item.customer_name }) : null
      ] })
    },
    {
      key: "amount_due",
      label: __("Outstanding", "yatra"),
      visible: true,
      render: (item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: formatMoney(item.amount_due, item.currency) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: sprintf(
          /* translators: 1: amount already paid, 2: booking total. */
          __("%1$s of %2$s paid", "yatra"),
          formatMoney(item.amount_paid, item.currency),
          formatMoney(item.total_amount, item.currency)
        ) })
      ] })
    },
    {
      key: "tour_start",
      label: __("Tour date", "yatra"),
      visible: true,
      render: (item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: item.tour_start ? formatDate(item.tour_start) : "—" }),
        typeof item.days_to_tour === "number" && item.days_to_tour >= 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: sprintf(
          /* translators: %d: number of days until the tour starts. */
          __("in %d days", "yatra"),
          item.days_to_tour
        ) }) : null
      ] })
    },
    {
      key: "reason",
      label: __("Not scheduled because", "yatra"),
      visible: true,
      render: (item) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-600 dark:text-gray-300", children: notScheduledLabel(item.not_scheduled_reason) })
    }
  ];
  const sendBalanceLink = async (item) => {
    if (sendingLinkFor !== null) {
      return;
    }
    setSendingLinkFor(item.booking_id);
    try {
      await apiService.sendBalancePaymentLink(item.booking_id);
      queryClient.invalidateQueries({
        queryKey: ["scheduled-payments-outstanding"]
      });
      queryClient.invalidateQueries({ queryKey: ["scheduled-payments"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-payments-stats"] });
      showToast(__("Balance payment link sent.", "yatra"), "success");
    } catch (err) {
      showToast(
        (err == null ? void 0 : err.message) || __("Failed to send the payment link.", "yatra"),
        "error"
      );
    } finally {
      setSendingLinkFor(null);
    }
  };
  const outstandingActions = [
    {
      key: "send_link",
      label: __("Send balance payment link", "yatra"),
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { className: "w-4 h-4" }),
      onClick: (item) => sendBalanceLink(item),
      // Emails the customer a secure link; needs the same capability as
      // changing a booking, and only makes sense once money is owed.
      condition: (item) => can("yatra_edit_bookings") && item.customer_email !== ""
    },
    {
      key: "view_booking",
      label: __("View booking", "yatra"),
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarClock, { className: "w-4 h-4" }),
      onClick: (item) => navigate({
        subpage: "bookings",
        action: "view",
        id: item.booking_id
      }),
      condition: () => can("yatra_view_bookings")
    }
  ];
  const actions = [
    {
      key: "view_booking",
      label: __("View booking", "yatra"),
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarClock, { className: "w-4 h-4" }),
      onClick: (item) => navigate({
        subpage: "bookings",
        action: "view",
        id: item.booking_id
      }),
      condition: (item) => can("yatra_view_bookings") && item.booking_exists
    },
    {
      key: "cancel",
      label: __("Cancel scheduled payment", "yatra"),
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { className: "w-4 h-4" }),
      onClick: (item) => setToCancel(item),
      variant: "destructive",
      // Only a row that has not run yet can be cancelled — the endpoint
      // enforces the same rule.
      condition: (item) => can("yatra_edit_bookings") && (item.status === "pending" || item.status === "processing")
    }
  ];
  const confirmCancel = async () => {
    if (!toCancel) {
      return;
    }
    setCancelling(true);
    try {
      await apiService.cancelScheduledPayment(toCancel.id);
      queryClient.invalidateQueries({ queryKey: ["scheduled-payments"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-payments-stats"] });
      showToast(__("Scheduled payment cancelled.", "yatra"), "success");
      setToCancel(null);
    } catch (err) {
      showToast(
        (err == null ? void 0 : err.message) || __("Failed to cancel scheduled payment.", "yatra"),
        "error"
      );
    } finally {
      setCancelling(false);
    }
  };
  if (!moduleAvailable) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ScheduledPaymentsPremium, {});
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        title: __("Scheduled Payments", "yatra"),
        description: isOutstandingView ? __(
          "Money still owed on live bookings that nothing is scheduled to collect.",
          "yatra"
        ) : __(
          "Balance payments Yatra has scheduled for bookings that were paid with a deposit.",
          "yatra"
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: [
      ["scheduled", __("Scheduled", "yatra"), statusCount("all")],
      ["outstanding", __("Outstanding", "yatra"), outstandingCount]
    ].map(([key, label, count]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => {
          setView(key);
          setPage(1);
        },
        className: `px-3 py-1.5 rounded-lg text-sm transition-colors ${view === key ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`,
        children: [
          label,
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1.5 text-xs opacity-70", children: count })
        ]
      },
      key
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SearchFilterToolbar,
      {
        searchTerm,
        onSearchChange: (term) => {
          setSearchTerm(term);
          setPage(1);
        },
        statusFilter,
        onStatusChange: (value) => {
          setStatusFilter(value);
          setPage(1);
        },
        statusOptions: isOutstandingView ? [{ value: "all", label: __("All", "yatra") }] : [
          {
            value: "all",
            label: __("All", "yatra") + ` (${statusCount("all")})`
          },
          {
            value: "pending",
            label: __("Scheduled", "yatra") + ` (${statusCount("pending")})`
          },
          {
            value: "completed",
            label: __("Paid", "yatra") + ` (${statusCount("completed")})`
          },
          {
            value: "failed",
            label: __("Failed", "yatra") + ` (${statusCount("failed")})`
          },
          {
            value: "cancelled",
            label: __("Cancelled", "yatra") + ` (${statusCount("cancelled")})`
          }
        ],
        sortBy: "scheduled_date",
        onSortByChange: () => void 0,
        sortOrder: "desc",
        onSortOrderChange: () => void 0,
        sortOptions: [
          { value: "scheduled_date", label: __("Scheduled date", "yatra") }
        ],
        onResetFilters: () => {
          setSearchTerm("");
          setStatusFilter("all");
          setPage(1);
        },
        hasFilters: searchTerm !== "" || !isOutstandingView && statusFilter !== "all",
        placeholder: __("Search by booking reference or customer…", "yatra")
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Table,
      {
        data: isOutstandingView ? outstanding : payments,
        columns: isOutstandingView ? outstandingColumns : columns,
        actions: isOutstandingView ? outstandingActions : actions,
        isLoading: listLoading,
        isError: !!listError,
        errorText: listError ? __("Could not load scheduled payments.", "yatra") : void 0,
        onRetry: () => reload(),
        emptyText: isOutstandingView ? __("No outstanding balances", "yatra") : __("No scheduled payments yet", "yatra"),
        emptyDescription: isOutstandingView ? __(
          "Every confirmed and pending booking is paid up, or already has a scheduled payment collecting the rest.",
          "yatra"
        ) : __(
          "Yatra schedules a balance payment when a deposit is paid with a card it can charge again later, or — if Balance due is anchored to the tour date — when it emails a payment link. Deposits paid by bank transfer, Pay Later or recorded by hand don't create one: check the Outstanding tab for those.",
          "yatra"
        ),
        getItemId: (item) => isOutstandingView ? item.booking_id : item.id
      }
    ),
    totalPages > 1 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      Pagination,
      {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: PER_PAGE,
        onPageChange: setPage,
        itemName: __("scheduled payments", "yatra")
      }
    ) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: toCancel !== null,
        onClose: () => {
          if (!cancelling) {
            setToCancel(null);
          }
        },
        title: __("Cancel scheduled payment?", "yatra"),
        description: __(
          "Yatra will not collect this balance automatically. The booking keeps its outstanding balance, which you can still collect manually.",
          "yatra"
        ),
        size: "sm",
        panelClassName: "yatra-model-ui",
        footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 justify-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              onClick: () => setToCancel(null),
              disabled: cancelling,
              children: __("Keep it", "yatra")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "destructive",
              onClick: confirmCancel,
              disabled: cancelling,
              children: cancelling ? __("Cancelling…", "yatra") : __("Cancel payment", "yatra")
            }
          )
        ] }),
        children: toCancel ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              formatMoney(toCancel.amount, toCancel.currency),
              toCancel.booking_reference ? ` — ${toCancel.booking_reference}` : ""
            ] })
          ] }),
          toCancel.status === "processing" ? (
            // Honest about the race: the charge was already handed to the
            // gateway, and if it succeeds the row returns to Paid.
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-700 dark:text-amber-400", children: __(
              "This charge has already started. If the gateway completes it, the payment will still go through and this row will show as Paid.",
              "yatra"
            ) })
          ) : null
        ] }) : null
      }
    )
  ] });
};
export {
  ScheduledPayments as default
};
//# sourceMappingURL=ScheduledPayments-DjPvvjyg.js.map
