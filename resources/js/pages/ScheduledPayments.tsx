/**
 * Scheduled Payments Page
 *
 * Read-only view of the balance payments Yatra has scheduled for bookings,
 * plus the ability to cancel one that has not run yet.
 *
 * Premium module for collecting a booking's remaining balance automatically.
 * This page is the UI shell in the free plugin; every endpoint it calls is
 * registered by the Yatra Pro "Scheduled Payments" module and only exists
 * while that module is enabled — hence the module gate below.
 *
 * @package Yatra
 */

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  Ban,
  Link as LinkIcon,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { __, sprintf } from "../lib/i18n";
import { apiService } from "../lib/api-client";
import { formatDate, formatDateTime } from "../lib/dateFormat";
import { formatYatraMoney } from "../lib/currency-display";
import { usePermissions } from "../hooks/usePermissions";
import { useNavigate } from "../hooks/useNavigate";
import { useToast } from "../components/ui/toast";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { PageHeader } from "../components/common/PageHeader";
import { Modal } from "../components/ui/modal";
import {
  Pagination,
  SearchFilterToolbar,
  Table as SharedTable,
} from "../components/shared";
import { isModuleActive } from "../lib/plugin-utils";
import PremiumUpgradeCard from "./premium-pages/ScheduledPayments";

interface ScheduledPayment {
  id: number;
  booking_id: number;
  booking_reference: string;
  booking_status: string;
  booking_exists: boolean;
  customer_name: string;
  customer_email: string;
  amount: number;
  currency: string;
  scheduled_date: string;
  status: string;
  payment_type: string;
  collection_method: "auto" | "link";
  gateway: string;
  attempt_count: number;
  max_attempts: number;
  last_attempt_at: string;
  last_error: string;
  reminder_sent: boolean;
  paid_at: string;
  installment_number: number | null;
  created_at: string;
}

/** A balance still owed on a live booking, with nothing scheduled to collect it. */
interface OutstandingBalance {
  booking_id: number;
  booking_reference: string;
  booking_status: string;
  customer_name: string;
  customer_email: string;
  currency: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  tour_start: string;
  days_to_tour: number | null;
  payment_gateway: string;
  payment_method: string;
  not_scheduled_reason: string;
}

const PER_PAGE = 20;

