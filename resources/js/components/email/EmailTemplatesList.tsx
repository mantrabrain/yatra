/**
 * Unified email templates table: Pro + Email Automation uses REST data;
 * otherwise the same layout with settings-backed core rows and locked Pro-only rows.
 */

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { __ } from "../../lib/i18n";
import { useToast } from "../ui/toast";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import { Switch } from "../ui/switch";
import {
  Table as SharedTable,
  BulkActionToolbar,
  Pagination,
} from "../shared";
import {
  Mail,
  Edit,
  Search,
  FileText,
  CreditCard,
  MessageSquare,
  Bell,
  Megaphone,
  Plus,
  Trash2,
  Zap,
  Copy,
  Lock,
  Eye,
} from "lucide-react";
import { isProPluginActive } from "../../lib/plugin-utils";
import {
  buildLocalTemplateRows,
  EMAIL_TEMPLATES_CATALOG,
  getCatalogEntryByTemplateKey,
  type UnifiedEmailTemplate,
} from "../../lib/email-templates-catalog";
import type { EmailSettingsValues } from "../settings/email-settings-types";
import type { EmailFieldChangeHandler } from "../settings/email-settings-types";
import {
  deleteEmailTemplate,
  duplicateEmailTemplate,
  fetchEmailTemplates,
  previewEmailTemplate,
  setEmailTemplateActive,
} from "../../api/email-automation-api";
import { previewCoreEmailTemplate } from "../../api/settings-api";
import { EmailPreviewModal } from "./EmailPreviewModal";

const EMAIL_TEMPLATE_VISIBLE_COLUMNS_DEFAULT: Record<string, boolean> = {
  name: true,
  event: true,
  subject: true,
  body_preview: true,
  description: true,
  category: true,
  recipient_type: true,
  is_active: true,
};

