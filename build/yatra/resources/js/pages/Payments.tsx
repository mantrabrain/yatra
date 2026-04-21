/**
 * Payments Page
 * Manage payments for bookings
 */

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Eye,
  CreditCard,
} from "lucide-react";
import {
  Pagination,
  SearchFilterToolbar,
  BulkActionToolbar,
  Table as SharedTable,
} from "../components/shared";
import { __ } from "../lib/i18n";
import { getErrorContext } from "../lib/errors";
import { apiService } from "../lib/api-client";
import { usePermissions } from "../hooks/usePermissions";
import { useToast } from "../components/ui/toast";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { PageHeader } from "../components/common/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { ConditionalRender } from "../components/ui/conditional-render";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { getCurrencySymbol, getCurrency } from "../data/currencies";
import { formatDate as formatDateUtil } from "../lib/dateFormat";

interface Payment {
  id: number;
  payment_number: string;
  booking_id: number;
  booking_number: string;
  customer_name: string;
  customer_email: string;
  trip_title: string;
  amount: number;
  currency?: string;
  payment_method: string;
  payment_status:
    | "pending"
    | "completed"
    | "failed"
    | "refunded"
    | "partial"
    | "cancelled";
  transaction_id?: string;
  payment_date: string;
  notes?: string;
  created_at: string;
}

