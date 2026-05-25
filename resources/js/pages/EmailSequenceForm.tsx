import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { __ } from "../lib/i18n";
import {
  createEmailSequence,
  fetchEmailSequence,
  fetchEmailTemplates,
  updateEmailSequence,
} from "../api/email-automation-api";
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
import { Switch } from "../components/ui/switch";
import {
  GitBranch,
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  Zap,
  GripVertical,
  Info,
  ChevronDown,
  Mail,
  Check,
} from "lucide-react";

interface EmailTemplate {
  id: number;
  name: string;
  template_key: string;
  category: string;
  description?: string;
  event_key?: string;
  recipient_type?: string;
}

interface SequenceStep {
  id?: number;
  step_order: number;
  delay_value: number;
  delay_unit: "minutes" | "hours" | "days" | "weeks";
  template_id: number | null;
  template_name?: string;
  custom_subject: string;
  custom_body: string;
  conditions: any[];
  is_active: boolean;
}

interface SequenceData {
  id?: number;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: any;
  status: "active" | "paused" | "draft";
  applicable_to: string;
  trip_ids: number[];
  steps?: SequenceStep[];
}

const delayUnits = [
  { value: "minutes", label: __("Minutes") },
  { value: "hours", label: __("Hours") },
  { value: "days", label: __("Days") },
  { value: "weeks", label: __("Weeks") },
];

