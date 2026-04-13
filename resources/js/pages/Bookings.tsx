/**
 * Bookings Page
 * Clean, minimal SaaS-style bookings management page
 */

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  Pagination,
  SearchFilterToolbar,
  BulkActionToolbar,
  Table as SharedTable,
} from "../components/shared";
import { __ } from "../lib/i18n";
import { useToast } from "../components/ui/toast";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { PageHeader } from "../components/common/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { ConditionalRender } from "../components/ui/conditional-render";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { getCurrencySymbol, getCurrency } from "../data/currencies";
import { apiService } from "../lib/api-client";
import { formatDate as formatDateUtil } from "../lib/dateFormat";
import { getErrorContext } from "../lib/errors";
import { usePermissions } from "../hooks/usePermissions";

interface Booking {
  id: number;
  booking_number: string;
  customer_name: string;
  customer_email: string;
  trip_title: string;
  trip_id: number;
  booking_date: string;
  travel_date: string;
  travelers?: number;
  travelers_count?: number;
  total_amount: number;
  amount_paid?: number;
  currency?: string;
  payment_status: string;
  booking_status: string;
  payment_method?: string;
  payment_gateway?: string;
  created_at: string;
}

const Bookings: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("booking_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window === "undefined") {
      return {
        booking_number: true,
        customer: true,
        trip: true,
        travelers: true,
        booking_date: true,
        travel_date: true,
        amount: true,
        payment_status: true,
        booking_status: true,
      };
    }
    const saved = window.localStorage.getItem("yatra-bookings-visible-columns");
    return saved
      ? JSON.parse(saved)
      : {
          booking_number: true,
          customer: true,
          trip: true,
          travelers: true,
          booking_date: true,
          travel_date: true,
          amount: true,
          payment_status: true,
          booking_status: true,
        };
  });
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const defaultCurrency =
    (window as any)?.yatraAdmin?.currency ||
    (window as any)?.yatraBookingData?.currency ||
    "USD";
  const translations = (window as any)?.yatraAdmin?.translations || {};
  const statsEnabled = can("yatra_view_bookings") !== false;

  // Helper function for translations
  const __ = (text: string) => translations[text] || text;

  // Build query params
  const BOOKINGS_PER_PAGE = 10;

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: BOOKINGS_PER_PAGE,
      orderby: sortBy,
      order: sortOrder,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (statusFilter !== "all") {
      params.status = statusFilter;
    }

    if (paymentFilter !== "all") {
      params.payment_status = paymentFilter;
    }

    return params;
  }, [searchTerm, statusFilter, paymentFilter, sortBy, sortOrder, page]);

  // Fetch bookings from API
  const canViewBookings = can("yatra_view_bookings") !== false; // default true when capability data missing

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["bookings", queryParams],
    queryFn: async () => {
      // Check URL parameter for error simulation (for testing)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("simulate_error") === "true") {
        throw new Error(
          "Simulated API error for testing error UI functionality",
        );
      }

      const params = new URLSearchParams();
      params.append("page", String(queryParams.page));
      params.append("per_page", String(queryParams.per_page));

      if (queryParams.search) {
        params.append("search", queryParams.search);
      }
      if (queryParams.status) {
        params.append("status", queryParams.status);
      }
      if (queryParams.payment_status) {
        params.append("payment_status", queryParams.payment_status);
      }

      return await apiService.getBookings({
        page: queryParams.page,
        per_page: queryParams.per_page,
        search: queryParams.search,
        status: queryParams.status,
        payment_status: queryParams.payment_status,
      });
    },
    enabled: canViewBookings,
  });

  // Fetch booking stats (counts)
  const { data: statsRaw } = useQuery({
    queryKey: ["bookings-stats"],
    queryFn: async () => {
      return await apiService.getBookingsStats();
    },
    enabled: statsEnabled,
  });
  const statsData: any = statsRaw ?? {};
  const totalBookings = statsData?.all ?? 0;
  const confirmedCount = statsData?.confirmed ?? 0;
  const pendingCount = statsData?.pending ?? 0;
  const cancelledCount = statsData?.cancelled ?? 0;
  const completedCount = statsData?.completed ?? 0;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiService.deleteBooking(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookings-stats"] });
      showToast(__("Booking deleted successfully"), "success");
    },
    onError: (error: any) => {
      showToast(error?.message || __("Failed to delete booking"), "error");
    },
  });

  const bookings: Booking[] = data?.data || [];
  const listMeta = data?.meta ?? {};
  const total = Number(listMeta.total ?? data?.total ?? 0);
  const perPage =
    Number(listMeta.per_page ?? data?.per_page ?? BOOKINGS_PER_PAGE) ||
    BOOKINGS_PER_PAGE;
  const totalPages = Math.max(
    1,
    Number(listMeta.total_pages) ||
      (total > 0 ? Math.ceil(total / perPage) : 1),
  );

  // Enhanced error handling
  const errorContext = getErrorContext(error);
  const apiErrorMessage = (data as any)?.error || (data as any)?.message;
  const derivedErrorDetails =
    errorContext.details ||
    (apiErrorMessage ? String(apiErrorMessage) : undefined) ||
    (error ? String(error?.message || error) : undefined);
  const isBookingsError = !!error || !!apiErrorMessage;

  const formatDate = (dateString: string) => {
    return formatDateUtil(dateString);
  };

  const formatPrice = (
    price: number,
    currencyCode: string = defaultCurrency,
  ) => {
    const symbol = getCurrencySymbol(currencyCode);
    const currencyData = getCurrency(currencyCode);
    const decimals = currencyData?.decimalDigits ?? 2;

    return `${symbol}${new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(price)}`;
  };

  const getBookingStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      confirmed: {
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: __("Confirmed"),
      },
      pending: {
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        label: __("Pending"),
      },
      cancelled: {
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        label: __("Cancelled"),
      },
      completed: {
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        label: __("Completed"),
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

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      paid: {
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: __("Paid"),
      },
      pending: {
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        label: __("Pending"),
      },
      partial: {
        className:
          "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
        label: __("Partial"),
      },
      refunded: {
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
        label: __("Refunded"),
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

  const handleEdit = (booking: Booking) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=bookings&action=edit&id=${booking.id}`;
  };

  const handleDelete = (booking: Booking) => {
    setBookingToDelete(booking);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (bookingToDelete) {
      deleteMutation.mutate(bookingToDelete.id);
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setBookingToDelete(null);
  };

  const handleView = (booking: Booking) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=bookings&action=view&id=${booking.id}`;
  };

  const handleCreateBooking = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=bookings&action=create`;
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setSortBy("booking_date");
    setSortOrder("desc");
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1 text-gray-600 dark:text-gray-300" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1 text-gray-600 dark:text-gray-300" />
    );
  };

  const hasFilters =
    searchTerm ||
    statusFilter !== "all" ||
    paymentFilter !== "all" ||
    sortBy !== "booking_date" ||
    sortOrder !== "desc";

  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey as keyof typeof visibleColumns],
    };
    setVisibleColumns(newVisibleColumns);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "yatra-bookings-visible-columns",
        JSON.stringify(newVisibleColumns),
      );
    }
  };

  const handleSelectItem = (id: string | number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((selectedId) => selectedId !== id),
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(bookings.map((booking: Booking) => booking.id));
    } else {
      setSelectedIds([]);
    }
  };

  const isAllSelected =
    bookings.length > 0 && selectedIds.length === bookings.length;

  const updateStatusForIds = async (
    ids: (string | number)[],
    newStatus: string,
  ) => {
    await apiService.bulkUpdateStatus("bookings", ids, newStatus);
  };

  const handleBulkApply = async () => {
    if (!bulkAction || selectedIds.length === 0) {
      return;
    }

    try {
      setIsBulkPending(true);

      if (bulkAction === "delete") {
        await apiService.bulkDelete("bookings", selectedIds);
        showToast(__("Selected bookings deleted successfully"), "success");
      } else {
        await updateStatusForIds(selectedIds, bulkAction);
        showToast(__("Bulk booking status updated successfully"), "success");
      }

      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookings-stats"] });
      setSelectedIds([]);
      setBulkAction("");
    } catch (error: any) {
      showToast(
        __("Error: ") +
          (error?.message || __("Failed to perform bulk action on bookings")),
        "error",
      );
    } finally {
      setIsBulkPending(false);
    }
  };

  const allBulkActionOptions = [
    { value: "confirmed", label: __("Mark as Confirmed") },
    { value: "pending", label: __("Mark as Pending") },
    { value: "cancelled", label: __("Mark as Cancelled") },
    { value: "completed", label: __("Mark as Completed") },
    { value: "delete", label: __("Delete permanently") },
  ];

  const getBulkActionOptionsForStatus = (view: string) => {
    switch (view) {
      case "confirmed":
        return allBulkActionOptions.filter((opt) =>
          ["pending", "cancelled", "completed", "delete"].includes(opt.value),
        );
      case "pending":
        return allBulkActionOptions.filter((opt) =>
          ["confirmed", "cancelled", "completed", "delete"].includes(opt.value),
        );
      case "cancelled":
        return allBulkActionOptions.filter((opt) =>
          ["pending", "confirmed", "delete"].includes(opt.value),
        );
      case "completed":
        return allBulkActionOptions.filter((opt) =>
          ["confirmed", "cancelled", "delete"].includes(opt.value),
        );
      default:
        return allBulkActionOptions;
    }
  };

  const bulkActionOptions = getBulkActionOptionsForStatus(statusFilter);

  const statusOptions = [
    {
      value: "all",
      label: __("All Status"),
      count: statsData?.all ?? totalBookings,
    },
    { value: "confirmed", label: __("Confirmed"), count: confirmedCount },
    { value: "pending", label: __("Pending"), count: pendingCount },
    { value: "cancelled", label: __("Cancelled"), count: cancelledCount },
    { value: "completed", label: __("Completed"), count: completedCount },
  ];

  const sortOptions = [
    { value: "booking_date", label: __("Booking Date") },
    { value: "travel_date", label: __("Travel Date") },
    { value: "booking_number", label: __("Booking Number") },
    { value: "customer_name", label: __("Customer") },
    { value: "trip_title", label: __("Trip") },
    { value: "total_amount", label: __("Amount") },
    { value: "booking_status", label: __("Status") },
  ];

  const columnOptions = [
    {
      key: "booking_number",
      label: __("Booking #"),
      visible: visibleColumns.booking_number,
    },
    {
      key: "customer",
      label: __("Customer"),
      visible: visibleColumns.customer,
    },
    { key: "trip", label: __("Trip"), visible: visibleColumns.trip },
    {
      key: "travelers",
      label: __("Travelers"),
      visible: visibleColumns.travelers,
    },
    {
      key: "booking_date",
      label: __("Booking Date"),
      visible: visibleColumns.booking_date,
    },
    {
      key: "travel_date",
      label: __("Travel Date"),
      visible: visibleColumns.travel_date,
    },
    { key: "amount", label: __("Amount"), visible: visibleColumns.amount },
    {
      key: "payment_status",
      label: __("Payment"),
      visible: visibleColumns.payment_status,
    },
    {
      key: "booking_status",
      label: __("Status"),
      visible: visibleColumns.booking_status,
    },
  ];

  const columns = [
    {
      key: "booking_number",
      label: __("Booking #"),
      sortable: true,
      visible: visibleColumns.booking_number,
      width: "w-[140px]",
      render: (booking: Booking) => (
        <button
          type="button"
          onClick={() => handleView(booking)}
          className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
        >
          {booking.booking_number}
        </button>
      ),
    },
    {
      key: "customer",
      label: __("Customer"),
      sortable: true,
      visible: visibleColumns.customer,
      render: (booking: Booking) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {booking.customer_name || __("Guest")}
          </span>
          <span className="text-xs text-muted-foreground">
            {booking.customer_email}
          </span>
        </div>
      ),
    },
    {
      key: "trip",
      label: __("Trip"),
      sortable: true,
      visible: visibleColumns.trip,
      render: (booking: Booking) => (
        <div className="flex flex-col">
          <a
            href={`${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&action=edit&id=${booking.trip_id}`}
            className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {booking.trip_title}
          </a>
          <span className="ml-1 text-[11px] text-gray-400 dark:text-gray-500">
            {booking.trip_id ? `(ID: ${booking.trip_id})` : ""}
          </span>
        </div>
      ),
    },
    {
      key: "travelers",
      label: __("Travelers"),
      sortable: true,
      visible: visibleColumns.travelers,
      render: (booking: Booking) => (
        <span className="font-medium">
          {booking.travelers ?? booking.travelers_count ?? 0}
        </span>
      ),
    },
    {
      key: "booking_date",
      label: __("Booking Date"),
      sortable: true,
      visible: visibleColumns.booking_date,
      render: (booking: Booking) => (
        <span>{formatDate(booking.booking_date)}</span>
      ),
    },
    {
      key: "travel_date",
      label: __("Travel Date"),
      sortable: true,
      visible: visibleColumns.travel_date,
      render: (booking: Booking) => (
        <span>{formatDate(booking.travel_date)}</span>
      ),
    },
    {
      key: "amount",
      label: __("Amount"),
      sortable: true,
      visible: visibleColumns.amount,
      render: (booking: Booking) => (
        <div className="flex flex-col">
          <span className="font-semibold">
            {formatPrice(booking.total_amount, booking.currency)}
          </span>
          {booking.amount_paid ? (
            <span className="text-xs text-muted-foreground">
              {__("Paid: ")}
              {formatPrice(booking.amount_paid, booking.currency)}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "payment_status",
      label: __("Payment"),
      sortable: true,
      visible: visibleColumns.payment_status,
      render: (booking: Booking) =>
        getPaymentStatusBadge(booking.payment_status),
    },
    {
      key: "booking_status",
      label: __("Status"),
      sortable: true,
      visible: visibleColumns.booking_status,
      render: (booking: Booking) =>
        getBookingStatusBadge(booking.booking_status),
    },
  ];

  const actions = [
    {
      key: "view",
      label: __("View"),
      icon: <Eye className="w-4 h-4" />,
      onClick: (booking: Booking) => handleView(booking),
      condition: () => can("yatra_view_bookings"),
    },
    {
      key: "edit",
      label: __("Edit"),
      icon: <Edit className="w-4 h-4" />,
      onClick: (booking: Booking) => handleEdit(booking),
      condition: () => can("yatra_edit_bookings"),
    },
    {
      key: "mark_confirmed",
      label: __("Mark as Confirmed"),
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: async (booking: Booking) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([booking.id], "confirmed");
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
          queryClient.invalidateQueries({ queryKey: ["bookings-stats"] });
          showToast(__("Booking status updated"), "success");
        } catch (error: any) {
          showToast(
            error?.message || __("Failed to update booking status"),
            "error",
          );
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (booking: Booking) =>
        can("yatra_edit_bookings") && booking.booking_status !== "confirmed",
    },
    {
      key: "mark_pending",
      label: __("Mark as Pending"),
      icon: <ArrowUp className="w-4 h-4" />,
      onClick: async (booking: Booking) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([booking.id], "pending");
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
          queryClient.invalidateQueries({ queryKey: ["bookings-stats"] });
          showToast(__("Booking status updated"), "success");
        } catch (error: any) {
          showToast(
            error?.message || __("Failed to update booking status"),
            "error",
          );
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (booking: Booking) =>
        can("yatra_edit_bookings") && booking.booking_status !== "pending",
    },
    {
      key: "mark_cancelled",
      label: __("Mark as Cancelled"),
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: async (booking: Booking) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([booking.id], "cancelled");
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
          queryClient.invalidateQueries({ queryKey: ["bookings-stats"] });
          showToast(__("Booking status updated"), "success");
        } catch (error: any) {
          showToast(
            error?.message || __("Failed to update booking status"),
            "error",
          );
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (booking: Booking) =>
        can("yatra_edit_bookings") && booking.booking_status !== "cancelled",
    },
    {
      key: "mark_completed",
      label: __("Mark as Completed"),
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: async (booking: Booking) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([booking.id], "completed");
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
          queryClient.invalidateQueries({ queryKey: ["bookings-stats"] });
          showToast(__("Booking status updated"), "success");
        } catch (error: any) {
          showToast(
            error?.message || __("Failed to update booking status"),
            "error",
          );
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (booking: Booking) =>
        can("yatra_edit_bookings") && booking.booking_status !== "completed",
    },
    {
      key: "delete",
      label: __("Delete"),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (booking: Booking) => handleDelete(booking),
      variant: "destructive" as const,
      condition: () => can("yatra_delete_bookings"),
    },
  ];

  return (
    <div className="space-y-3">
      <PageHeader
        title={__("Bookings")}
        description={__("Manage customer bookings and reservations")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreateBooking}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {__("Create Booking")}
            </Button>
          </div>
        }
      />

      {/* Stats summary */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">
                {__("Total Bookings")}
              </div>
              <div className="text-2xl font-semibold">{totalBookings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">
                {__("Confirmed")}
              </div>
              <div className="text-2xl font-semibold">{confirmedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">
                {__("Pending")}
              </div>
              <div className="text-2xl font-semibold">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">
                {__("Cancelled")}
              </div>
              <div className="text-2xl font-semibold">{cancelledCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center w-full">
            <div className="flex-1 min-w-0">
              <SearchFilterToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                statusOptions={statusOptions}
                sortBy={sortBy}
                onSortByChange={(field) => {
                  setSortBy(field);
                  setPage(1);
                }}
                sortOrder={sortOrder}
                onSortOrderChange={(order) => {
                  setSortOrder(order);
                  setPage(1);
                }}
                sortOptions={sortOptions}
                onResetFilters={handleResetFilters}
                hasFilters={!!hasFilters}
                placeholder={__("Search bookings...")}
              />
            </div>

            {/* Payment Status Filter */}
            <div className="w-full lg:w-auto lg:min-w-[160px]">
              <Select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              >
                <option value="all">{__("All Payments")}</option>
                <option value="paid">{__("Paid")}</option>
                <option value="pending">{__("Pending")}</option>
                <option value="partial">{__("Partial")}</option>
                <option value="refunded">{__("Refunded")}</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_bookings">
        <>
          <BulkActionToolbar
            selectedIds={selectedIds}
            bulkAction={bulkAction}
            setBulkAction={setBulkAction}
            onApply={handleBulkApply}
            onClearSelection={() => setSelectedIds([])}
            statusFilter={statusFilter}
            setStatusFilter={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            statusOptions={[
              {
                key: "all",
                label: __("All"),
                count: statsData?.all ?? totalBookings,
              },
              {
                key: "confirmed",
                label: __("Confirmed"),
                count: confirmedCount,
              },
              { key: "pending", label: __("Pending"), count: pendingCount },
              {
                key: "cancelled",
                label: __("Cancelled"),
                count: cancelledCount,
              },
              {
                key: "completed",
                label: __("Completed"),
                count: completedCount,
              },
            ]}
            showColumnsDropdown={showColumnsDropdown}
            setShowColumnsDropdown={setShowColumnsDropdown}
            columnOptions={columnOptions}
            onToggleColumn={toggleColumn}
            bulkMutationPending={isBulkPending}
            totalItems={total}
            bulkActionOptions={bulkActionOptions}
          />

          <Card>
            <CardContent className="p-0">
              <SharedTable
                data={bookings}
                columns={columns}
                actions={actions}
                isLoading={isLoading}
                isError={isBookingsError}
                errorText={__("Error loading bookings")}
                errorDescription={__(
                  "We couldn't connect to the bookings service. Please refresh or try again shortly.",
                )}
                errorDetails={derivedErrorDetails}
                errorRequestInfo={errorContext.requestInfo}
                onRetry={() => refetch()}
                emptyText={__("No bookings found")}
                emptyDescription={
                  hasFilters
                    ? __("Try adjusting your filters to see more results.")
                    : __("Get started by creating your first booking.")
                }
                onCreateClick={
                  can("yatra_edit_bookings") ? handleCreateBooking : undefined
                }
                onSort={handleSort}
                getSortIcon={getSortIcon}
                selectedItemIds={selectedIds}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                isAllSelected={isAllSelected}
                getItemId={(booking: Booking) => booking.id}
                skeletonRows={5}
                capability="yatra_view_bookings"
              />
            </CardContent>
          </Card>

          {total > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={perPage}
                onPageChange={(newPage) => setPage(newPage)}
                itemName={__("bookings")}
              />
            </div>
          )}
        </>
      </ConditionalRender>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title={__("Delete Booking")}
        description={
          bookingToDelete
            ? __(
                `Are you sure you want to delete booking "${bookingToDelete.booking_number}"? This action cannot be undone.`,
              )
            : __("Are you sure you want to delete this booking?")
        }
        confirmText={__("Delete")}
        cancelText={__("Cancel")}
        variant="danger"
        isLoading={deleteMutation.isPending}
        icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
      />
    </div>
  );
};

export default Bookings;