const ScheduledPayments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [toCancel, setToCancel] = useState<ScheduledPayment | null>(null);
  const [cancelling, setCancelling] = useState(false);
  // "scheduled" = automated collections; "outstanding" = money still owed that
  // nothing is collecting. Operators reach for the second far more often.
  const [view, setView] = useState<"scheduled" | "outstanding">("scheduled");
  const [sendingLinkFor, setSendingLinkFor] = useState<number | null>(null);

  const { can } = usePermissions();
  const { navigate } = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Held in state, not read inline, so switching the module on or off in
  // Yatra → Modules updates this page immediately. The Modules screen refreshes
  // `window.yatraAdmin.scheduledPaymentsEnabled` and fires these events; without
  // listening, the page would keep its previous shape until a reload.
  const [moduleAvailable, setModuleAvailable] = useState<boolean>(() =>
    isModuleActive("scheduled_payments"),
  );

  useEffect(() => {
    const sync = () => setModuleAvailable(isModuleActive("scheduled_payments"));

    window.addEventListener("yatra-modules-updated", sync);
    window.addEventListener("yatra-force-nav-refresh", sync);

    return () => {
      window.removeEventListener("yatra-modules-updated", sync);
      window.removeEventListener("yatra-force-nav-refresh", sync);
    };
  }, []);
  // The page sits under Payments in the menu, so a finance role that can see
  // Payments can open it — the endpoints accept the same pair of capabilities.
  const canView =
    can("yatra_view_bookings") || can("yatra_view_financial_reports");

  const queryParams = useMemo(
    () => ({
      page,
      per_page: PER_PAGE,
      ...(searchTerm ? { search: searchTerm } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    }),
    [page, searchTerm, statusFilter],
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["scheduled-payments", queryParams],
    queryFn: async () => await apiService.getScheduledPayments(queryParams),
    enabled: moduleAvailable && canView && view === "scheduled",
  });

  const outstandingParams = useMemo(
    () => ({
      page,
      per_page: PER_PAGE,
      ...(searchTerm ? { search: searchTerm } : {}),
    }),
    [page, searchTerm],
  );

  const {
    data: outstandingData,
    isLoading: outstandingLoading,
    error: outstandingError,
    refetch: refetchOutstanding,
  } = useQuery({
    queryKey: ["scheduled-payments-outstanding", outstandingParams],
    queryFn: async () =>
      await apiService.getOutstandingBalances(outstandingParams),
    enabled: moduleAvailable && canView && view === "outstanding",
  });

  const { data: statsRaw } = useQuery({
    queryKey: ["scheduled-payments-stats"],
    queryFn: async () => await apiService.getScheduledPaymentsStats(),
    enabled: moduleAvailable && canView,
  });

  // Endpoints answer { success, data, meta } and the API client returns the raw
  // body, so read through `data` rather than the top level.
  const isOutstandingView = view === "outstanding";
  const response: any = (isOutstandingView ? outstandingData : data) ?? {};
  const payments: ScheduledPayment[] = isOutstandingView
    ? []
    : (response?.data ?? []);
  const outstanding: OutstandingBalance[] = isOutstandingView
    ? (response?.data ?? [])
    : [];
  const total: number = Number(response?.meta?.total ?? 0) || 0;
  const totalPages: number = Number(response?.meta?.total_pages ?? 0) || 0;
  const listLoading = isOutstandingView ? outstandingLoading : isLoading;
  const listError = isOutstandingView ? outstandingError : error;
  const reload = isOutstandingView ? refetchOutstanding : refetch;

  const stats: Record<string, number> = (statsRaw as any)?.data ?? {};
  const statusCount = (key: string) => Number(stats?.[key] ?? 0) || 0;
  // Counts bookings, not schedule rows, so the endpoint returns it beside the
  // status map rather than inside it (where it would break "all = sum").
  const outstandingCount = Number((statsRaw as any)?.outstanding ?? 0) || 0;

  const formatMoney = (amount: number, currency: string) =>
    formatYatraMoney(
      Number(amount) || 0,
      currency || (window as any)?.yatraAdmin?.currency || "USD",
      { zeroAsUnknown: false },
    );

  const getStatusBadge = (status: string) => {
    const map: Record<string, { className: string; label: string }> = {
      pending: {
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        label: __("Scheduled", "yatra"),
      },
      processing: {
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        label: __("Processing", "yatra"),
      },
      completed: {
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: __("Paid", "yatra"),
      },
      failed: {
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        label: __("Failed", "yatra"),
      },
      cancelled: {
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
        label: __("Cancelled", "yatra"),
      },
    };
    const info = map[status] || {
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
      label: status,
    };

    return <Badge className={`text-xs ${info.className}`}>{info.label}</Badge>;
  };

  const columns = [
    {
      key: "booking",
      label: __("Booking", "yatra"),
      visible: true,
      render: (item: ScheduledPayment) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">
            {item.booking_reference ||
              /* translators: %d: booking ID. */
              __("Booking #", "yatra") + item.booking_id}
          </span>
          {item.customer_name ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {item.customer_name}
            </span>
          ) : null}
          {!item.booking_exists ? (
            <span className="text-xs text-red-600 dark:text-red-400">
              {__("Booking no longer exists", "yatra")}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "amount",
      label: __("Amount", "yatra"),
      visible: true,
      render: (item: ScheduledPayment) => (
        <span className="font-medium">
          {formatMoney(item.amount, item.currency)}
        </span>
      ),
    },
    {
      key: "scheduled_date",
      label: __("Scheduled for", "yatra"),
      visible: true,
      render: (item: ScheduledPayment) => (
        <span className="text-sm">
          {item.scheduled_date ? formatDateTime(item.scheduled_date) : "—"}
        </span>
      ),
    },
    {
      key: "collection_method",
      label: __("Collection", "yatra"),
      visible: true,
      render: (item: ScheduledPayment) =>
        item.collection_method === "auto" ? (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <CreditCard className="w-3.5 h-3.5" />
            {__("Auto-charge", "yatra")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <LinkIcon className="w-3.5 h-3.5" />
            {__("Payment link", "yatra")}
          </span>
        ),
    },
    {
      key: "status",
      label: __("Status", "yatra"),
      visible: true,
      render: (item: ScheduledPayment) => (
        <div className="flex flex-col gap-1">
          {getStatusBadge(item.status)}
          {item.status === "failed" && item.last_error ? (
            <span
              className="text-xs text-red-600 dark:text-red-400 truncate max-w-[220px]"
              title={item.last_error}
            >
              {item.last_error}
            </span>
          ) : null}
          {item.attempt_count > 0 && item.status !== "completed" ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {__("Attempts:", "yatra")} {item.attempt_count}/
              {item.max_attempts}
            </span>
          ) : null}
        </div>
      ),
    },
  ];

  /** Why nothing is collecting this balance — plain wording for operators. */
  const notScheduledLabel = (reason: string): string => {
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
      render: (item: OutstandingBalance) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">
            {item.booking_reference || `#${item.booking_id}`}
          </span>
          {item.customer_name ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {item.customer_name}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "amount_due",
      label: __("Outstanding", "yatra"),
      visible: true,
      render: (item: OutstandingBalance) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {formatMoney(item.amount_due, item.currency)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {sprintf(
              /* translators: 1: amount already paid, 2: booking total. */
              __("%1$s of %2$s paid", "yatra"),
              formatMoney(item.amount_paid, item.currency),
              formatMoney(item.total_amount, item.currency),
            )}
          </span>
        </div>
      ),
    },
    {
      key: "tour_start",
      label: __("Tour date", "yatra"),
      visible: true,
      render: (item: OutstandingBalance) => (
        <div className="flex flex-col">
          <span className="text-sm">
            {item.tour_start ? formatDate(item.tour_start) : "—"}
          </span>
          {typeof item.days_to_tour === "number" && item.days_to_tour >= 0 ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {sprintf(
                /* translators: %d: number of days until the tour starts. */
                __("in %d days", "yatra"),
                item.days_to_tour,
              )}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "reason",
      label: __("Not scheduled because", "yatra"),
      visible: true,
      render: (item: OutstandingBalance) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {notScheduledLabel(item.not_scheduled_reason)}
        </span>
      ),
    },
  ];

  const sendBalanceLink = async (item: OutstandingBalance) => {
    if (sendingLinkFor !== null) {
      return;
    }
    setSendingLinkFor(item.booking_id);
    try {
      await apiService.sendBalancePaymentLink(item.booking_id);
      queryClient.invalidateQueries({
        queryKey: ["scheduled-payments-outstanding"],
      });
      queryClient.invalidateQueries({ queryKey: ["scheduled-payments"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-payments-stats"] });
      showToast(__("Balance payment link sent.", "yatra"), "success");
    } catch (err: any) {
      showToast(
        err?.message || __("Failed to send the payment link.", "yatra"),
        "error",
      );
    } finally {
      setSendingLinkFor(null);
    }
  };

  const outstandingActions = [
    {
      key: "send_link",
      label: __("Send balance payment link", "yatra"),
      icon: <LinkIcon className="w-4 h-4" />,
      onClick: (item: OutstandingBalance) => sendBalanceLink(item),
      // Emails the customer a secure link; needs the same capability as
      // changing a booking, and only makes sense once money is owed.
      condition: (item: OutstandingBalance) =>
        can("yatra_edit_bookings") && item.customer_email !== "",
    },
    {
      key: "view_booking",
      label: __("View booking", "yatra"),
      icon: <CalendarClock className="w-4 h-4" />,
      onClick: (item: OutstandingBalance) =>
        navigate({
          subpage: "bookings",
          action: "view",
          id: item.booking_id,
        }),
      condition: () => can("yatra_view_bookings"),
    },
  ];

  const actions = [
    {
      key: "view_booking",
      label: __("View booking", "yatra"),
      icon: <CalendarClock className="w-4 h-4" />,
      onClick: (item: ScheduledPayment) =>
        navigate({
          subpage: "bookings",
          action: "view",
          id: item.booking_id,
        }),
      condition: (item: ScheduledPayment) =>
        can("yatra_view_bookings") && item.booking_exists,
    },
    {
      key: "cancel",
      label: __("Cancel scheduled payment", "yatra"),
      icon: <Ban className="w-4 h-4" />,
      onClick: (item: ScheduledPayment) => setToCancel(item),
      variant: "destructive" as const,
      // Only a row that has not run yet can be cancelled — the endpoint
      // enforces the same rule.
      condition: (item: ScheduledPayment) =>
        can("yatra_edit_bookings") &&
        (item.status === "pending" || item.status === "processing"),
    },
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
    } catch (err: any) {
      showToast(
        err?.message || __("Failed to cancel scheduled payment.", "yatra"),
        "error",
      );
    } finally {
      setCancelling(false);
    }
  };

  // Module gate lives after the hooks so every hook runs on every render.
  if (!moduleAvailable) {
    return <PremiumUpgradeCard />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={__("Scheduled Payments", "yatra")}
        description={
          isOutstandingView
            ? __(
                "Money still owed on live bookings that nothing is scheduled to collect.",
                "yatra",
              )
            : __(
                "Balance payments Yatra has scheduled for bookings that were paid with a deposit.",
                "yatra",
              )
        }
      />

      {/* Two halves of the same question: what Yatra will collect on its own,
          and what is still owed with nothing collecting it. */}
      <div className="flex items-center gap-2">
        {(
          [
            ["scheduled", __("Scheduled", "yatra"), statusCount("all")],
            ["outstanding", __("Outstanding", "yatra"), outstandingCount],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setView(key as "scheduled" | "outstanding");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              view === key
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs opacity-70">{count}</span>
          </button>
        ))}
      </div>

      <SearchFilterToolbar
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        // Status belongs to schedule rows; an outstanding balance has none, so
        // the filter collapses to a single option in that view.
        statusOptions={
          isOutstandingView
            ? [{ value: "all", label: __("All", "yatra") }]
            : [
                {
                  value: "all",
                  label: __("All", "yatra") + ` (${statusCount("all")})`,
                },
                {
                  value: "pending",
                  label:
                    __("Scheduled", "yatra") + ` (${statusCount("pending")})`,
                },
                {
                  value: "completed",
                  label: __("Paid", "yatra") + ` (${statusCount("completed")})`,
                },
                {
                  value: "failed",
                  label: __("Failed", "yatra") + ` (${statusCount("failed")})`,
                },
                {
                  value: "cancelled",
                  label:
                    __("Cancelled", "yatra") + ` (${statusCount("cancelled")})`,
                },
              ]
        }
        sortBy="scheduled_date"
        onSortByChange={() => undefined}
        sortOrder="desc"
        onSortOrderChange={() => undefined}
        sortOptions={[
          { value: "scheduled_date", label: __("Scheduled date", "yatra") },
        ]}
        onResetFilters={() => {
          setSearchTerm("");
          setStatusFilter("all");
          setPage(1);
        }}
        hasFilters={
          searchTerm !== "" || (!isOutstandingView && statusFilter !== "all")
        }
        placeholder={__("Search by booking reference or customer…", "yatra")}
      />

      <SharedTable
        data={isOutstandingView ? outstanding : payments}
        columns={isOutstandingView ? outstandingColumns : columns}
        actions={isOutstandingView ? outstandingActions : actions}
        isLoading={listLoading}
        isError={!!listError}
        errorText={
          listError
            ? __("Could not load scheduled payments.", "yatra")
            : undefined
        }
        onRetry={() => reload()}
        emptyText={
          isOutstandingView
            ? __("No outstanding balances", "yatra")
            : __("No scheduled payments yet", "yatra")
        }
        // Says *why* it is empty: operators reasonably expect every deposit
        // booking to appear here, and the two conditions below are what
        // actually create a row.
        emptyDescription={
          isOutstandingView
            ? __(
                "Every confirmed and pending booking is paid up, or already has a scheduled payment collecting the rest.",
                "yatra",
              )
            : __(
                "Yatra schedules a balance payment when a deposit is paid with a card it can charge again later, or — if Balance due is anchored to the tour date — when it emails a payment link. Deposits paid by bank transfer, Pay Later or recorded by hand don't create one: check the Outstanding tab for those.",
                "yatra",
              )
        }
        getItemId={(item: ScheduledPayment | OutstandingBalance) =>
          isOutstandingView
            ? (item as OutstandingBalance).booking_id
            : (item as ScheduledPayment).id
        }
      />

      {totalPages > 1 ? (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={PER_PAGE}
          onPageChange={setPage}
          itemName={__("scheduled payments", "yatra")}
        />
      ) : null}

      <Modal
        isOpen={toCancel !== null}
        onClose={() => {
          if (!cancelling) {
            setToCancel(null);
          }
        }}
        title={__("Cancel scheduled payment?", "yatra")}
        description={__(
          "Yatra will not collect this balance automatically. The booking keeps its outstanding balance, which you can still collect manually.",
          "yatra",
        )}
        size="sm"
        panelClassName="yatra-model-ui"
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setToCancel(null)}
              disabled={cancelling}
            >
              {__("Keep it", "yatra")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
              disabled={cancelling}
            >
              {cancelling
                ? __("Cancelling…", "yatra")
                : __("Cancel payment", "yatra")}
            </Button>
          </div>
        }
      >
        {toCancel ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                {formatMoney(toCancel.amount, toCancel.currency)}
                {toCancel.booking_reference
                  ? ` — ${toCancel.booking_reference}`
                  : ""}
              </span>
            </div>
            {toCancel.status === "processing" ? (
              // Honest about the race: the charge was already handed to the
              // gateway, and if it succeeds the row returns to Paid.
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {__(
                  "This charge has already started. If the gateway completes it, the payment will still go through and this row will show as Paid.",
                  "yatra",
                )}
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default ScheduledPayments;