const EmailSequenceForm: React.FC = () => {
  const id = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }, []);

  const isEditing = !!id;

  const goBack = () => {
    window.location.href = `admin.php?page=yatra&subpage=email-automation&tab=sequences`;
  };

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<SequenceData>({
    name: "",
    description: "",
    trigger_type: "booking.created",
    trigger_config: {},
    status: "draft",
    applicable_to: "all",
    trip_ids: [],
  });

  const [steps, setSteps] = useState<SequenceStep[]>([
    {
      step_order: 0,
      delay_value: 0,
      delay_unit: "minutes",
      template_id: null,
      custom_subject: "",
      custom_body: "",
      conditions: [],
      is_active: true,
    },
  ]);

  // State for template dropdown per step
  const [openTemplateDropdown, setOpenTemplateDropdown] = useState<
    number | null
  >(null);

  // Get events from window.yatraAdmin (passed from PHP)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const events = (window as any).yatraAdmin?.emailEvents || [];

  // Fetch sequence data if editing
  const { data: sequenceData, isLoading: isLoadingSequence } = useQuery({
    queryKey: ["email-sequence", id],
    queryFn: () => fetchEmailSequence(id as string),
    enabled: isEditing,
  });

  // Fetch templates for step selection
  const { data: templatesData } = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => fetchEmailTemplates(),
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const templates: EmailTemplate[] = Array.isArray(templatesData)
    ? (templatesData as EmailTemplate[])
    : [];

  // Get all trigger events from Schema (passed via window.yatraAdmin.emailEvents)
  const allTriggerEvents = useMemo(() => {
    return events.map((e: any) => ({
      key: e.key,
      name: e.name,
      description: e.description,
      category: e.category,
    }));
  }, [events]);

  // State for trigger dropdown
  const [openTriggerDropdown, setOpenTriggerDropdown] = useState(false);

  // Sequences send to the customer; exclude admin-only templates. Event-bound templates may still be reused as step content.
  const sequenceTemplates = useMemo(() => {
    return templates.filter((t) => t.recipient_type !== "admin");
  }, [templates]);

  // Populate form when editing
  useEffect(() => {
    if (!sequenceData || typeof sequenceData !== "object") {
      return;
    }
    const loaded = sequenceData as SequenceData;
    setFormData({
      name: loaded.name || "",
      description: loaded.description || "",
      trigger_type: loaded.trigger_type || "booking.created",
      trigger_config: loaded.trigger_config || {},
      status: loaded.status || "draft",
      applicable_to: loaded.applicable_to || "all",
      trip_ids: loaded.trip_ids || [],
    });

    if (loaded.steps && loaded.steps.length > 0) {
      setSteps(loaded.steps);
    }
  }, [sequenceData]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await createEmailSequence(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences"] });
      showToast(__("Sequence created successfully"), "success");
      goBack();
    },
    onError: () => {
      showToast(__("Failed to create sequence"), "error");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await updateEmailSequence(id as string, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences"] });
      queryClient.invalidateQueries({ queryKey: ["email-sequence", id] });
      showToast(__("Sequence updated successfully"), "success");
    },
    onError: () => {
      showToast(__("Failed to update sequence"), "error");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      steps: steps.map((step, index) => ({
        ...step,
        step_order: index,
      })),
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const addStep = () => {
    setSteps([
      ...steps,
      {
        step_order: steps.length,
        delay_value: 1,
        delay_unit: "days",
        template_id: null,
        custom_subject: "",
        custom_body: "",
        conditions: [],
        is_active: true,
      },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps];
    (newSteps[index] as any)[field] = value;
    setSteps(newSteps);
  };

  const selectedTrigger = allTriggerEvents.find(
    (t: any) => t.key === formData.trigger_type,
  );
  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoadingSequence) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div>
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </CardContent>
            </Card>

            {/* Trigger Card */}
            <Card>
              <CardHeader>
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"
                    ></div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Steps Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-36 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
          <Button variant="ghost" onClick={goBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {__("Back")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-blue-500" />
              {isEditing ? __("Edit Sequence") : __("Create Sequence")}
            </h1>
            {isEditing && formData.name && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {formData.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isPending || !formData.name}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? __("Save Changes") : __("Create Sequence")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{__("Sequence Details")}</span>
                <div className="flex items-center gap-3">
                  <Select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as any,
                      })
                    }
                    className="w-32"
                  >
                    <option value="draft">{__("Draft")}</option>
                    <option value="active">{__("Active")}</option>
                    <option value="paused">{__("Paused")}</option>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {__("Sequence Name")} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={__("e.g., Post-Booking Welcome Series")}
                  required
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
                    "Brief description of what this sequence does",
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Trigger */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                {__("Trigger")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {__("When should this sequence start?")}
                </label>

                {/* Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() => setOpenTriggerDropdown(!openTriggerDropdown)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  {selectedTrigger ? (
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedTrigger.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {__("Select a trigger event...")}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${openTriggerDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown List - Same style as Email Template form */}
                {openTriggerDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
                        {__("Select an event to trigger this sequence")}
                      </p>
                    </div>
                    <div className="py-1">
                      {allTriggerEvents.map((trigger: any) => {
                        const isSelected =
                          formData.trigger_type === trigger.key;
                        return (
                          <button
                            key={trigger.key}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                trigger_type: trigger.key,
                              });
                              setOpenTriggerDropdown(false);
                            }}
                            className={`w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                              isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <Zap
                                className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                  isSelected ? "text-blue-500" : "text-gray-400"
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-sm font-medium ${
                                      isSelected
                                        ? "text-blue-700 dark:text-blue-400"
                                        : "text-gray-900 dark:text-white"
                                    }`}
                                  >
                                    {trigger.name}
                                  </span>
                                  <code className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                                    {trigger.key}
                                  </code>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-blue-500" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                  {trigger.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Click outside to close */}
                {openTriggerDropdown && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpenTriggerDropdown(false)}
                  />
                )}
              </div>

              {/* Days input for schedule events */}
              {(formData.trigger_type === "schedule.days_before_trip" ||
                formData.trigger_type === "schedule.days_after_trip") && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {__("Number of Days")}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.trigger_config.days || 7}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trigger_config: {
                          ...formData.trigger_config,
                          days: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-32"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-purple-500" />
                  {__("Sequence Steps")}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStep}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {__("Add Step")}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    {/* Step Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {__("Step")} {index + 1}
                        </span>
                        {index === 0 && (
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {__("First Email")}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={step.is_active}
                          onCheckedChange={(checked) =>
                            updateStep(index, "is_active", checked)
                          }
                        />
                        {steps.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="p-4 space-y-4">
                      {/* Delay */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {index === 0
                            ? __("Send after trigger")
                            : __("Wait before sending")}
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={step.delay_value}
                            onChange={(e) =>
                              updateStep(
                                index,
                                "delay_value",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-24"
                          />
                          <Select
                            value={step.delay_unit}
                            onChange={(e) =>
                              updateStep(index, "delay_unit", e.target.value)
                            }
                            className="w-32"
                          >
                            {delayUnits.map((unit) => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </Select>
                          {index === 0 && step.delay_value === 0 && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({__("Immediately")})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Template Selection - Card Style Dropdown */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {__("Email Template")}
                        </label>

                        {/* Dropdown Trigger */}
                        <button
                          type="button"
                          onClick={() =>
                            setOpenTemplateDropdown(
                              openTemplateDropdown === index ? null : index,
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-left hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                          {step.template_id ? (
                            <div className="flex items-center gap-2 min-w-0">
                              <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span className="text-gray-900 dark:text-white truncate">
                                {sequenceTemplates.find(
                                  (t) => t.id === step.template_id,
                                )?.name ||
                                  templates.find(
                                    (t) => t.id === step.template_id,
                                  )?.name ||
                                  __("Unknown Template")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">
                              {__("Select a template...")}
                            </span>
                          )}
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${openTemplateDropdown === index ? "rotate-180" : ""}`}
                          />
                        </button>

                        {/* Dropdown List */}
                        {openTemplateDropdown === index && (
                          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                            {sequenceTemplates.length === 0 ? (
                              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                <p className="font-medium">
                                  {__("No templates available")}
                                </p>
                                <p className="text-xs mt-1">
                                  {__(
                                    "Add customer email templates under Email → Templates first.",
                                  )}
                                </p>
                              </div>
                            ) : (
                              sequenceTemplates.map((template) => {
                                const isSelected =
                                  step.template_id === template.id;

                                return (
                                  <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => {
                                      updateStep(
                                        index,
                                        "template_id",
                                        template.id,
                                      );
                                      setOpenTemplateDropdown(null);
                                    }}
                                    className={`w-full text-left p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-gray-900 dark:text-white">
                                            {template.name}
                                          </span>
                                          {isSelected && (
                                            <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                          )}
                                        </div>
                                        {template.description && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                            {template.description}
                                          </p>
                                        )}
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className="text-xs flex-shrink-0"
                                      >
                                        {template.category}
                                      </Badge>
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}

                        {/* Click outside to close */}
                        {openTemplateDropdown === index && (
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenTemplateDropdown(null)}
                          />
                        )}

                        {!step.template_id && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            {__("Please select a template for this step")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {steps.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{__("No steps added yet")}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStep}
                    className="mt-3"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {__("Add First Step")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-gray-500" />
                {__("How Sequences Work")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>
                {__(
                  "Email sequences are automated workflows that send emails based on triggers and timing.",
                )}
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>{__("Choose a trigger event (e.g., booking created)")}</li>
                <li>{__("Add steps with delays and email templates")}</li>
                <li>{__("Set the sequence to Active")}</li>
                <li>{__("Emails will be sent automatically!")}</li>
              </ol>
            </CardContent>
          </Card>

          {/* Status Info */}
          <Card>
            <CardHeader>
              <CardTitle>{__("Status")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {__("Current Status")}
                </span>
                <Badge
                  className={
                    formData.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : formData.status === "paused"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }
                >
                  {formData.status === "active"
                    ? __("Active")
                    : formData.status === "paused"
                      ? __("Paused")
                      : __("Draft")}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {__("Steps")}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {steps.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {__("Trigger")}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedTrigger?.label}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailSequenceForm;
