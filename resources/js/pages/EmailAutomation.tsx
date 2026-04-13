import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { __ } from "../lib/i18n";
import {
  deleteEmailSequence,
  fetchEmailLogs,
  fetchEmailSequences,
  updateEmailSequenceStatus,
} from "../api/email-automation-api";
import { useToast } from "../components/ui/toast";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { PageHeader } from "../components/common/PageHeader";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import PremiumUpgradeCard from "./premium-pages/EmailAutomation";
import {
  Mail,
  Edit,
  Clock,
  FileText,
  Bell,
  Plus,
  Trash2,
  Play,
  Pause,
  Zap,
  GitBranch,
  Loader2,
  Save,
  Settings2,
  Send,
} from "lucide-react";
import {
  isProPluginActive,
  isEmailAutomationModuleEnabled,
} from "../lib/plugin-utils";
import { useEmailSettingsManager } from "../hooks/useEmailSettingsManager";
import { EmailDeliverySection } from "../components/settings/EmailDeliverySection";
import { EmailTemplatesList } from "../components/email/EmailTemplatesList";
import { Pagination } from "../components/shared";

interface EmailLog {
  id: number;
  template_key: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  status: "sent" | "failed" | "opened" | "clicked";
  sent_at: string;
}

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

const EmailSequencesList: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: sequencesData, isLoading } = useQuery({
    queryKey: ["email-sequences"],
    queryFn: () => fetchEmailSequences(),
    enabled: isEmailAutomationModuleEnabled(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await deleteEmailSequence(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences"] });
      showToast(__("Sequence deleted"), "success");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await updateEmailSequenceStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences"] });
      showToast(__("Sequence status updated"), "success");
    },
  });

  const sequences = sequencesData || [];

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

  const emailEvents = (window as any).yatraAdmin?.emailEvents || [];

  const getTriggerLabel = (triggerType: string) => {
    const ev = emailEvents.find((e: { key?: string }) => e.key === triggerType);
    return ev?.name || triggerType;
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
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data: logsData, isLoading } = useQuery({
    queryKey: ["email-logs", page, perPage],
    queryFn: () => fetchEmailLogs({ page, per_page: perPage }),
    enabled: isEmailAutomationModuleEnabled(),
  });

  const logs = logsData?.items ?? [];
  const totalItems = logsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

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
                      {log.sent_at
                        ? new Date(log.sent_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {logs.length > 0 && totalPages > 1 && (
          <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={perPage}
              onPageChange={setPage}
              itemName={__("entries", "yatra")}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

type EmailHubTab = "delivery" | "templates" | "sequences" | "logs";

function getInitialEmailHubTab(): EmailHubTab {
  if (typeof window === "undefined") return "delivery";
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab === "sequences" || tab === "sequence") return "sequences";
  if (tab === "template" || tab === "templates") return "templates";
  if (tab === "logs") return "logs";
  if (tab === "delivery" || tab === "core") return "delivery";
  return "delivery";
}

const EmailAutomationModulePrompt: React.FC = () => (
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <Settings2 className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100">
            {__("Enable the Email Automation module", "yatra")}
          </h3>
          <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-200/90">
            {__(
              "Yatra Pro is active. Turn on Email Automation under Modules to use custom templates, sequences, and send logs.",
              "yatra",
            )}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="shrink-0 border-amber-300 bg-white hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950 dark:hover:bg-amber-900"
        onClick={() => {
          window.location.href = "admin.php?page=yatra&subpage=modules";
        }}
      >
        {__("Open Modules", "yatra")}
      </Button>
    </div>
  </div>
);

const EmailAutomation: React.FC = () => {
  const emailMgr = useEmailSettingsManager();
  const [activeTab, setActiveTab] = useState<EmailHubTab>(() => {
    const t = getInitialEmailHubTab();
    if (!isProPluginActive() && (t === "sequences" || t === "logs")) {
      return "delivery";
    }
    return t;
  });

  const showProAutomationExtras = isProPluginActive();
  const automationReady = isEmailAutomationModuleEnabled();

  const tabs = [
    {
      key: "delivery" as const,
      label: __("Delivery", "yatra"),
      icon: Send,
    },
    {
      key: "templates" as const,
      label: __("Templates", "yatra"),
      icon: FileText,
    },
    ...(showProAutomationExtras
      ? [
          {
            key: "sequences" as const,
            label: __("Sequences", "yatra"),
            icon: GitBranch,
          },
          {
            key: "logs" as const,
            label: __("Email logs", "yatra"),
            icon: Mail,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        description={__(
          "Delivery (addresses & SMTP), core templates for everyone, and optional Pro sequences and logs.",
          "yatra",
        )}
      />

      <Card>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex flex-wrap gap-1 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
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
          {activeTab === "delivery" && (
            <>
              {!emailMgr.ready ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
                </div>
              ) : (
                <EmailDeliverySection
                  values={emailMgr.values}
                  onFieldChange={emailMgr.handleFieldChange}
                />
              )}
            </>
          )}

          {activeTab === "templates" && (
            <>
              {automationReady && (
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                  {__(
                    "Customer booking, payment, cancellation, and trip-reminder emails use the matching template when its body is filled; otherwise the free plugin defaults or settings HTML apply. Admin: New Booking sends when that template has a body (plain-text admin notices from checkout and notifications are skipped to avoid duplicates). Other booking.created templates send in addition to the customer email. Booking Confirmed uses the “Booking Confirmed” row when a booking moves to confirmed; Trip Completed uses its template instead of the generic completed email when the body is filled.",
                    "yatra",
                  )}
                </p>
              )}
              {!emailMgr.ready && !automationReady ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
                </div>
              ) : (
                <EmailTemplatesList
                  automationModuleActive={automationReady}
                  settingsBridge={
                    automationReady
                      ? undefined
                      : {
                          values: emailMgr.values,
                          onFieldChange: emailMgr.handleFieldChange,
                        }
                  }
                />
              )}
            </>
          )}

          {activeTab === "sequences" &&
            (automationReady ? (
              <EmailSequencesList />
            ) : isProPluginActive() ? (
              <EmailAutomationModulePrompt />
            ) : (
              <PremiumUpgradeCard />
            ))}

          {activeTab === "logs" &&
            (automationReady ? (
              <EmailLogsList />
            ) : isProPluginActive() ? (
              <EmailAutomationModulePrompt />
            ) : (
              <PremiumUpgradeCard />
            ))}
        </CardContent>

        {(activeTab === "delivery" || activeTab === "templates") &&
          emailMgr.ready && (
            <CardFooter className="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-700/50">
              <Button
                type="button"
                onClick={emailMgr.save}
                disabled={!emailMgr.canSave}
                className="flex items-center gap-2"
              >
                {emailMgr.isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {__("Saving…", "yatra")}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {__("Save email settings", "yatra")}
                  </>
                )}
              </Button>
            </CardFooter>
          )}
      </Card>
    </div>
  );
};

export default EmailAutomation;
