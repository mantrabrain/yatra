/**
 * Customers Page
 * Clean, minimal SaaS-style customers management page with dynamic data
 */

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Check,
  PauseCircle,
  ShieldX,
} from "lucide-react";
import {
  Pagination,
  SearchFilterToolbar,
  BulkActionToolbar,
  Table as SharedTable,
} from "../components/shared";
import { __ } from "../lib/i18n";
import { apiService } from "../lib/api-client";
import { getErrorContext } from "../lib/errors";
import { usePermissions } from "../hooks/usePermissions";
import { useToast } from "../components/ui/toast";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { PageHeader } from "../components/common/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { ConditionalRender } from "../components/ui/conditional-render";
import { Skeleton } from "../components/ui/skeleton";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { formatYatraMoney } from "../lib/currency-display";
import { formatDate as formatDateUtil } from "../lib/dateFormat";

interface Customer {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  city?: string;
  total_bookings: number;
  total_spent: number;
  loyalty_tier: string;
  status: string;
  created_at: string;
  last_booking_date?: string;
}

interface CustomersResponse {
  data: Customer[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loyaltyFilter, setLoyaltyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const { can, isPro } = usePermissions();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const translations = (window as any)?.yatraAdmin?.translations || {};

  // Helper function for translations
  const __ = (text: string) => translations[text] || text;

  const baseAdminUrl = (window as any).yatraAdmin?.adminUrl || "";

  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window === "undefined") {
      return {
        customer: true,
        location: true,
        total_bookings: true,
        total_spent: true,
        loyalty: true,
        status: true,
        created_at: true,
      };
    }
    const saved = window.localStorage.getItem(
      "yatra-customers-visible-columns",
    );
    return saved
      ? JSON.parse(saved)
      : {
          customer: true,
          location: true,
          total_bookings: true,
          total_spent: true,
          loyalty: true,
          status: true,
          created_at: true,
        };
  });

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: 10,
      orderby: sortBy,
      order: sortOrder,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (statusFilter !== "all") {
      params.status = statusFilter;
    }

    if (loyaltyFilter !== "all") {
      params.loyalty_tier = loyaltyFilter;
    }

    return params;
  }, [searchTerm, statusFilter, loyaltyFilter, sortBy, sortOrder, page]);

  // Fetch customers from API
  const { data, isLoading, error } = useQuery<CustomersResponse>({
    queryKey: ["customers", queryParams],
    queryFn: async () => {
      const paramsObj: Record<string, any> = {};
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          paramsObj[key] = value;
        }
      });

      return await apiService.getCustomers(paramsObj);
    },
    enabled: can("yatra_view_customers"),
  });

  // Fetch customer stats (counts)
  const { data: statsRaw } = useQuery({
    queryKey: ["customers-stats"],
    queryFn: async () => {
      return await apiService.getCustomerStats();
    },
    enabled: can("yatra_view_customers"),
  });
  const statsData: any = statsRaw ?? {};

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiService.deleteCustomer(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      showToast(__("Customer deleted successfully"), "success");
    },
    onError: (error: any) => {
      showToast(error?.message || __("Failed to delete customer"), "error");
    },
  });

  const customers = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.pages || Math.ceil(total / 10);
  const errorContext = getErrorContext(error);

  const formatDate = (dateString: string | null | undefined) => {
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
        label: __("Active"),
      },
      inactive: {
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
        label: __("Inactive"),
      },
      blocked: {
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        label: __("Blocked"),
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
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${tierInfo.className}`}
      >
        <span>{tierInfo.icon}</span>
        <span className="capitalize">{tier}</span>
      </span>
    );
  };

  const handleEdit = (customer: Customer) => {
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=customers&action=edit&id=${customer.id}`;
  };

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id);
    }
  };

  const handleView = (customer: Customer) => {
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=customers&action=view&id=${customer.id}`;
  };

  const handleCreateCustomer = () => {
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=customers&action=create`;
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setLoyaltyFilter("all");
    setSortBy("created_at");
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
    loyaltyFilter !== "all" ||
    sortBy !== "created_at" ||
    sortOrder !== "desc";

  const toggleColumn = (key: string) => {
    const next = {
      ...visibleColumns,
      [key]: !visibleColumns[key as keyof typeof visibleColumns],
    };
    setVisibleColumns(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "yatra-customers-visible-columns",
        JSON.stringify(next),
      );
    }
  };

  const handleSelectItem = (id: string | number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((v) => v !== id),
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(customers.map((customer) => customer.id));
    } else {
      setSelectedIds([]);
    }
  };

  const isAllSelected =
    customers.length > 0 && selectedIds.length === customers.length;

  const updateStatusForIds = async (
    ids: (string | number)[],
    newStatus: string,
  ) => {
    await Promise.all(
      ids.map(async (id) => {
        await apiService.updateCustomerStatus(id, newStatus);
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
        await Promise.all(
          selectedIds.map((id) => apiService.deleteCustomer(id)),
        );
        showToast(__("Selected customers deleted successfully"), "success");
      } else {
        await updateStatusForIds(selectedIds, bulkAction);
        showToast(__("Customer statuses updated successfully"), "success");
      }

      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setSelectedIds([]);
      setBulkAction("");
    } catch (error: any) {
      showToast(
        error?.message || __("Failed to perform bulk action on customers"),
        "error",
      );
    } finally {
      setIsBulkPending(false);
    }
  };

  const allBulkActionOptions = [
    { value: "active", label: __("Mark as Active") },
    { value: "inactive", label: __("Mark as Inactive") },
    { value: "blocked", label: __("Mark as Blocked") },
    { value: "delete", label: __("Delete permanently") },
  ];

  const getBulkActionOptionsForStatus = (view: string) => {
    switch (view) {
      case "active":
        return allBulkActionOptions.filter((opt) =>
          ["inactive", "blocked", "delete"].includes(opt.value),
        );
      case "inactive":
        return allBulkActionOptions.filter((opt) =>
          ["active", "blocked", "delete"].includes(opt.value),
        );
      case "blocked":
        return allBulkActionOptions.filter((opt) =>
          ["active", "inactive", "delete"].includes(opt.value),
        );
      default:
        return allBulkActionOptions;
    }
  };

  const bulkActionOptions = getBulkActionOptionsForStatus(statusFilter);

  const statusOptions = [
    { value: "all", label: __("All Status") },
    { value: "active", label: __("Active") },
    { value: "inactive", label: __("Inactive") },
    { value: "blocked", label: __("Blocked") },
  ];

  const sortOptions = [
    { value: "created_at", label: __("Registration Date") },
    { value: "name", label: __("Name") },
    { value: "email", label: __("Email") },
    { value: "country", label: __("Country") },
    { value: "total_bookings", label: __("Bookings") },
    { value: "total_spent", label: __("Total Spent") },
    { value: "status", label: __("Status") },
  ];

  // Helper functions};

  const columnOptions = [
    {
      key: "customer",
      label: __("Customer"),
      visible: visibleColumns.customer,
    },
    {
      key: "location",
      label: __("Location"),
      visible: visibleColumns.location,
    },
    {
      key: "total_bookings",
      label: __("Bookings"),
      visible: visibleColumns.total_bookings,
    },
    {
      key: "total_spent",
      label: __("Total Spent"),
      visible: visibleColumns.total_spent,
    },
    { key: "loyalty", label: __("Loyalty"), visible: visibleColumns.loyalty },
    { key: "status", label: __("Status"), visible: visibleColumns.status },
    {
      key: "created_at",
      label: __("Registered"),
      visible: visibleColumns.created_at,
    },
  ];

  const columns = [
    {
      key: "customer",
      label: __("Customer"),
      sortable: true,
      visible: visibleColumns.customer,
      render: (customer: Customer) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            <a
              href={`${baseAdminUrl}?page=yatra&subpage=customers&action=view&id=${customer.id}`}
              className="hover:underline underline-offset-2 text-blue-600 dark:text-blue-400"
            >
              {customer.name || `${customer.first_name} ${customer.last_name}`}
            </a>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {customer.email}
          </div>
          {customer.phone && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <Phone className="w-3 h-3" />
              {customer.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "location",
      label: __("Location"),
      sortable: true,
      visible: visibleColumns.location,
      render: (customer: Customer) =>
        customer.country ? (
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {customer.city ? `${customer.city}, ` : ""}
              {customer.country}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    isPro && {
      key: "total_bookings",
      label: __("Bookings"),
      sortable: true,
      visible: visibleColumns.total_bookings,
      render: (customer: Customer) => (
        <span className="text-gray-600 dark:text-gray-400">
          {customer.total_bookings}
        </span>
      ),
    },
    isPro && {
      key: "total_spent",
      label: __("Total Spent"),
      sortable: true,
      visible: visibleColumns.total_spent,
      render: (customer: Customer) => (
        <span className="font-medium">{formatPrice(customer.total_spent)}</span>
      ),
    },
    {
      key: "loyalty",
      label: __("Loyalty"),
      sortable: false,
      visible: visibleColumns.loyalty,
      render: (customer: Customer) =>
        getLoyaltyBadge(customer.loyalty_tier || "bronze"),
    },
    {
      key: "status",
      label: __("Status"),
      sortable: true,
      visible: visibleColumns.status,
      render: (customer: Customer) => getStatusBadge(customer.status),
    },
    {
      key: "created_at",
      label: __("Registered"),
      sortable: true,
      visible: visibleColumns.created_at,
      render: (customer: Customer) => (
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          {formatDate(customer.created_at)}
        </span>
      ),
    },
  ].filter(Boolean);

  const actions = [
    {
      key: "view",
      label: __("View"),
      icon: <Eye className="w-4 h-4" />,
      onClick: (customer: Customer) => handleView(customer),
    },
    {
      key: "edit",
      label: __("Edit"),
      icon: <Edit className="w-4 h-4" />,
      onClick: (customer: Customer) => handleEdit(customer),
      condition: () => can("yatra_edit_customers"),
    },
    {
      key: "mark_active",
      label: __("Mark as Active"),
      icon: <Check className="w-4 h-4" />,
      onClick: async (customer: Customer) => {
        await updateStatusForIds([customer.id], "active");
        queryClient.invalidateQueries({ queryKey: ["customers"] });
      },
      condition: (customer: Customer) =>
        can("yatra_edit_customers") && customer.status !== "active",
    },
    {
      key: "mark_inactive",
      label: __("Mark as Inactive"),
      icon: <PauseCircle className="w-4 h-4" />,
      onClick: async (customer: Customer) => {
        await updateStatusForIds([customer.id], "inactive");
        queryClient.invalidateQueries({ queryKey: ["customers"] });
      },
      condition: (customer: Customer) =>
        can("yatra_edit_customers") && customer.status !== "inactive",
    },
    {
      key: "mark_blocked",
      label: __("Mark as Blocked"),
      icon: <ShieldX className="w-4 h-4" />,
      onClick: async (customer: Customer) => {
        await updateStatusForIds([customer.id], "blocked");
        queryClient.invalidateQueries({ queryKey: ["customers"] });
      },
      condition: (customer: Customer) =>
        can("yatra_edit_customers") && customer.status !== "blocked",
    },
    {
      key: "delete",
      label: __("Delete"),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (customer: Customer) => handleDelete(customer),
      variant: "destructive" as const,
      condition: () => can("yatra_delete_customers"),
    },
  ];

  // Skeleton loader
  const renderSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[250px]">{__("Customer")}</TableHead>
          <TableHead>{__("Location")}</TableHead>
          {isPro && <TableHead>{__("Bookings")}</TableHead>}
          {isPro && <TableHead>{__("Total Spent")}</TableHead>}
          <TableHead>{__("Loyalty")}</TableHead>
          <TableHead>{__("Status")}</TableHead>
          <TableHead>{__("Registered")}</TableHead>
          <TableHead className="text-right w-[100px]">
            {__("Actions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            {isPro && (
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
            )}
            {isPro && (
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
            )}
            <TableCell>
              <Skeleton className="h-6 w-16 rounded" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-14 rounded" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-3">
      <PageHeader
        title={__("Customers")}
        description={__("Manage your customer database")}
        actionCapability="yatra_edit_customers"
        actions={
          <Button
            onClick={handleCreateCustomer}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {__("Add New Customer")}
          </Button>
        }
      />

      <div className="space-y-3">
        {/* Search and Filters Card */}
        <ConditionalRender capability="yatra_view_customers">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Search & status/sort (handled by toolbar) */}
                <div className={isPro ? "lg:col-span-8" : "lg:col-span-12"}>
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
                    placeholder={__("Search customers...")}
                  />
                </div>

                {/* Loyalty Filter */}
                {isPro && (
                  <div className="lg:col-span-4">
                    <Select
                      value={loyaltyFilter}
                      onChange={(e) => {
                        setLoyaltyFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full"
                    >
                      <option value="all">{__("All Tiers")}</option>
                      <option value="bronze">{__("Bronze")}</option>
                      <option value="silver">{__("Silver")}</option>
                      <option value="gold">{__("Gold")}</option>
                      <option value="platinum">{__("Platinum")}</option>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </ConditionalRender>

        {/* Bulk Actions Toolbar */}
        <ConditionalRender capability="yatra_view_customers">
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
              { key: "all", label: __("All"), count: statsData?.all ?? 0 },
              {
                key: "active",
                label: __("Active"),
                count: statsData?.active ?? 0,
              },
              {
                key: "inactive",
                label: __("Inactive"),
                count: statsData?.inactive ?? 0,
              },
              {
                key: "blocked",
                label: __("Blocked"),
                count: statsData?.blocked ?? 0,
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
        </ConditionalRender>

        {/* Customers Table Card */}
        <ConditionalRender capability="yatra_view_customers">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                renderSkeleton()
              ) : (
                <SharedTable
                  data={customers}
                  columns={columns as any}
                  actions={actions as any}
                  isLoading={isLoading}
                  isError={!!error}
                  errorText={__("Error loading customers")}
                  errorDetails={errorContext.details}
                  errorRequestInfo={errorContext.requestInfo}
                  errorDescription={__(
                    "We couldn’t connect to the customers service. Please refresh or try again shortly.",
                  )}
                  onRetry={() =>
                    queryClient.invalidateQueries({ queryKey: ["customers"] })
                  }
                  emptyText={__("No customers found")}
                  emptyDescription={
                    hasFilters
                      ? __("Try adjusting your filters to see more results.")
                      : __("Customers will appear here when bookings are made")
                  }
                  onCreateClick={
                    can("yatra_edit_customers")
                      ? handleCreateCustomer
                      : undefined
                  }
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                  selectedItemIds={selectedIds}
                  onSelectItem={handleSelectItem}
                  onSelectAll={handleSelectAll}
                  isAllSelected={isAllSelected}
                  getItemId={(customer: Customer) => customer.id}
                  skeletonRows={5}
                  capability="yatra_view_customers"
                />
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {total > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={10}
                onPageChange={(newPage) => setPage(newPage)}
                itemName={__("customers")}
              />
            </div>
          )}
        </ConditionalRender>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={__("Delete Customer")}
        description={
          customerToDelete
            ? __(
                "Are you sure you want to delete this customer? This action cannot be undone.",
              ) + ` (${customerToDelete.name || customerToDelete.email})`
            : __(
                "Are you sure you want to delete this customer? This action cannot be undone.",
              )
        }
        confirmText={__("Delete")}
        cancelText={__("Cancel")}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Customers;