const Payments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [sortBy, setSortBy] = useState("payment_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    payment: Payment | null;
  }>({
    isOpen: false,
    payment: null,
  });
  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window === "undefined") {
      return {
        payment: true,
        customer: true,
        booking: true,
        amount: true,
        method: true,
        status: true,
        date: true,
      };
    }
    const saved = window.localStorage.getItem("yatra-payments-visible-columns");
    return saved
      ? JSON.parse(saved)
      : {
          payment: true,
          customer: true,
          booking: true,
          amount: true,
          method: true,
          status: true,
          date: true,
        };
  });
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const defaultCurrency =
    (window as any)?.yatraAdmin?.currency ||
    (window as any)?.yatraBookingData?.currency ||
    "USD";

  // Fetch payments from API

  const PAYMENTS_PER_PAGE = 10;

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: PAYMENTS_PER_PAGE,
      orderby: sortBy,
      order: sortOrder,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (statusFilter !== "all") {
      params.payment_status = statusFilter;
    }

    if (methodFilter !== "all") {
      params.payment_method = methodFilter;
    }

    return params;
  }, [searchTerm, statusFilter, methodFilter, sortBy, sortOrder, page]);

  // Fetch payments from API
  const { data, isLoading, error } = useQuery({
    queryKey: ["payments", queryParams],
    queryFn: async () => {
      const paramsObj: Record<string, any> = {
        page: queryParams.page,
        per_page: queryParams.per_page,
      };
      if (queryParams.search) {
        paramsObj.search = queryParams.search;
      }
      if (queryParams.payment_status) {
        paramsObj.status = queryParams.payment_status;
      }
      if (queryParams.payment_method) {
        paramsObj.gateway = queryParams.payment_method;
      }

      return await apiService.getPayments(paramsObj);
    },
    enabled: can("yatra_view_bookings"),
  });

  const { data: paymentStatsRaw } = useQuery({
    queryKey: ["payments-stats"],
    queryFn: () => apiService.getPaymentsStats(),
    enabled: can("yatra_view_bookings"),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiService.deletePayment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payments-stats"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      showToast(__("Payment deleted successfully", "yatra"), "success");
      setDeleteConfirm({ isOpen: false, payment: null });
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to delete payment", "yatra"),
        "error",
      );
    },
  });

  const payments: Payment[] = data?.data || [];
  const listMeta = (data as any)?.meta;
  const total = Number(listMeta?.total ?? (data as any)?.total ?? 0);
  const perPage =
    Number(
      listMeta?.per_page ?? (data as any)?.per_page ?? PAYMENTS_PER_PAGE,
    ) || PAYMENTS_PER_PAGE;
  const totalPages = Math.max(
    1,
    Number(listMeta?.total_pages ?? (data as any)?.total_pages) ||
      (total > 0 ? Math.ceil(total / perPage) : 1),
  );

  const payCounts = (paymentStatsRaw ?? {}) as Record<string, number>;
  const countFor = (key: string) => Number(payCounts[key] ?? 0);
  const errorContext = getErrorContext(error);

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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      completed: {
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: __("Completed", "yatra"),
      },
      pending: {
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        label: __("Pending", "yatra"),
      },
      partial: {
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        label: __("Partial", "yatra"),
      },
      failed: {
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        label: __("Failed", "yatra"),
      },
      refunded: {
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
        label: __("Refunded", "yatra"),
      },
      cancelled: {
        className:
          "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
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

  const handleEdit = (payment: Payment) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=payments&action=edit&id=${payment.id}`;
  };

  const handleDelete = (payment: Payment) => {
    setDeleteConfirm({ isOpen: true, payment });
  };

  const confirmDelete = () => {
    if (deleteConfirm.payment) {
      deleteMutation.mutate(deleteConfirm.payment.id);
    }
  };

  const handleView = (payment: Payment) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=payments&action=view&id=${payment.id}`;
  };

  const handleCreatePayment = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=payments&action=create`;
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setMethodFilter("all");
    setSortBy("payment_date");
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
    methodFilter !== "all" ||
    sortBy !== "payment_date" ||
    sortOrder !== "desc";

  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey as keyof typeof visibleColumns],
    };
    setVisibleColumns(newVisibleColumns);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "yatra-payments-visible-columns",
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
      setSelectedIds(payments.map((payment: Payment) => payment.id));
    } else {
      setSelectedIds([]);
    }
  };

  const isAllSelected =
    payments.length > 0 && selectedIds.length === payments.length;

  const updateStatusForIds = async (
    ids: (string | number)[],
    newStatus: Payment["payment_status"],
  ) => {
    await Promise.all(
      ids.map(async (id) => {
        await apiService.updatePaymentStatus(id, newStatus);
      }),
    );
  };

  const handleBulkApply = async () => {
    if (!bulkAction || selectedIds.length === 0) {
      return;
    }

    try {
      setIsBulkPending(true);

      if (bulkAction === "delete") {
        await apiService.bulkPaymentsAction("delete", selectedIds);
        showToast(
          __("Selected payments deleted successfully", "yatra"),
          "success",
        );
      } else {
        const newStatus = bulkAction as Payment["payment_status"];
        await updateStatusForIds(selectedIds, newStatus);
        showToast(__("Bulk status updated successfully", "yatra"), "success");
      }

      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payments-stats"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setSelectedIds([]);
      setBulkAction("");
    } catch (error: any) {
      showToast(
        error?.message ||
          __("Failed to perform bulk action on payments", "yatra"),
        "error",
      );
    } finally {
      setIsBulkPending(false);
    }
  };

  const allBulkActionOptions = [
    { value: "completed", label: __("Mark as Completed", "yatra") },
    { value: "failed", label: __("Mark as Failed", "yatra") },
    { value: "refunded", label: __("Mark as Refunded", "yatra") },
    { value: "cancelled", label: __("Mark as Cancelled", "yatra") },
    { value: "delete", label: __("Delete permanently", "yatra") },
  ];

  const getBulkActionOptionsForStatus = (view: string) => {
    switch (view) {
      case "completed":
        return allBulkActionOptions.filter((opt) =>
          ["failed", "refunded", "cancelled", "delete"].includes(opt.value),
        );
      case "pending":
        return allBulkActionOptions.filter((opt) =>
          ["completed", "failed", "cancelled", "delete"].includes(opt.value),
        );
      case "partial":
        return allBulkActionOptions.filter((opt) =>
          ["completed", "cancelled", "delete"].includes(opt.value),
        );
      case "failed":
        return allBulkActionOptions.filter((opt) =>
          ["completed", "cancelled", "delete"].includes(opt.value),
        );
      case "refunded":
        return allBulkActionOptions.filter((opt) =>
          ["completed", "cancelled", "delete"].includes(opt.value),
        );
      case "cancelled":
        return allBulkActionOptions.filter((opt) =>
          ["completed", "delete"].includes(opt.value),
        );
      default:
        return allBulkActionOptions;
    }
  };

  const bulkActionOptions = getBulkActionOptionsForStatus(statusFilter);

  const statusOptions = [
    { value: "all", label: __("All Status", "yatra") },
    { value: "completed", label: __("Completed", "yatra") },
    { value: "pending", label: __("Pending", "yatra") },
    { value: "partial", label: __("Partial", "yatra") },
    { value: "failed", label: __("Failed", "yatra") },
    { value: "refunded", label: __("Refunded", "yatra") },
    { value: "cancelled", label: __("Cancelled", "yatra") },
  ];

  const sortOptions = [
    { value: "payment_date", label: __("Payment Date", "yatra") },
    { value: "payment_number", label: __("Payment Number", "yatra") },
    { value: "customer_name", label: __("Customer", "yatra") },
    { value: "amount", label: __("Amount", "yatra") },
    { value: "payment_method", label: __("Payment Method", "yatra") },
    { value: "payment_status", label: __("Status", "yatra") },
  ];

  const columnOptions = [
    {
      key: "payment",
      label: __("Payment", "yatra"),
      visible: visibleColumns.payment,
    },
    {
      key: "customer",
      label: __("Customer", "yatra"),
      visible: visibleColumns.customer,
    },
    {
      key: "booking",
      label: __("Booking", "yatra"),
      visible: visibleColumns.booking,
    },
    {
      key: "amount",
      label: __("Amount", "yatra"),
      visible: visibleColumns.amount,
    },
    {
      key: "method",
      label: __("Method", "yatra"),
      visible: visibleColumns.method,
    },
    {
      key: "status",
      label: __("Status", "yatra"),
      visible: visibleColumns.status,
    },
    { key: "date", label: __("Date", "yatra"), visible: visibleColumns.date },
  ];

  const columns = [
    {
      key: "payment",
      label: __("Payment", "yatra"),
      sortable: true,
      visible: visibleColumns.payment,
      width: "w-[220px]",
      render: (payment: Payment) => (
        <div>
          <button
            type="button"
            onClick={() => handleView(payment)}
            className="flex items-center gap-2 mb-1 group cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300" />
            <span className="font-medium text-blue-600 dark:text-blue-400 font-mono text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300 group-hover:underline">
              {payment.payment_number}
            </span>
          </button>
          {payment.transaction_id && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {__("TXN", "yatra")}: {payment.transaction_id}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "customer",
      label: __("Customer", "yatra"),
      sortable: true,
      visible: visibleColumns.customer,
      render: (payment: Payment) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {payment.customer_name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {payment.customer_email}
          </div>
        </div>
      ),
    },
    {
      key: "booking",
      label: __("Booking", "yatra"),
      sortable: false,
      visible: visibleColumns.booking,
      render: (payment: Payment) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {payment.booking_number}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {payment.trip_title}
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      label: __("Amount", "yatra"),
      sortable: true,
      visible: visibleColumns.amount,
      render: (payment: Payment) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          {formatPrice(payment.amount, payment.currency || defaultCurrency)}
        </span>
      ),
    },
    {
      key: "method",
      label: __("Method", "yatra"),
      sortable: true,
      visible: visibleColumns.method,
      render: (payment: Payment) => (
        <span className="text-gray-600 dark:text-gray-400">
          {payment.payment_method}
        </span>
      ),
    },
    {
      key: "status",
      label: __("Status", "yatra"),
      sortable: true,
      visible: visibleColumns.status,
      render: (payment: Payment) => getStatusBadge(payment.payment_status),
    },
    {
      key: "date",
      label: __("Date", "yatra"),
      sortable: true,
      visible: visibleColumns.date,
      render: (payment: Payment) => (
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          {formatDate(payment.payment_date)}
        </span>
      ),
    },
  ];

  const actions = [
    {
      key: "view",
      label: __("View", "yatra"),
      icon: <Eye className="w-4 h-4" />,
      onClick: (payment: Payment) => handleView(payment),
    },
    {
      key: "edit",
      label: __("Edit", "yatra"),
      icon: <Edit className="w-4 h-4" />,
      onClick: (payment: Payment) => handleEdit(payment),
    },
    {
      key: "mark_completed",
      label: __("Mark as Completed", "yatra"),
      icon: <ArrowUp className="w-4 h-4" />,
      onClick: async (payment: Payment) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([payment.id], "completed");
          queryClient.invalidateQueries({ queryKey: ["payments"] });
          queryClient.invalidateQueries({ queryKey: ["payments-stats"] });
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
          showToast(__("Payment status updated", "yatra"), "success");
        } catch (error: any) {
          showToast(
            error?.message || __("Failed to update payment status", "yatra"),
            "error",
          );
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (payment: Payment) =>
        can("yatra_edit_bookings") && payment.payment_status !== "completed",
    },
    {
      key: "mark_failed",
      label: __("Mark as Failed", "yatra"),
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: async (payment: Payment) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([payment.id], "failed");
          queryClient.invalidateQueries({ queryKey: ["payments"] });
          queryClient.invalidateQueries({ queryKey: ["payments-stats"] });
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
          showToast(__("Payment status updated", "yatra"), "success");
        } catch (error: any) {
          showToast(
            error?.message || __("Failed to update payment status", "yatra"),
            "error",
          );
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (payment: Payment) =>
        can("yatra_edit_bookings") && payment.payment_status !== "failed",
    },
    {
      key: "mark_refunded",
      label: __("Mark as Refunded", "yatra"),
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: async (payment: Payment) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([payment.id], "refunded");
          queryClient.invalidateQueries({ queryKey: ["payments"] });
          queryClient.invalidateQueries({ queryKey: ["payments-stats"] });
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
          showToast(__("Payment status updated", "yatra"), "success");
        } catch (error: any) {
          showToast(
            error?.message || __("Failed to update payment status", "yatra"),
            "error",
          );
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (payment: Payment) =>
        can("yatra_edit_bookings") && payment.payment_status !== "refunded",
    },
    {
      key: "mark_cancelled",
      label: __("Mark as Cancelled", "yatra"),
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: async (payment: Payment) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([payment.id], "cancelled");
          queryClient.invalidateQueries({ queryKey: ["payments"] });
          queryClient.invalidateQueries({ queryKey: ["payments-stats"] });
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
          showToast(__("Payment status updated", "yatra"), "success");
        } catch (error: any) {
          showToast(
            error?.message || __("Failed to update payment status", "yatra"),
            "error",
          );
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (payment: Payment) =>
        can("yatra_edit_bookings") && payment.payment_status !== "cancelled",
    },
    {
      key: "delete",
      label: __("Delete", "yatra"),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (payment: Payment) => handleDelete(payment),
      variant: "destructive" as const,
    },
  ];

  return (
    <div className="space-y-3">
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, payment: null })}
        onConfirm={confirmDelete}
        title={__("Delete Payment", "yatra")}
        message={
          deleteConfirm.payment
            ? __(
                'Are you sure you want to delete payment "{number}"? This action cannot be undone.',
                "yatra",
              ).replace("{number}", deleteConfirm.payment.payment_number)
            : __(
                "Are you sure you want to delete this payment? This action cannot be undone.",
                "yatra",
              )
        }
        confirmText={__("Delete", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <PageHeader
        title={__("Payments", "yatra")}
        description={__("Manage payment records for bookings", "yatra")}
        actionCapability="yatra_edit_bookings"
        actions={
          <Button
            onClick={handleCreatePayment}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {__("Add New Payment", "yatra")}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
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
                placeholder={__("Search payments...", "yatra")}
              />
            </div>

            <div className="w-full lg:w-auto flex lg:justify-end">
              <Select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full lg:w-48 max-w-xs"
              >
                <option value="all">{__("All Methods", "yatra")}</option>
                <option value="Credit Card">
                  {__("Credit Card", "yatra")}
                </option>
                <option value="PayPal">{__("PayPal", "yatra")}</option>
                <option value="Bank Transfer">
                  {__("Bank Transfer", "yatra")}
                </option>
                <option value="Cash">{__("Cash", "yatra")}</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_bookings">
        <>
          {!error && (
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
                  label: __("All", "yatra"),
                  count: countFor("all"),
                },
                {
                  key: "completed",
                  label: __("Completed", "yatra"),
                  count: countFor("completed"),
                },
                {
                  key: "pending",
                  label: __("Pending", "yatra"),
                  count: countFor("pending"),
                },
                {
                  key: "partial",
                  label: __("Partial", "yatra"),
                  count: countFor("partial"),
                },
                {
                  key: "failed",
                  label: __("Failed", "yatra"),
                  count: countFor("failed"),
                },
                {
                  key: "refunded",
                  label: __("Refunded", "yatra"),
                  count: countFor("refunded"),
                },
                {
                  key: "cancelled",
                  label: __("Cancelled", "yatra"),
                  count: countFor("cancelled"),
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
          )}

          <Card>
            <CardContent className="p-0">
              <SharedTable
                data={payments}
                columns={columns}
                actions={actions}
                isLoading={isLoading}
                isError={!!error}
                errorText={__("Error loading payments", "yatra")}
                errorDescription={__(
                  "We couldn’t connect to the payments service. Please refresh or try again in a moment.",
                  "We couldn’t connect to the payments service. Please refresh or try again in a moment.",
                )}
                onRetry={() => {
                  queryClient.invalidateQueries({ queryKey: ["payments"] });
                  queryClient.invalidateQueries({
                    queryKey: ["payments-stats"],
                  });
                }}
                errorDetails={errorContext.details}
                errorRequestInfo={errorContext.requestInfo}
                emptyText={__("No payments found", "yatra")}
                emptyDescription={
                  hasFilters
                    ? __(
                        "Try adjusting your filters to see more results.",
                        "yatra",
                      )
                    : __(
                        "Get started by recording your first payment.",
                        "yatra",
                      )
                }
                onCreateClick={
                  can("yatra_edit_bookings") ? handleCreatePayment : undefined
                }
                onSort={handleSort}
                getSortIcon={getSortIcon}
                selectedItemIds={selectedIds}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                isAllSelected={isAllSelected}
                getItemId={(payment: Payment) => payment.id}
                skeletonRows={5}
                capability="yatra_view_bookings"
              />
            </CardContent>
          </Card>

          {!error && total > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={perPage}
                onPageChange={(newPage) => setPage(newPage)}
                itemName={__("payments", "yatra")}
              />
            </div>
          )}
        </>
      </ConditionalRender>
    </div>
  );
};

export default Payments;
