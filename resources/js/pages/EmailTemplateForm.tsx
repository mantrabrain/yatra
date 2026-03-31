import React, { useState, useEffect, useMemo } from "react";
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
import {
  Mail,
  ArrowLeft,
  Save,
  Eye,
  Send,
  Loader2,
  Code,
  Copy,
  Check,
  Info,
  X,
  Zap,
  ChevronDown,
} from "lucide-react";
import { Switch } from "../components/ui/switch";

interface PreviewData {
  subject: string;
  body: string;
}

const EmailTemplateForm: React.FC = () => {
  const { id, isCreateMode } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get("id");
    const action = params.get("action");
    return {
      id: templateId,
      isCreateMode: action === "create",
    };
  }, []);

  const goBack = () => {
    window.location.href = `admin.php?page=yatra&subpage=email-automation`;
  };
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    from_name: "",
    from_email: "",
    to_email: "",
    reply_to: "",
    subject: "",
    body: "",
    event_key: "",
    is_active: true,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  const { data: templateData, isLoading } = useQuery({
    queryKey: ["email-template", id],
    queryFn: async () => {
      const response = await apiClient.get(`/email-templates/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: variablesData } = useQuery({
    queryKey: ["email-variables"],
    queryFn: async () => {
      const response = await apiClient.get("/email-templates/variables");
      return response.data;
    },
  });

  // Get events from window.yatraAdmin (passed from PHP)
  const events = (window as any).yatraAdmin?.emailEvents || [];

  useEffect(() => {
    if (templateData) {
      setFormData({
        name: templateData.name || "",
        description: templateData.description || "",
        from_name: templateData.from_name || "",
        from_email: templateData.from_email || "",
        to_email: templateData.to_email || "",
        reply_to: templateData.reply_to || "",
        subject: templateData.subject || "",
        body: templateData.body || "",
        event_key: templateData.event_key || "",
        is_active: templateData.is_active ?? true,
      });
    }
  }, [templateData]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (isCreateMode) {
        const response = await apiClient.post("/email-templates", data);
        // Check if the response indicates failure
        if (response && response.success === false) {
          throw new Error(response.message || __("Failed to create template"));
        }
        return response;
      }
      return await apiClient.put(`/email-templates/${id}`, data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      if (isCreateMode) {
        showToast(__("Template created successfully"), "success");
        // Redirect to edit page after creation - response.data contains the template
        const newId = response?.data?.id;
        if (newId) {
          window.location.href = `admin.php?page=yatra&subpage=email-automation&tab=template&action=edit&id=${newId}`;
        } else {
          // Fallback to list page
          window.location.href =
            "admin.php?page=yatra&subpage=email-automation";
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ["email-template", id] });
        showToast(__("Template saved successfully"), "success");
      }
    },
    onError: (error: any) => {
      const message =
        error?.message ||
        (isCreateMode
          ? __("Failed to create template")
          : __("Failed to save template"));
      showToast(message, "error");
    },
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(
        `/email-templates/${id}/preview`,
        {},
      );
      return response.data;
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setShowPreview(true);
    },
  });

  const testMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiClient.post(`/email-templates/${id}/test`, { email });
    },
    onSuccess: () => {
      showToast(__("Test email sent successfully"), "success");
      setTestEmail("");
    },
    onError: () => {
      showToast(__("Failed to send test email"), "error");
    },
  });

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      showToast(__("Template name is required"), "error");
      return;
    }
    // Event is optional for custom templates
    if (!formData.subject.trim()) {
      showToast(__("Subject line is required"), "error");
      return;
    }

    saveMutation.mutate(formData);
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById(
      "email-body",
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.body;
      const newText =
        text.substring(0, start) + `{{${variable}}}` + text.substring(end);
      setFormData({ ...formData, body: newText });
    }
  };

  if (isLoading && !isCreateMode) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div>
              <div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Details Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="h-6 w-36 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-64 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </CardContent>
            </Card>

            {/* Test Email Card */}
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Variables Card */}
            <Card>
              <CardHeader>
                <div className="h-6 w-36 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                {[1, 2, 3].map((group) => (
                  <div key={group} className="space-y-2">
                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded"
                      ></div>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Template Info Card */}
            <Card>
              <CardHeader>
                <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => goBack()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {__("Back")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-500" />
              {isCreateMode
                ? __("Create Email Template")
                : __("Edit Email Template")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {isCreateMode
                ? __("Create a new custom email template")
                : templateData?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isCreateMode && (
            <Button
              variant="outline"
              onClick={() => previewMutation.mutate()}
              disabled={previewMutation.isPending}
            >
              {previewMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {__("Preview")}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isCreateMode ? __("Create Template") : __("Save Template")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{__("Template Details")}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${formData.is_active ? "text-green-600 dark:text-green-400" : "text-gray-500"}`}
                  >
                    {formData.is_active ? __("Active") : __("Inactive")}
                  </span>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {__("Template Name")}
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={__("Enter template name")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {__("Description")}
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={__(
                    "Brief description of when this email is sent",
                  )}
                />
              </div>

              {/* Event Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {__("Trigger Event")}
                </label>
                {templateData?.is_system ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        <Zap className="w-4 h-4" />
                        {formData.event_key || "-"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {__("System templates cannot change events")}
                      </span>
                    </div>
                    {formData.event_key && (
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                          {events.find((e: any) => e.key === formData.event_key)
                            ?.description || ""}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    {/* Dropdown Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setShowEventDropdown(!showEventDropdown)}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    >
                      {formData.event_key ? (
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {events.find(
                              (e: any) => e.key === formData.event_key,
                            )?.name || formData.event_key}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {__("No Event (Sequence Only)")}
                          </span>
                        </div>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${showEventDropdown ? "rotate-180" : ""}`}
                      />
                    </button>

                    {/* Dropdown List */}
                    {showEventDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
                            {__(
                              "Select an event to trigger this email, or leave empty for sequence use",
                            )}
                          </p>
                        </div>
                        <div className="py-1">
                          {/* None option - for templates used in sequences */}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, event_key: "" });
                              setShowEventDropdown(false);
                            }}
                            className={`w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 ${
                              !formData.event_key
                                ? "bg-indigo-50 dark:bg-indigo-900/20"
                                : ""
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <Mail
                                className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                  !formData.event_key
                                    ? "text-indigo-500"
                                    : "text-gray-400"
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-sm font-medium ${
                                      !formData.event_key
                                        ? "text-indigo-700 dark:text-indigo-400"
                                        : "text-gray-900 dark:text-white"
                                    }`}
                                  >
                                    {__("No Event (Sequence Only)")}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {__(
                                    "This template will only be used in email sequences",
                                  )}
                                </p>
                              </div>
                              {!formData.event_key && (
                                <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                          {events.map((event: any) => (
                            <button
                              key={event.key}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  event_key: event.key,
                                });
                                setShowEventDropdown(false);
                              }}
                              className={`w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                                formData.event_key === event.key
                                  ? "bg-indigo-50 dark:bg-indigo-900/20"
                                  : ""
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <Zap
                                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                    formData.event_key === event.key
                                      ? "text-indigo-500"
                                      : "text-gray-400"
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-sm font-medium ${
                                        formData.event_key === event.key
                                          ? "text-indigo-700 dark:text-indigo-400"
                                          : "text-gray-900 dark:text-white"
                                      }`}
                                    >
                                      {event.name}
                                    </span>
                                    <code className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                                      {event.key}
                                    </code>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                    {event.description}
                                  </p>
                                </div>
                                {formData.event_key === event.key && (
                                  <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Click outside to close */}
                    {showEventDropdown && (
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowEventDropdown(false)}
                      />
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {__(
                    "This email will be triggered when the selected event occurs",
                  )}
                </p>
              </div>

              {/* From/Reply-To Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {__("From Name")}
                  </label>
                  <Input
                    value={formData.from_name}
                    onChange={(e) =>
                      setFormData({ ...formData, from_name: e.target.value })
                    }
                    placeholder={__("e.g., Travel Agency Name")}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {__("Leave empty to use site default")}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {__("From Email")}
                  </label>
                  <Input
                    type="email"
                    value={formData.from_email}
                    onChange={(e) =>
                      setFormData({ ...formData, from_email: e.target.value })
                    }
                    placeholder={__("e.g., noreply@yoursite.com")}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {__("Leave empty to use site default")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {__("To Email")}
                  </label>
                  <Input
                    type="email"
                    value={formData.to_email}
                    onChange={(e) =>
                      setFormData({ ...formData, to_email: e.target.value })
                    }
                    placeholder={__("e.g., {{customer_email}}")}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {__(
                      "Recipient email. Use variables or leave empty for default",
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {__("Reply-To Email")}
                  </label>
                  <Input
                    type="email"
                    value={formData.reply_to}
                    onChange={(e) =>
                      setFormData({ ...formData, reply_to: e.target.value })
                    }
                    placeholder={__("e.g., support@yoursite.com")}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {__(
                      "Where replies will be sent. Leave empty to use From Email",
                    )}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {__("Subject Line")}
                </label>
                <Input
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder={__("Email subject with {{variables}}")}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {__("Use {{variable}} syntax to insert dynamic content")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {__("Email Body (HTML)")}
                </label>
                <textarea
                  id="email-body"
                  value={formData.body}
                  onChange={(e) =>
                    setFormData({ ...formData, body: e.target.value })
                  }
                  rows={20}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder={__("HTML email content...")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Test Email - Only show in edit mode */}
          {!isCreateMode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-500" />
                  {__("Send Test Email")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder={__("Enter email address")}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => testMutation.mutate(testEmail)}
                    disabled={!testEmail || testMutation.isPending}
                  >
                    {testMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {__(
                    "Send a test email with sample data to preview how it looks",
                  )}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Variables */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-purple-500" />
                {__("Available Variables")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {__("Click to copy, double-click to insert at cursor")}
              </p>

              {variablesData &&
                Object.entries(variablesData).map(
                  ([category, variables]: [string, any]) => (
                    <div key={category}>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        {category}
                      </h4>
                      <div className="space-y-1">
                        {variables.map((v: any) => (
                          <button
                            key={v.key}
                            type="button"
                            onClick={() => copyVariable(v.key)}
                            onDoubleClick={() => insertVariable(v.key)}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                          >
                            <div className="flex items-center justify-between">
                              <code className="text-xs text-blue-600 dark:text-blue-400">
                                {`{{${v.key}}}`}
                              </code>
                              {copiedVar === v.key ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {v.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ),
                )}
            </CardContent>
          </Card>

          {/* Template Info - Different content for create vs edit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-gray-500" />
                {isCreateMode ? __("New Template") : __("Template Info")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    {__("Event")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                    <Zap className="w-3 h-3" />
                    {formData.event_key || "-"}
                  </span>
                </div>
                {formData.event_key && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    {events.find((e: any) => e.key === formData.event_key)
                      ?.description || ""}
                  </p>
                )}
              </div>
              {isCreateMode ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      {__("Type")}
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {__("Custom")}
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {__(
                        "Custom templates can be edited and deleted. Select an event to trigger this email automatically.",
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      {__("Key")}
                    </span>
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                      {templateData?.template_key}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      {__("Category")}
                    </span>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {templateData?.category}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      {__("Recipient")}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        templateData?.recipient_type === "admin"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {templateData?.recipient_type === "admin"
                        ? __("Admin")
                        : __("Customer")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      {__("Type")}
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {templateData?.is_system ? __("System") : __("Custom")}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[95vw] max-w-6xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {__("Email Preview")}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {__("Preview with sample data")}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="rounded-full w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Subject Line */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {__("Subject")}
                </span>
              </div>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {previewData.subject}
              </p>
            </div>

            {/* Email Body */}
            <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950">
              <div className="p-6 h-full">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full">
                  <iframe
                    srcDoc={previewData.body}
                    className="w-full h-full min-h-[500px] border-0"
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                {__("Close")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateForm;
