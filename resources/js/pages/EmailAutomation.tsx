import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { __ } from "../lib/i18n";
import { apiClient } from "../lib/api-client";
import { useToast } from "../components/ui/toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Select } from "../components/ui/select";
import { PageHeader } from "../components/common/PageHeader";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { Switch } from "../components/ui/switch";
import {
  Table as SharedTable,
  BulkActionToolbar,
  Pagination,
} from "../components/shared";
import PremiumUpgradeCard from "./premium-pages/EmailAutomation";
import {
  Mail,
  Edit,
  Search,
  CheckCircle,
  Clock,
  FileText,
  CreditCard,
  MessageSquare,
  Bell,
  Megaphone,
  Plus,
  Trash2,
  Play,
  Pause,
  Calendar,
  Zap,
  GitBranch,
  Copy,
} from "lucide-react";
import { isProPluginActive } from "../lib/plugin-utils";

interface EmailTemplate {
  id: number;
  template_key: string;
  event_key: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  category: string;
  recipient_type: "customer" | "admin";
  is_active: boolean;
  is_system: boolean;
  variables: string[];
  to_email?: string;
  from_email?: string;
  from_name?: string;
  reply_to?: string;
  created_at: string;
  updated_at: string;
}

// Helper to detect actual recipient type based on to_email field
const getEffectiveRecipientType = (
  template: EmailTemplate,
): "customer" | "admin" => {
  const toEmail = template.to_email || "";
  // If to_email contains admin_email placeholder, it's for admin
  if (toEmail.includes("{{admin_email}}") || toEmail.includes("admin")) {
    return "admin";
  }
  // If to_email contains customer_email placeholder or is empty (default to customer), it's for customer
  if (toEmail.includes("{{customer_email}}") || toEmail === "") {
    return "customer";
  }
  // Fall back to the stored recipient_type
  return template.recipient_type;
};

interface EmailLog {
  id: number;
  template_key: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  status: "sent" | "failed" | "opened" | "clicked";
  sent_at: string;
}

const isModuleAvailable = (): boolean => {
  if (!isProPluginActive()) {
    return false;
  }
  const raw = (window as any).yatraAdmin?.emailAutomationEnabled;
  return raw === true || raw === "true" || raw === 1 || raw === "1";
};

const categoryIcons: Record<string, React.ElementType> = {
  booking: FileText,
  payment: CreditCard,
  enquiry: MessageSquare,
  reminder: Bell,
  marketing: Megaphone,
};