function plainTextEmailPreview(html: string, maxLen = 100): string {
  if (!html) return "";
  const plain = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen)}…`;
}

export type EmailTemplatesListProps = {
  automationModuleActive: boolean;
  settingsBridge?: {
    values: EmailSettingsValues;
    onFieldChange: EmailFieldChangeHandler;
  };
};

const getEffectiveRecipientType = (
  template: UnifiedEmailTemplate,
): "customer" | "admin" => {
  const catalog = getCatalogEntryByTemplateKey(template.template_key);
  if (catalog?.recipient_type) {
    return catalog.recipient_type;
  }
  const fromApi = template.recipient_type;
  if (fromApi === "admin" || fromApi === "customer") {
    return fromApi;
  }
  const toEmail = template.to_email || "";
  if (toEmail.includes("{{admin_email}}")) {
    return "admin";
  }
  if (
    toEmail.includes("{customer_email}") ||
    toEmail.includes("{{customer_email}}")
  ) {
    return "customer";
  }
  return "customer";
};

const categoryIcons: Record<string, React.ElementType> = {
  booking: FileText,
  payment: CreditCard,
  enquiry: MessageSquare,
  reminder: Bell,
  marketing: Megaphone,
};

const isApiTemplate = (t: UnifiedEmailTemplate): boolean => {
  if (t.is_locked) {
    return false;
  }
  if (typeof t.id === "number") {
    return true;
  }
  return typeof t.id === "string" && /^[0-9]+$/.test(String(t.id).trim());
};

/** Pro DB templates use numeric id; the API may return id as a string (e.g. "42"). */
function toNumericTemplateId(id: string | number | undefined): number | null {
  if (id === undefined) {
    return null;
  }
  if (typeof id === "number" && Number.isFinite(id)) {
    return id;
  }
  if (typeof id === "string" && /^[0-9]+$/.test(id.trim())) {
    return Number(id);
  }
  return null;
}

export const EmailTemplatesList: React.FC<EmailTemplatesListProps> = ({
  automationModuleActive,
  settingsBridge,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [recipientFilter, setRecipientFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<{
    subject: string;
    body: string;
  } | null>(null);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem("yatra-email-templates-columns");
    const parsed = saved ? JSON.parse(saved) : {};
    return { ...EMAIL_TEMPLATE_VISIBLE_COLUMNS_DEFAULT, ...parsed };
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

  const { data: templatesData, isLoading: apiLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => fetchEmailTemplates(),
    enabled: automationModuleActive,
  });

  const apiTemplates: UnifiedEmailTemplate[] = useMemo(() => {
    const raw = Array.isArray(templatesData) ? templatesData : [];
    return raw.map((t: UnifiedEmailTemplate) => ({
      ...t,
      is_locked: false,
    }));
  }, [templatesData]);

  const localTemplates = useMemo(() => {
    if (automationModuleActive || !settingsBridge) return [];
    return buildLocalTemplateRows(settingsBridge.values);
  }, [automationModuleActive, settingsBridge]);

  const templates = automationModuleActive ? apiTemplates : localTemplates;

  const isLoading = automationModuleActive ? apiLoading : false;

  const toggleMutation = useMutation({
    mutationFn: async ({
      id,
      is_active,
    }: {
      id: number;
      is_active: boolean;
    }) => {
      return await setEmailTemplateActive(id, is_active);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      showToast(__("Template updated"), "success");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await deleteEmailTemplate(id);
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
      return await duplicateEmailTemplate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      showToast(__("Template duplicated successfully"), "success");
    },
    onError: (error: any) => {
      showToast(error?.message || __("Failed to duplicate template"), "error");
    },
  });

  const proPreviewMutation = useMutation({
    mutationFn: (templateId: number) => previewEmailTemplate(templateId),
    onSuccess: (data) => {
      setPreviewPayload(data);
      setPreviewOpen(true);
    },
    onError: () => {
      showToast(__("Failed to load preview", "yatra"), "error");
    },
  });

  const corePreviewMutation = useMutation({
    mutationFn: (t: UnifiedEmailTemplate) =>
      previewCoreEmailTemplate({
        template_key: t.template_key,
        subject: t.subject || "",
        body: t.body || "",
      }),
    onSuccess: (data) => {
      setPreviewPayload(data);
      setPreviewOpen(true);
    },
    onError: () => {
      showToast(__("Failed to load preview", "yatra"), "error");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: (string | number)[]) => {
      const customTemplateIds = ids
        .map((id) => toNumericTemplateId(id))
        .filter((id): id is number => id !== null)
        .filter((id) => {
          const template = templates.find(
            (t) => toNumericTemplateId(t.id) === id,
          );
          return template && !template.is_system && isApiTemplate(template);
        });

      if (customTemplateIds.length === 0) {
        throw new Error(
          __(
            "No custom templates selected. System templates cannot be deleted.",
          ),
        );
      }

      await Promise.all(
        customTemplateIds.map((id) => deleteEmailTemplate(id)),
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

  const categories: string[] = useMemo(
    () => [...new Set(templates.map((t) => t.category))] as string[],
    [templates],
  );

  const events = useMemo(() => {
    if (automationModuleActive) {
      return (window as any).yatraAdmin?.emailEvents || [];
    }
    return [...new Set(EMAIL_TEMPLATES_CATALOG.map((e) => e.event_key))].map(
      (key) => ({ key, name: key }),
    );
  }, [automationModuleActive]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const q = searchTerm.toLowerCase();
      const bodyPlain = plainTextEmailPreview(t.body || "", 500).toLowerCase();
      const matchesSearch =
        !searchTerm ||
        t.name.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.subject || "").toLowerCase().includes(q) ||
        bodyPlain.includes(q);
      const matchesCategory =
        categoryFilter === "all" || t.category === categoryFilter;
      const matchesRecipient =
        recipientFilter === "all" ||
        getEffectiveRecipientType(t) === recipientFilter;
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

  const totalFilteredItems = filteredTemplates.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
  const paginatedTemplates = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTemplates.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTemplates, currentPage, itemsPerPage]);

  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, recipientFilter, eventFilter, statusFilter]);

  const handleLockedNavigate = useCallback(() => {
    if (isProPluginActive()) {
      window.location.href = "admin.php?page=yatra&subpage=modules";
    } else {
      window.open(
        "https://wpyatra.com/pricing?module=email-automation",
        "_blank",
      );
    }
  }, []);

  const handleEdit = (template: UnifiedEmailTemplate) => {
    if (template.is_locked) {
      handleLockedNavigate();
      return;
    }
    const proId = toNumericTemplateId(template.id);
    if (automationModuleActive && proId !== null) {
      window.location.href = `admin.php?page=yatra&subpage=email-automation&tab=templates&action=edit&id=${proId}`;
      return;
    }
    window.location.href = `admin.php?page=yatra&subpage=email-automation&tab=templates&action=edit&core_template=${encodeURIComponent(template.template_key)}`;
  };

  const handlePreview = (template: UnifiedEmailTemplate) => {
    if (template.is_locked) {
      return;
    }
    const numericId = toNumericTemplateId(template.id);

    if (automationModuleActive && numericId !== null) {
      proPreviewMutation.mutate(numericId);
    } else {
      corePreviewMutation.mutate(template);
    }
  };

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    template: UnifiedEmailTemplate | null;
  }>({ isOpen: false, template: null });

  const handleDelete = useCallback((template: UnifiedEmailTemplate) => {
    setDeleteDialog({ isOpen: true, template });
  }, []);

  const confirmDelete = useCallback(() => {
    const t = deleteDialog.template;
    if (!t) {
      setDeleteDialog({ isOpen: false, template: null });
      return;
    }
    const id = toNumericTemplateId(t.id);
    if (id !== null) {
      deleteMutation.mutate(id);
    }
    setDeleteDialog({ isOpen: false, template: null });
  }, [deleteDialog.template, deleteMutation]);

  const cancelDelete = useCallback(() => {
    setDeleteDialog({ isOpen: false, template: null });
  }, []);

  const handleDuplicate = (template: UnifiedEmailTemplate) => {
    const id = toNumericTemplateId(template.id);
    if (id !== null) {
      duplicateMutation.mutate(id);
    }
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
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredTemplates.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string | number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    }
  };

  const formatEventKey = (eventKey: string) => eventKey || "-";

  const emitSettingsCheckbox = (
    flagKey: keyof EmailSettingsValues,
    checked: boolean,
  ) => {
    if (!settingsBridge) return;
    settingsBridge.onFieldChange({
      target: {
        name: flagKey,
        type: "checkbox",
        checked,
      },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const columns = [
    {
      key: "name",
      label: __("Template"),
      visible: visibleColumns.name,
      render: (template: UnifiedEmailTemplate) => {
        const CategoryIcon = categoryIcons[template.category] || Mail;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <CategoryIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              {template.is_locked ? (
                <button
                  type="button"
                  onClick={() => handleLockedNavigate()}
                  className="text-left font-medium text-gray-600 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400"
                >
                  {template.name}
                  <Lock className="inline-block w-3.5 h-3.5 ml-1.5 -mt-0.5 opacity-70" />
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    {__("Pro", "yatra")}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleEdit(template)}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline text-left"
                >
                  {template.name}
                </button>
              )}
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
      render: (template: UnifiedEmailTemplate) => {
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
      key: "subject",
      label: __("Subject"),
      visible: visibleColumns.subject,
      render: (template: UnifiedEmailTemplate) => (
        <span
          className="text-sm text-gray-800 dark:text-gray-200 font-mono line-clamp-2 max-w-xs"
          title={template.subject || ""}
        >
          {(template.subject || "").trim() || "—"}
        </span>
      ),
    },
    {
      key: "body_preview",
      label: __("Body"),
      visible: visibleColumns.body_preview,
      render: (template: UnifiedEmailTemplate) => {
        const preview = plainTextEmailPreview(template.body || "");
        return (
          <span
            className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 max-w-md"
            title={preview}
          >
            {preview || "—"}
          </span>
        );
      },
    },
    {
      key: "description",
      label: __("Description"),
      visible: visibleColumns.description,
      render: (template: UnifiedEmailTemplate) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
          {template.description || "-"}
        </span>
      ),
    },
    {
      key: "category",
      label: __("Category"),
      visible: visibleColumns.category,
      render: (template: UnifiedEmailTemplate) => {
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
      render: (template: UnifiedEmailTemplate) => {
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
      render: (template: UnifiedEmailTemplate) => (
        <Switch
          checked={template.is_active}
          disabled={template.is_locked || toggleMutation.isPending}
          onCheckedChange={(checked) => {
            if (template.is_locked) return;
            const proId = toNumericTemplateId(template.id);
            if (automationModuleActive && proId !== null) {
              toggleMutation.mutate({ id: proId, is_active: checked });
              return;
            }
            const entry = EMAIL_TEMPLATES_CATALOG.find(
              (e) => e.template_key === template.template_key,
            );
            if (entry?.settingsFlag) {
              emitSettingsCheckbox(entry.settingsFlag, checked);
            }
          }}
        />
      ),
    },
  ];

  const actions = [
    {
      key: "preview",
      label: __("Preview", "yatra"),
      icon: <Eye className="w-4 h-4" />,
      onClick: handlePreview,
      condition: (template: UnifiedEmailTemplate) => !template.is_locked,
    },
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
      condition: (template: UnifiedEmailTemplate) =>
        automationModuleActive && isApiTemplate(template) && !template.is_system,
    },
    {
      key: "delete",
      label: __("Delete"),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDelete,
      condition: (template: UnifiedEmailTemplate) =>
        automationModuleActive && isApiTemplate(template) && !template.is_system,
      variant: "destructive" as const,
    },
  ];

  const columnOptions = [
    { key: "name", label: __("Template"), visible: visibleColumns.name },
    { key: "event", label: __("Event"), visible: visibleColumns.event },
    { key: "subject", label: __("Subject"), visible: visibleColumns.subject },
    {
      key: "body_preview",
      label: __("Body"),
      visible: visibleColumns.body_preview,
    },
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
      {!automationModuleActive && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {__(
            "Edit the four core customer emails below. Other rows are included so you see the full automation catalog; enable Email Automation (Yatra Pro) to unlock them.",
            "yatra",
          )}
        </p>
      )}

      {automationModuleActive && (
        <div className="flex justify-end">
          <Button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {__("Create Template")}
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
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
            count: templates.filter((t) => t.is_active).length,
          },
          {
            key: "inactive",
            label: __("Inactive"),
            count: templates.filter((t) => !t.is_active).length,
          },
        ]}
        showColumnsDropdown={showColumnsDropdown}
        setShowColumnsDropdown={setShowColumnsDropdown}
        columnOptions={columnOptions}
        onToggleColumn={toggleColumn}
        bulkMutationPending={bulkDeleteMutation.isPending}
        totalItems={filteredTemplates.length}
        bulkActionOptions={
          automationModuleActive
            ? [{ value: "delete", label: __("Delete") }]
            : []
        }
      />

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
            onCreateClick={automationModuleActive ? handleCreate : undefined}
            getItemId={(template: UnifiedEmailTemplate) => template.id}
            capability="manage_yatra"
            skeletonRows={5}
            selectedItemIds={selectedIds}
            onSelectItem={handleSelectOne}
            onSelectAll={handleSelectAll}
            isAllSelected={
              selectedIds.length > 0 &&
              selectedIds.length === paginatedTemplates.length &&
              paginatedTemplates.length > 0
            }
          />
        </CardContent>
      </Card>

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

      <EmailPreviewModal
        open={previewOpen && Boolean(previewPayload)}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewPayload(null);
        }}
        subject={previewPayload?.subject ?? ""}
        body={previewPayload?.body ?? ""}
      />

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

export default EmailTemplatesList;