const EmailTemplatesList: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [recipientFilter, setRecipientFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Column visibility state with localStorage
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem("yatra-email-templates-columns");
    return saved
      ? JSON.parse(saved)
      : {
          name: true,
          event: true,
          description: true,
          category: true,
          recipient_type: true,
          is_active: true,
        };
  });

  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey],
    };
    setVisibleColumns(newVisibleColumns);
    localStorage.setItem(
      "yatra-email-templates-columns",
      JSON.stringify(newVisibleColumns),
    );
  };

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const response = await apiClient.get("/email-templates");
      return response;
    },
    enabled: isModuleAvailable(),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      id,
      is_active,
    }: {
      id: number;
      is_active: boolean;
    }) => {
      return await apiClient.put(`/email-templates/${id}`, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      showToast(__("Template updated"), "success");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/email-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      showToast(__("Template deleted"), "success");
    },
    onError: (error: any) => {
      showToast(error?.message || __("Failed to delete template"), "error");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.post(`/email-templates/${id}/duplicate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      showToast(__("Template duplicated successfully"), "success");
    },
    onError: (error: any) => {
      showToast(error?.message || __("Failed to duplicate template"), "error");
    },
  });

  // Bulk delete mutation (only deletes custom templates)
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      // Filter to only delete custom templates
      const customTemplateIds = ids.filter((id) => {
        const template = templates.find((t: EmailTemplate) => t.id === id);
        return template && !template.is_system;
      });

      if (customTemplateIds.length === 0) {
        throw new Error(
          __(
            "No custom templates selected. System templates cannot be deleted.",
          ),
        );
      }

      // Delete each custom template
      await Promise.all(
        customTemplateIds.map((id) =>
          apiClient.delete(`/email-templates/${id}`),
        ),
      );
      return {
        deleted: customTemplateIds.length,
        skipped: ids.length - customTemplateIds.length,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      setSelectedIds([]);
      setBulkAction("");
      if (data.skipped > 0) {
        showToast(
          __(
            `Deleted ${data.deleted} template(s). ${data.skipped} system template(s) were skipped.`,
          ),
          "success",
        );
      } else {
        showToast(__(`Deleted ${data.deleted} template(s)`), "success");
      }
    },
    onError: (error: any) => {
      showToast(error?.message || __("Failed to delete templates"), "error");
    },
  });

  const templates = templatesData?.data || [];
  const categories: string[] = [
    ...new Set(templates.map((t: EmailTemplate) => t.category)),
  ] as string[];

  const filteredTemplates = useMemo(() => {
    return templates.filter((t: EmailTemplate) => {
      const matchesSearch =
        !searchTerm ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || t.category === categoryFilter;
      const matchesRecipient =
        recipientFilter === "all" || t.recipient_type === recipientFilter;
      const matchesEvent = eventFilter === "all" || t.event_key === eventFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && t.is_active) ||
        (statusFilter === "inactive" && !t.is_active);
      return (
        matchesSearch &&
        matchesCategory &&
        matchesRecipient &&
        matchesEvent &&
        matchesStatus
      );
    });
  }, [
    templates,
    searchTerm,
    categoryFilter,
    recipientFilter,
    eventFilter,
    statusFilter,
  ]);

  // Pagination calculations
  const totalFilteredItems = filteredTemplates.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
  const paginatedTemplates = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTemplates.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTemplates, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, recipientFilter, eventFilter, statusFilter]);

  const handleEdit = (template: EmailTemplate) => {
    window.location.href = `admin.php?page=yatra&subpage=email-automation&action=edit&id=${template.id}`;
  };

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    template: EmailTemplate | null;
  }>({
    isOpen: false,
    template: null,
  });

  const handleDelete = useCallback((template: EmailTemplate) => {
    setDeleteDialog({ isOpen: true, template });
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteDialog.template) {
      deleteMutation.mutate(deleteDialog.template.id);
    }
    setDeleteDialog({ isOpen: false, template: null });
  }, [deleteDialog.template, deleteMutation]);

  const cancelDelete = useCallback(() => {
    setDeleteDialog({ isOpen: false, template: null });
  }, []);

  const handleDuplicate = (template: EmailTemplate) => {
    duplicateMutation.mutate(template.id);
  };

  const handleCreate = () => {
    window.location.href =
      "admin.php?page=yatra&subpage=email-automation&tab=template&action=create";
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedIds.length === 0) {
      showToast(__("Please select templates and an action"), "error");
      return;
    }

    if (bulkAction === "delete") {
      // BulkActionToolbar handles confirmation dialog
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredTemplates.map((t: EmailTemplate) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string | number, checked: boolean) => {
    const numId = typeof id === "string" ? parseInt(id, 10) : id;
    if (checked) {
      setSelectedIds([...selectedIds, numId]);
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== numId));
    }
  };

  // Get events from window.yatraAdmin (passed from PHP)
  const events = (window as any).yatraAdmin?.emailEvents || [];

  // Helper to get event key (just return as-is since it's already in dot notation)
  const formatEventKey = (eventKey: string) => {
    return eventKey || "-";
  };

  const columns = [
    {
      key: "name",
      label: __("Template"),
      visible: visibleColumns.name,
      render: (template: EmailTemplate) => {
        const CategoryIcon = categoryIcons[template.category] || Mail;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <CategoryIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <a
                href={`admin.php?page=yatra&subpage=email-automation&action=edit&id=${template.id}`}
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
              >
                {template.name}
              </a>
              {template.is_system ? (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {__("System")}
                </span>
              ) : (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {__("Custom")}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "event",
      label: __("Event"),
      visible: visibleColumns.event,
      render: (template: EmailTemplate) => {
        const eventInfo = events.find((e: any) => e.key === template.event_key);
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 cursor-help"
            title={eventInfo?.description || ""}
          >
            <Zap className="w-3 h-3" />
            {formatEventKey(template.event_key)}
          </span>
        );
      },
    },
    {
      key: "description",
      label: __("Description"),
      visible: visibleColumns.description,
      render: (template: EmailTemplate) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
          {template.description || "-"}
        </span>
      ),
    },
    {
      key: "category",
      label: __("Category"),
      visible: visibleColumns.category,
      render: (template: EmailTemplate) => {
        const CategoryIcon = categoryIcons[template.category] || Mail;
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <CategoryIcon className="w-3 h-3" />
            {template.category.charAt(0).toUpperCase() +
              template.category.slice(1)}
          </span>
        );
      },
    },
    {
      key: "recipient_type",
      label: __("Recipient"),
      visible: visibleColumns.recipient_type,
      render: (template: EmailTemplate) => {
        const effectiveRecipient = getEffectiveRecipientType(template);
        const toEmail = template.to_email || "";
        return (
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${
                effectiveRecipient === "admin"
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              }`}
            >
              {effectiveRecipient === "admin" ? __("Admin") : __("Customer")}
            </span>
            {toEmail && (
              <span
                className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]"
                title={toEmail}
              >
                {toEmail}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "is_active",
      label: __("Status"),
      visible: visibleColumns.is_active,
      render: (template: EmailTemplate) => (
        <Switch
          checked={template.is_active}
          onCheckedChange={(checked) =>
            toggleMutation.mutate({ id: template.id, is_active: checked })
          }
          disabled={toggleMutation.isPending}
        />
      ),
    },
  ];

  const actions = [
    {
      key: "edit",
      label: __("Edit"),
      icon: <Edit className="w-4 h-4" />,
      onClick: handleEdit,
    },
    {
      key: "duplicate",
      label: __("Duplicate"),
      icon: <Copy className="w-4 h-4" />,
      onClick: handleDuplicate,
    },
    {
      key: "delete",
      label: __("Delete"),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDelete,
      condition: (template: EmailTemplate) => !template.is_system,
      variant: "destructive" as const,
    },
  ];

  const columnOptions = [
    { key: "name", label: __("Template"), visible: visibleColumns.name },
    { key: "event", label: __("Event"), visible: visibleColumns.event },
    {
      key: "description",
      label: __("Description"),
      visible: visibleColumns.description,
    },
    {
      key: "category",
      label: __("Category"),
      visible: visibleColumns.category,
    },
    {
      key: "recipient_type",
      label: __("Recipient"),
      visible: visibleColumns.recipient_type,
    },
    {
      key: "is_active",
      label: __("Status"),
      visible: visibleColumns.is_active,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Create Template Button - Outside Filter Container */}
      <div className="flex justify-end">
        <Button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {__("Create Template")}
        </Button>
      </div>

      {/* Filters - Grid Layout */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Search Field - Takes most space */}
            <div className="lg:col-span-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={__("Search templates...")}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:col-span-2">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full"
              >
                <option value="all">{__("All Categories")}</option>
                {categories.map((cat: string) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </Select>
            </div>

            {/* Recipient Filter */}
            <div className="lg:col-span-2">
              <Select
                value={recipientFilter}
                onChange={(e) => setRecipientFilter(e.target.value)}
                className="w-full"
              >
                <option value="all">{__("All Recipients")}</option>
                <option value="customer">{__("Customer")}</option>
                <option value="admin">{__("Admin")}</option>
              </Select>
            </div>

            {/* Event Filter */}
            <div className="lg:col-span-2">
              <Select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="w-full"
              >
                <option value="all">{__("All Events")}</option>
                {events.map((event: any) => (
                  <option key={event.key} value={event.key}>
                    {event.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions - Outside of filter card */}
      <BulkActionToolbar
        selectedIds={selectedIds}
        bulkAction={bulkAction}
        setBulkAction={setBulkAction}
        onApply={handleBulkAction}
        onClearSelection={() => setSelectedIds([])}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusOptions={[
          { key: "all", label: __("All"), count: templates.length },
          {
            key: "active",
            label: __("Active"),
            count: templates.filter((t: EmailTemplate) => t.is_active).length,
          },
          {
            key: "inactive",
            label: __("Inactive"),
            count: templates.filter((t: EmailTemplate) => !t.is_active).length,
          },
        ]}
        showColumnsDropdown={showColumnsDropdown}
        setShowColumnsDropdown={setShowColumnsDropdown}
        columnOptions={columnOptions}
        onToggleColumn={toggleColumn}
        bulkMutationPending={bulkDeleteMutation.isPending}
        totalItems={filteredTemplates.length}
        bulkActionOptions={[{ value: "delete", label: __("Delete") }]}
      />

      {/* Templates Table */}
      <Card>
        <CardContent className="p-0">
          <SharedTable
            data={paginatedTemplates}
            columns={columns}
            actions={actions}
            isLoading={isLoading}
            emptyText={__("No templates found")}
            emptyDescription={__(
              "Create your first email template to get started.",
            )}
            onCreateClick={handleCreate}
            getItemId={(template: EmailTemplate) => template.id}
            capability="manage_yatra"
            skeletonRows={5}
            selectedItemIds={selectedIds}
            onSelectItem={handleSelectOne}
            onSelectAll={handleSelectAll}
            isAllSelected={
              selectedIds.length > 0 &&
              selectedIds.length === paginatedTemplates.length
            }
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalFilteredItems > itemsPerPage && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalFilteredItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemName={__("templates")}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title={__("Delete Template")}
        message={
          deleteDialog.template
            ? __(
                'Are you sure you want to delete "{name}"? This action cannot be undone.',
              ).replace("{name}", deleteDialog.template.name)
            : ""
        }
        confirmText={__("Delete")}
        cancelText={__("Cancel")}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

interface EmailSequence {
  id: number;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: any;
  status: "active" | "paused" | "draft";
  applicable_to: string;
  trip_ids: number[];
  steps_count?: number;
}

const triggerTypes = [
  {
    value: "booking_created",
    label: "Booking Created",
    icon: Calendar,
    description: "When a new booking is made",
  },
  {
    value: "booking_confirmed",
    label: "Booking Confirmed",
    icon: CheckCircle,
    description: "When booking status changes to confirmed",
  },
  {
    value: "payment_received",
    label: "Payment Received",
    icon: CreditCard,
    description: "When a payment is processed",
  },
  {
    value: "days_before_trip",
    label: "Days Before Trip",
    icon: Clock,
    description: "X days before the travel date",
  },
  {
    value: "days_after_trip",
    label: "Days After Trip",
    icon: Clock,
    description: "X days after the trip ends",
  },
  {
    value: "enquiry_created",
    label: "Enquiry Received",
    icon: MessageSquare,
    description: "When a new enquiry is submitted",
  },
];

const EmailSequencesList: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: sequencesData, isLoading } = useQuery({
    queryKey: ["email-sequences"],
    queryFn: async () => {
      const response = await apiClient.get("/email-sequences");
      return response;
    },
    enabled: isModuleAvailable(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/email-sequences/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences"] });
      showToast(__("Sequence deleted"), "success");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiClient.put(`/email-sequences/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences"] });
      showToast(__("Sequence status updated"), "success");
    },
  });

  const sequences = sequencesData?.data || [];

  const navigateToCreate = () => {
    window.location.href =
      "admin.php?page=yatra&subpage=email-automation&tab=sequence&action=create";
  };

  const navigateToEdit = (id: number) => {
    window.location.href = `admin.php?page=yatra&subpage=email-automation&tab=sequence&action=edit&id=${id}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-36 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>

        {/* Sequences List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="flex items-center gap-4">
                      <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {__("Active")}
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            {__("Paused")}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {__("Draft")}
          </Badge>
        );
    }
  };

  const getTriggerLabel = (triggerType: string) => {
    const trigger = triggerTypes.find((t) => t.value === triggerType);
    return trigger?.label || triggerType;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {__("Email Sequences")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {__("Create automated email workflows triggered by events")}
          </p>
        </div>
        <Button
          onClick={navigateToCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {__("Create Sequence")}
        </Button>
      </div>

      {/* Sequences List */}
      {sequences.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <GitBranch className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {__("No Sequences Yet")}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {__(
                "Create your first automated email sequence to engage customers at the right time.",
              )}
            </p>
            <Button
              onClick={navigateToCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {__("Create Your First Sequence")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sequences.map((sequence: EmailSequence) => (
            <Card key={sequence.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {sequence.name}
                      </h3>
                      {getStatusBadge(sequence.status)}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {sequence.description || __("No description")}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {getTriggerLabel(sequence.trigger_type)}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        {sequence.steps_count || 0} {__("steps")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {sequence.status === "active" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: sequence.id,
                            status: "paused",
                          })
                        }
                      >
                        <Pause className="w-4 h-4 text-yellow-500" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: sequence.id,
                            status: "active",
                          })
                        }
                      >
                        <Play className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToEdit(sequence.id)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      {__("Edit")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (
                          confirm(
                            __(
                              "Are you sure you want to delete this sequence?",
                            ),
                          )
                        ) {
                          deleteMutation.mutate(sequence.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const EmailLogsList: React.FC = () => {
  const [page] = useState(1);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ["email-logs", page],
    queryFn: async () => {
      const response = await apiClient.get("/email-logs", {
        params: { page, per_page: 20 },
      });
      return response;
    },
    enabled: isModuleAvailable(),
  });

  const logs = logsData?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <th key={i} className="px-4 py-3">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[1, 2, 3, 4, 5].map((row) => (
                  <tr key={row}>
                    {[1, 2, 3, 4, 5].map((col) => (
                      <td key={col} className="px-4 py-3">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          {__("Email Logs")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {__("No emails sent yet")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {__("Recipient")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {__("Subject")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {__("Template")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {__("Status")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {__("Sent")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log: EmailLog) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.recipient_name || "-"}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {log.recipient_email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {log.subject}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {log.template_key}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          log.status === "sent"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : log.status === "failed"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }
                      >
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.sent_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const EmailAutomation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "templates" | "sequences" | "logs"
  >("templates");

  if (!isModuleAvailable()) {
    return <PremiumUpgradeCard />;
  }

  const tabs = [
    { key: "templates", label: __("Email Templates"), icon: FileText },
    { key: "sequences", label: __("Sequences"), icon: GitBranch },
    { key: "logs", label: __("Email Logs"), icon: Mail },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        description={__(
          "Customize email templates and manage automated sequences",
        )}
      />

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-1 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <CardContent className="p-6">
          {/* Content */}
          {activeTab === "templates" && <EmailTemplatesList />}
          {activeTab === "sequences" && <EmailSequencesList />}
          {activeTab === "logs" && <EmailLogsList />}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailAutomation;
