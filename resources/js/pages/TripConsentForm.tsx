/**
 * Trip Consent Form
 *
 * Form component for creating and editing consent forms.
 * This is part of the premium module - functionality provided by Yatra Pro.
 *
 * @package Yatra
 * @since 3.0.0
 */

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { PageHeader } from "../components/common/PageHeader";
import { ApplicableTripSelector } from "../components/shared/ApplicableTripSelector";
import { useToast } from "../components/ui/toast";
import { apiClient } from "../lib/api-client";
import { __ } from "../lib/i18n";
import {
  ArrowLeft,
  Save,
  FileSignature,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Type,
  CheckSquare,
  AlignLeft,
  List,
  Calendar,
  Mail,
  Phone,
  Hash,
  Sparkles,
} from "lucide-react";

// Types
interface FormField {
  id: string;
  type:
    | "text"
    | "textarea"
    | "checkbox"
    | "select"
    | "date"
    | "email"
    | "phone"
    | "number";
  label: string;
  placeholder?: string;
  required: boolean;
  enabled: boolean;
  order: number;
  width: "full" | "half";
  options?: { value: string; label: string }[];
}

interface ContentBlock {
  id: string;
  type: "heading" | "paragraph" | "terms";
  title: string;
  content: string;
  order: number;
}

interface ConsentFormData {
  id?: number;
  name: string;
  description: string;
  status: "publish" | "draft" | "archived" | "trash";
  require_signature: boolean;
  require_initials: boolean;
  applicable_to: "all" | "specific_trips";
  send_to: "all_travelers" | "lead_traveler" | "primary_contact";
  trip_ids: number[];
  send_before_days: number;
  reminder_days: string;
  expiry_hours: number | null;
  fields: FormField[];
  content_blocks: ContentBlock[];
}

const defaultFormData: ConsentFormData = {
  name: "",
  description: "",
  status: "publish",
  require_signature: true,
  require_initials: false,
  applicable_to: "all",
  send_to: "all_travelers",
  trip_ids: [],
  send_before_days: 7,
  reminder_days: "3,1",
  expiry_hours: null,
  fields: [],
  content_blocks: [],
};

const fieldTypeIcons: Record<string, React.ElementType> = {
  text: Type,
  textarea: AlignLeft,
  checkbox: CheckSquare,
  select: List,
  date: Calendar,
  email: Mail,
  phone: Phone,
  number: Hash,
};

// Check if module is available
const isModuleAvailable = (): boolean => {
  const yatraAdmin = (window as any)?.yatraAdmin;
  return Boolean(yatraAdmin?.isPro && yatraAdmin?.tripConsentEnabled);
};

// Generate unique ID
const generateId = () =>
  `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Interactive Signature Pad Preview Component
interface SignaturePadPreviewProps {
  id: string;
  placeholder: string;
  onContentChange?: (hasContent: boolean) => void;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

const SignaturePadPreview: React.FC<SignaturePadPreviewProps> = ({
  id,
  placeholder,
  onContentChange,
  canvasRef: externalCanvasRef,
}) => {
  const internalCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasContent, setHasContent] = React.useState(false);

  const updateContent = (value: boolean) => {
    setHasContent(value);
    onContentChange?.(value);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    updateContent(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateContent(false);
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        id={id}
        className="w-full h-32 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      {!hasContent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-gray-400 text-sm">{placeholder}</p>
        </div>
      )}
      {hasContent && (
        <button
          type="button"
          onClick={clearCanvas}
          className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded"
        >
          {__("Clear")}
        </button>
      )}
    </div>
  );
};

const TripConsentForm: React.FC = () => {
  const [formData, setFormData] = useState<ConsentFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<
    "general" | "fields" | "content" | "settings" | "preview"
  >("general");
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState<string>("");
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Get ID from URL for edit mode
  const urlParams = new URLSearchParams(window.location.search);
  const formId = urlParams.get("id");
  const isEditMode = !!formId;

  // Fetch existing form for edit mode
  const { data: existingFormResponse, isLoading: isLoadingForm } = useQuery({
    queryKey: ["consent-form", formId],
    queryFn: async () => {
      const response = await apiClient.get(`/consent-forms/${formId}`);
      return response;
    },
    enabled: isEditMode && isModuleAvailable(),
  });

  // Update form data when existing form is loaded
  useEffect(() => {
    // API returns { success: true, data: form }
    const existingForm = existingFormResponse?.data || existingFormResponse;
    if (existingForm && existingForm.id) {
      // Sort fields by order to preserve the saved order
      const fields = existingForm.form_config?.fields || [];
      const sortedFields = [...fields].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      );

      // Sort content blocks by order as well
      const contentBlocks = existingForm.form_config?.content_blocks || [];
      const sortedContentBlocks = [...contentBlocks].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      );

      setFormData({
        ...defaultFormData,
        id: existingForm.id,
        name: existingForm.name || "",
        description: existingForm.description || "",
        status: existingForm.status || "publish",
        require_signature: existingForm.require_signature ?? true,
        require_initials: existingForm.require_initials ?? false,
        applicable_to: existingForm.applicable_to || "all",
        send_to: existingForm.send_to || "all_travelers",
        trip_ids: existingForm.trip_ids || [],
        send_before_days: existingForm.send_before_days || 7,
        reminder_days: existingForm.reminder_days || "3,1",
        expiry_hours: existingForm.expiry_hours || null,
        fields: sortedFields,
        content_blocks: sortedContentBlocks,
      });
    }
  }, [existingFormResponse]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ConsentFormData) => {
      // Ensure fields have correct order values and all required properties
      const fieldsWithOrder = data.fields.map((field, index) => ({
        id: field.id,
        type: field.type,
        label: field.label || "",
        placeholder: field.placeholder || "",
        required: field.required ?? false,
        enabled: field.enabled ?? true,
        order: index,
        width: field.width || "full",
        options: field.options || undefined,
      }));

      // Ensure content blocks have correct order values and all required fields
      const contentBlocksWithOrder = data.content_blocks.map(
        (block, index) => ({
          id: block.id,
          type: block.type,
          title: block.title || "",
          content: block.content || "",
          order: index,
        }),
      );

      const payload = {
        name: data.name,
        description: data.description,
        status: data.status,
        require_signature: data.require_signature,
        require_initials: data.require_initials,
        applicable_to: data.applicable_to,
        send_to: data.send_to,
        trip_ids: data.trip_ids,
        send_before_days: data.send_before_days,
        reminder_days: data.reminder_days,
        expiry_hours: data.expiry_hours,
        form_config: {
          fields: fieldsWithOrder,
          content_blocks: contentBlocksWithOrder,
        },
      };

      if (isEditMode) {
        return await apiClient.put(`/consent-forms/${formId}`, payload);
      }
      return await apiClient.post("/consent-forms", payload);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["consent-forms"] });
      showToast(
        isEditMode
          ? __("Consent form updated successfully")
          : __("Consent form created successfully"),
        "success",
      );

      if (isEditMode) {
        return;
      }

      const newId = response?.data?.id ?? response?.id ?? response?.form?.id;
      if (!newId) {
        navigateBack();
        return;
      }

      const params = new URLSearchParams(window.location.search);
      params.set("action", "edit");
      params.set("id", String(newId));
      params.set("subpage", "trips");
      params.set("tab", "trip-consent");
      window.history.pushState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`,
      );
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    onError: (error: any) => {
      showToast(error?.message || __("Failed to save consent form"), "error");
    },
  });

  // Test email mutation
  const sendTestEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const payload = {
        email,
        form_data: {
          ...formData,
          fields: formData.fields.map((field, index) => ({
            ...field,
            order: index,
          })),
          content_blocks: formData.content_blocks.map((block, index) => ({
            ...block,
            order: index,
          })),
        },
      };
      return await apiClient.post("/consent-forms/send-test-email", payload);
    },
    onSuccess: () => {
      showToast(__("Test email sent successfully"), "success");
      setTestEmail("");
    },
    onError: (error: any) => {
      showToast(error?.message || __("Failed to send test email"), "error");
    },
  });

  const handleSendTestEmail = () => {
    if (!testEmail) {
      showToast(__("Please enter an email address"), "warning");
      return;
    }
    sendTestEmailMutation.mutate(testEmail);
  };

  const navigateBack = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("action");
    params.delete("id");
    params.set("subpage", "trips");
    params.set("tab", "trip-consent");
    window.history.pushState({}, "", `${window.location.pathname}?${params}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = __("Form name is required");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    saveMutation.mutate(formData);
  };

  const addField = (type: FormField["type"]) => {
    const newField: FormField = {
      id: generateId(),
      type,
      label: "",
      placeholder: "",
      required: false,
      enabled: true,
      order: formData.fields.length,
      width: "full",
      options: type === "select" ? [{ value: "", label: "" }] : undefined,
    };
    setFormData({ ...formData, fields: [...formData.fields, newField] });
    setExpandedField(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormData({
      ...formData,
      fields: formData.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f,
      ),
    });
  };

  const removeField = (fieldId: string) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((f) => f.id !== fieldId),
    });
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const newFields = [...formData.fields];
    const [movedField] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, movedField);
    // Update order values
    const reorderedFields = newFields.map((field, index) => ({
      ...field,
      order: index,
    }));
    setFormData({ ...formData, fields: reorderedFields });
  };

  // Drag and drop state
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(
    null,
  );
  const [dragOverFieldIndex, setDragOverFieldIndex] = useState<number | null>(
    null,
  );

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedFieldIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedFieldIndex !== null && draggedFieldIndex !== index) {
      setDragOverFieldIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverFieldIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedFieldIndex !== null && draggedFieldIndex !== toIndex) {
      moveField(draggedFieldIndex, toIndex);
    }
    setDraggedFieldIndex(null);
    setDragOverFieldIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedFieldIndex(null);
    setDragOverFieldIndex(null);
  };

  const addContentBlock = (type: ContentBlock["type"]) => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      title: "",
      content: "",
      order: formData.content_blocks.length,
    };
    setFormData({
      ...formData,
      content_blocks: [...formData.content_blocks, newBlock],
    });
  };

  const updateContentBlock = (
    blockId: string,
    updates: Partial<ContentBlock>,
  ) => {
    setFormData({
      ...formData,
      content_blocks: formData.content_blocks.map((b) =>
        b.id === blockId ? { ...b, ...updates } : b,
      ),
    });
  };

  const removeContentBlock = (blockId: string) => {
    setFormData({
      ...formData,
      content_blocks: formData.content_blocks.filter((b) => b.id !== blockId),
    });
  };

  // Generate a simple pre-populated consent form
  const generateSimpleForm = () => {
    const simpleFields: FormField[] = [
      {
        id: generateId(),
        type: "text",
        label: __("Full Name"),
        placeholder: __("Enter your full legal name"),
        required: true,
        enabled: true,
        order: 0,
        width: "half",
      },
      {
        id: generateId(),
        type: "email",
        label: __("Email Address"),
        placeholder: __("Enter your email address"),
        required: true,
        enabled: true,
        order: 1,
        width: "half",
      },
      {
        id: generateId(),
        type: "phone",
        label: __("Phone Number"),
        placeholder: __("Enter your phone number"),
        required: true,
        enabled: true,
        order: 2,
        width: "half",
      },
      {
        id: generateId(),
        type: "date",
        label: __("Date of Birth"),
        placeholder: "",
        required: true,
        enabled: true,
        order: 3,
        width: "half",
      },
      {
        id: generateId(),
        type: "text",
        label: __("Emergency Contact Name"),
        placeholder: __("Name of emergency contact"),
        required: true,
        enabled: true,
        order: 4,
        width: "half",
      },
      {
        id: generateId(),
        type: "phone",
        label: __("Emergency Contact Phone"),
        placeholder: __("Emergency contact phone number"),
        required: true,
        enabled: true,
        order: 5,
        width: "half",
      },
      {
        id: generateId(),
        type: "textarea",
        label: __("Medical Conditions or Allergies"),
        placeholder: __(
          "Please list any medical conditions, allergies, or dietary restrictions we should be aware of",
        ),
        required: false,
        enabled: true,
        order: 6,
        width: "full",
      },
      {
        id: generateId(),
        type: "checkbox",
        label: __(
          "I confirm that I am physically fit to participate in this trip",
        ),
        placeholder: "",
        required: true,
        enabled: true,
        order: 7,
        width: "full",
      },
    ];

    const simpleContentBlocks: ContentBlock[] = [
      {
        id: generateId(),
        type: "heading",
        title: __("Trip Participation Agreement"),
        content: "",
        order: 0,
      },
      {
        id: generateId(),
        type: "paragraph",
        title: __("Introduction"),
        content: __(
          "By signing this consent form, you acknowledge that you have read, understood, and agree to the terms and conditions outlined below for your participation in the trip.",
        ),
        order: 1,
      },
      {
        id: generateId(),
        type: "terms",
        title: __("Assumption of Risk"),
        content: __(
          "I understand that participation in this trip involves inherent risks, including but not limited to physical injury, illness, property damage, and other hazards. I voluntarily assume all risks associated with my participation and agree to hold harmless the trip organizers, guides, and affiliated parties from any liability arising from my participation.",
        ),
        order: 2,
      },
      {
        id: generateId(),
        type: "terms",
        title: __("Medical Authorization"),
        content: __(
          "In the event of a medical emergency, I authorize the trip organizers to seek and consent to medical treatment on my behalf. I understand that I am responsible for any medical expenses incurred during the trip.",
        ),
        order: 3,
      },
      {
        id: generateId(),
        type: "terms",
        title: __("Photo/Video Release"),
        content: __(
          "I grant permission to the trip organizers to use photographs and videos taken during the trip for promotional and marketing purposes without compensation.",
        ),
        order: 4,
      },
      {
        id: generateId(),
        type: "paragraph",
        title: __("Agreement"),
        content: __(
          "By signing below, I confirm that I have read and understood this consent form, that I am at least 18 years of age (or have parental/guardian consent), and that I agree to abide by all rules and instructions provided by the trip organizers.",
        ),
        order: 5,
      },
    ];

    setFormData({
      ...formData,
      name: formData.name || __("Trip Liability Waiver"),
      description:
        formData.description ||
        __("Standard liability waiver and consent form for trip participants"),
      require_signature: true,
      require_initials: true,
      fields: simpleFields,
      content_blocks: simpleContentBlocks,
    });

    showToast(
      __("Simple consent form generated! Review and customize as needed."),
      "success",
    );
  };

  // Premium gate
  if (!isModuleAvailable()) {
    return (
      <div className="p-8 text-center">
        <FileSignature className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {__("Trip Consent is a Premium Feature")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {__("Upgrade to Yatra Pro to create and manage consent forms.")}
        </p>
        <Button
          onClick={() =>
            window.open(
              "https://wpyatra.com/pricing?module=trip-consent",
              "_blank",
            )
          }
        >
          {__("Upgrade to Pro")}
        </Button>
      </div>
    );
  }

  if (isLoadingForm) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            />
          ))}
        </div>

        {/* Content Skeleton - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div>
                  <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? __("Edit Consent Form") : __("Create Consent Form")}
        description={
          isEditMode
            ? __("Update your consent form settings and fields.")
            : __("Create a new consent form for your trips.")
        }
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={navigateBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {__("Back")}
            </Button>
            {!isEditMode && formData.fields.length === 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={generateSimpleForm}
                className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900/20"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {__("Generate Simple Form")}
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEditMode ? __("Update Form") : __("Create Form")}
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit}>
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex gap-6">
            {(
              ["general", "fields", "content", "settings", "preview"] as const
            ).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab === "general" && __("General")}
                {tab === "fields" && __("Form Fields")}
                {tab === "content" && __("Content Blocks")}
                {tab === "settings" && __("Settings")}
                {tab === "preview" && __("Preview")}
              </button>
            ))}
          </nav>
        </div>

        {/* General Tab */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{__("Form Details")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {__("Form Name")} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={__("e.g., Liability Waiver")}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {__("Description")}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder={__(
                        "Brief description of this consent form...",
                      )}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{__("Status")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as
                          | "publish"
                          | "draft"
                          | "archived"
                          | "trash",
                      })
                    }
                  >
                    <option value="publish">{__("Published")}</option>
                    <option value="draft">{__("Draft")}</option>
                    <option value="archived">{__("Archived")}</option>
                    <option value="trash">{__("Trash")}</option>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{__("Signature Requirements")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.require_signature}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          require_signature: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {__("Require signature")}
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.require_initials}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          require_initials: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {__("Require initials")}
                    </span>
                  </label>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Applicable To", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ApplicableTripSelector
                    value={formData.applicable_to}
                    onValueChange={(val) =>
                      setFormData({ ...formData, applicable_to: val })
                    }
                    selectedTripIds={formData.trip_ids}
                    onTripIdsChange={(ids) =>
                      setFormData({ ...formData, trip_ids: ids })
                    }
                    description={__(
                      "Choose whether this consent form applies to all trips or specific ones.",
                    )}
                    helperText={__(
                      "Trips shown with ID for quick identification.",
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Fields Tab */}
        {activeTab === "fields" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{__("Form Fields")}</span>
                  <div className="flex gap-2">
                    {Object.entries(fieldTypeIcons).map(([type, Icon]) => (
                      <Button
                        key={type}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addField(type as FormField["type"])}
                        title={type}
                      >
                        <Icon className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formData.fields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Type className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>
                      {__(
                        "No fields added yet. Click the buttons above to add fields.",
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.fields.map((field, index) => {
                      const FieldIcon = fieldTypeIcons[field.type] || Type;
                      const isExpanded = expandedField === field.id;
                      const isDragging = draggedFieldIndex === index;
                      const isDragOver = dragOverFieldIndex === index;

                      return (
                        <div
                          key={field.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`border rounded-lg transition-all ${
                            isDragging
                              ? "opacity-50 border-purple-400 bg-purple-50 dark:bg-purple-900/20"
                              : isDragOver
                                ? "border-purple-500 border-2 bg-purple-50 dark:bg-purple-900/10"
                                : "border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <div
                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() =>
                              setExpandedField(isExpanded ? null : field.id)
                            }
                          >
                            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                            <FieldIcon className="w-4 h-4 text-purple-600" />
                            <span className="flex-1 text-sm font-medium">
                              {field.label || __("Untitled Field")}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">
                              {field.type}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>

                          {isExpanded && (
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium mb-1">
                                    {__("Label")}
                                  </label>
                                  <Input
                                    value={field.label}
                                    onChange={(e) =>
                                      updateField(field.id, {
                                        label: e.target.value,
                                      })
                                    }
                                    placeholder={__("Field label")}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">
                                    {__("Placeholder")}
                                  </label>
                                  <Input
                                    value={field.placeholder || ""}
                                    onChange={(e) =>
                                      updateField(field.id, {
                                        placeholder: e.target.value,
                                      })
                                    }
                                    placeholder={__("Placeholder text")}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) =>
                                      updateField(field.id, {
                                        required: e.target.checked,
                                      })
                                    }
                                    className="w-4 h-4 rounded"
                                  />
                                  <span className="text-sm">
                                    {__("Required")}
                                  </span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={field.enabled}
                                    onChange={(e) =>
                                      updateField(field.id, {
                                        enabled: e.target.checked,
                                      })
                                    }
                                    className="w-4 h-4 rounded"
                                  />
                                  <span className="text-sm">
                                    {__("Enabled")}
                                  </span>
                                </label>
                                <Select
                                  value={field.width}
                                  onChange={(e) =>
                                    updateField(field.id, {
                                      width: e.target.value as "full" | "half",
                                    })
                                  }
                                  className="w-32"
                                >
                                  <option value="full">
                                    {__("Full Width")}
                                  </option>
                                  <option value="half">
                                    {__("Half Width")}
                                  </option>
                                </Select>
                              </div>

                              {field.type === "select" && (
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    {__("Options")}
                                  </label>
                                  {field.options?.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                      <Input
                                        value={opt.value}
                                        onChange={(e) => {
                                          const newOptions = [
                                            ...(field.options || []),
                                          ];
                                          newOptions[idx] = {
                                            ...newOptions[idx],
                                            value: e.target.value,
                                          };
                                          updateField(field.id, {
                                            options: newOptions,
                                          });
                                        }}
                                        placeholder={__("Value")}
                                        className="flex-1"
                                      />
                                      <Input
                                        value={opt.label}
                                        onChange={(e) => {
                                          const newOptions = [
                                            ...(field.options || []),
                                          ];
                                          newOptions[idx] = {
                                            ...newOptions[idx],
                                            label: e.target.value,
                                          };
                                          updateField(field.id, {
                                            options: newOptions,
                                          });
                                        }}
                                        placeholder={__("Label")}
                                        className="flex-1"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const newOptions =
                                            field.options?.filter(
                                              (_, i) => i !== idx,
                                            );
                                          updateField(field.id, {
                                            options: newOptions,
                                          });
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newOptions = [
                                        ...(field.options || []),
                                        { value: "", label: "" },
                                      ];
                                      updateField(field.id, {
                                        options: newOptions,
                                      });
                                    }}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    {__("Add Option")}
                                  </Button>
                                </div>
                              )}

                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeField(field.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  {__("Remove Field")}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === "content" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{__("Content Blocks")}</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addContentBlock("heading")}
                    >
                      {__("Add Heading")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addContentBlock("paragraph")}
                    >
                      {__("Add Paragraph")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addContentBlock("terms")}
                    >
                      {__("Add Terms")}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formData.content_blocks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlignLeft className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>
                      {__(
                        "No content blocks added yet. Add headings, paragraphs, or terms sections.",
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.content_blocks.map((block) => (
                      <div
                        key={block.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-purple-600 capitalize">
                            {block.type}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeContentBlock(block.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <Input
                            value={block.title}
                            onChange={(e) =>
                              updateContentBlock(block.id, {
                                title: e.target.value,
                              })
                            }
                            placeholder={__("Title")}
                          />
                          <textarea
                            value={block.content}
                            onChange={(e) =>
                              updateContentBlock(block.id, {
                                content: e.target.value,
                              })
                            }
                            placeholder={__("Content...")}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{__("Recipient Settings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__("Send consent form to")}
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <input
                        type="radio"
                        name="send_to"
                        value="all_travelers"
                        checked={formData.send_to === "all_travelers"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            send_to: e.target.value as any,
                          })
                        }
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {__("All Travelers")}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {__(
                            "Each traveler in the booking will receive their own consent form to sign individually.",
                          )}
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <input
                        type="radio"
                        name="send_to"
                        value="lead_traveler"
                        checked={formData.send_to === "lead_traveler"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            send_to: e.target.value as any,
                          })
                        }
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {__("Lead Traveler Only")}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {__(
                            "Only the first/lead traveler will receive the consent form.",
                          )}
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <input
                        type="radio"
                        name="send_to"
                        value="primary_contact"
                        checked={formData.send_to === "primary_contact"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            send_to: e.target.value as any,
                          })
                        }
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {__("Primary Contact Only")}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {__(
                            "Only the person who made the booking (primary contact) will receive the consent form.",
                          )}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{__("Delivery Settings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {__("Send before trip (days)")}
                  </label>
                  <Input
                    type="number"
                    value={formData.send_before_days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        send_before_days: parseInt(e.target.value) || 7,
                      })
                    }
                    min={1}
                    max={90}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {__(
                      "Number of days before the trip to send the consent request.",
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {__("Reminder days")}
                  </label>
                  <Input
                    value={formData.reminder_days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reminder_days: e.target.value,
                      })
                    }
                    placeholder="3,1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {__(
                      "Comma-separated days before trip to send reminders (e.g., 3,1 for 3 days and 1 day before).",
                    )}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {__("Test Email")}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={testEmail || ""}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder={__("Enter email address to test consent email")}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSendTestEmail}
                      disabled={!testEmail || sendTestEmailMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {sendTestEmailMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      {__("Send Test")}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {__(
                      "Send a test consent email to preview how it will appear to customers.",
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{__("Expiry Settings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {__("Link expiry (hours)")}
                  </label>
                  <Input
                    type="number"
                    value={formData.expiry_hours || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expiry_hours: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder={__("No expiry")}
                    min={1}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {__(
                      "Leave empty for no expiry. The consent link will expire after this many hours.",
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === "preview" && (
          <PreviewForm
            formData={formData}
            showToast={showToast}
            generateSimpleForm={generateSimpleForm}
            setActiveTab={setActiveTab}
          />
        )}
      </form>
    </div>
  );
};

// Separate Preview Form Component with its own state
interface PreviewFormProps {
  formData: ConsentFormData;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  generateSimpleForm: () => void;
  setActiveTab: (
    tab: "general" | "fields" | "content" | "settings" | "preview",
  ) => void;
}

const PreviewForm: React.FC<PreviewFormProps> = ({
  formData,
  showToast,
  generateSimpleForm,
  setActiveTab,
}) => {
  const [previewValues, setPreviewValues] = React.useState<
    Record<string, string>
  >({});
  const [previewChecked, setPreviewChecked] = React.useState<
    Record<string, boolean>
  >({});
  const [hasSignature, setHasSignature] = React.useState(false);
  const [hasInitials, setHasInitials] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [savedConsentId, setSavedConsentId] = React.useState<number | null>(
    null,
  );

  // Refs for signature canvases to get data URLs
  const signatureCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const initialsCanvasRef = React.useRef<HTMLCanvasElement>(null);

  const handlePreviewSubmit = async () => {
    const errors: string[] = [];

    // Validate required fields
    formData.fields
      .filter((f) => f.enabled && f.required)
      .forEach((field) => {
        if (field.type === "checkbox") {
          if (!previewChecked[field.id]) {
            errors.push(`"${field.label}" ${__("is required")}`);
          }
        } else {
          if (!previewValues[field.id]?.trim()) {
            errors.push(`"${field.label}" ${__("is required")}`);
          }
        }
      });

    // Validate signature
    if (formData.require_signature && !hasSignature) {
      errors.push(__("Signature is required"));
    }

    // Validate initials
    if (formData.require_initials && !hasInitials) {
      errors.push(__("Initials are required"));
    }

    setValidationErrors(errors);

    if (errors.length > 0) {
      showToast(__("Please fill in all required fields"), "error");
      return;
    }

    // Get signature and initials data
    const signatureData =
      signatureCanvasRef.current?.toDataURL("image/png") || "";
    const initialsData =
      initialsCanvasRef.current?.toDataURL("image/png") || "";

    // Build form data object with field labels
    const submittedFormData: Record<string, any> = {};
    formData.fields
      .filter((f) => f.enabled)
      .forEach((field) => {
        if (field.type === "checkbox") {
          submittedFormData[field.label] = previewChecked[field.id] || false;
        } else {
          submittedFormData[field.label] = previewValues[field.id] || "";
        }
      });

    setIsSubmitting(true);

    try {
      // Save to database via API
      const response = await apiClient.post("/signed-consents/preview", {
        form_id: formData.id || 0,
        form_version: 1,
        signer_name:
          previewValues["full_name"] || previewValues["name"] || "Preview User",
        signer_email: previewValues["email"] || "preview@example.com",
        form_data: submittedFormData,
        signature_data: formData.require_signature ? signatureData : null,
        initials_data: formData.require_initials ? initialsData : null,
        is_preview: true,
      });

      if (response?.success) {
        setSavedConsentId(response.data?.id || null);
        setIsSubmitted(true);
        showToast(__("Consent form saved successfully!"), "success");
      } else {
        throw new Error(response?.message || "Failed to save");
      }
    } catch (error: any) {
      console.error("Failed to save consent:", error);
      showToast(error?.message || __("Failed to save consent form"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="overflow-hidden">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckSquare className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {__("Consent Form Saved!")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {__(
                "Your consent form submission has been saved to the database.",
              )}
            </p>
            {savedConsentId && (
              <p className="text-sm text-purple-600 dark:text-purple-400 mb-6">
                {__("Consent ID")}: #{savedConsentId}
              </p>
            )}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left mb-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                {__("Saved Data:")}
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {formData.fields
                  .filter((f) => f.enabled)
                  .map((field) => (
                    <li key={field.id}>
                      <span className="font-medium">{field.label}:</span>{" "}
                      {field.type === "checkbox"
                        ? previewChecked[field.id]
                          ? "✓ Checked"
                          : "✗ Not checked"
                        : previewValues[field.id] || "-"}
                    </li>
                  ))}
                {formData.require_signature && (
                  <li>
                    <span className="font-medium">{__("Signature")}:</span> ✓{" "}
                    {__("Saved")}
                  </li>
                )}
                {formData.require_initials && (
                  <li>
                    <span className="font-medium">{__("Initials")}:</span> ✓{" "}
                    {__("Saved")}
                  </li>
                )}
              </ul>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSubmitted(false);
                  setSavedConsentId(null);
                  setPreviewValues({});
                  setPreviewChecked({});
                  setHasSignature(false);
                  setHasInitials(false);
                }}
              >
                {__("Submit Another")}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  window.location.href = `${(window as any).yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=trip-consent`;
                }}
              >
                {__("View Signed Consents")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <h2 className="text-2xl font-bold">
            {formData.name || __("Consent Form")}
          </h2>
          {formData.description && (
            <p className="mt-2 text-purple-100">{formData.description}</p>
          )}
        </div>

        <CardContent className="p-6 space-y-8">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="text-red-800 dark:text-red-300 font-medium mb-2">
                {__("Please fix the following errors:")}
              </h4>
              <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
                {validationErrors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Content Blocks */}
          {formData.content_blocks.length > 0 && (
            <div className="space-y-6">
              {formData.content_blocks
                .sort((a, b) => a.order - b.order)
                .map((block) => (
                  <div
                    key={block.id}
                    className="prose dark:prose-invert max-w-none"
                  >
                    {block.type === "heading" && (
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                        {block.title}
                      </h3>
                    )}
                    {block.type === "paragraph" && (
                      <div>
                        {block.title && (
                          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                            {block.title}
                          </h4>
                        )}
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          {block.content}
                        </p>
                      </div>
                    )}
                    {block.type === "terms" && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                          <CheckSquare className="w-5 h-5 text-purple-600" />
                          {block.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          {block.content}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Form Fields */}
          {formData.fields.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                {__("Participant Information")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.fields
                  .filter((f) => f.enabled)
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <div
                      key={field.id}
                      className={field.width === "full" ? "md:col-span-2" : ""}
                    >
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {field.label || __("Untitled Field")}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          placeholder={field.placeholder}
                          value={previewValues[field.id] || ""}
                          onChange={(e) =>
                            setPreviewValues({
                              ...previewValues,
                              [field.id]: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      ) : field.type === "checkbox" ? (
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={previewChecked[field.id] || false}
                            onChange={(e) =>
                              setPreviewChecked({
                                ...previewChecked,
                                [field.id]: e.target.checked,
                              })
                            }
                            className="mt-1 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {field.label}
                          </span>
                        </label>
                      ) : field.type === "select" ? (
                        <select
                          value={previewValues[field.id] || ""}
                          onChange={(e) =>
                            setPreviewValues({
                              ...previewValues,
                              [field.id]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">
                            {field.placeholder || __("Select an option")}
                          </option>
                          {field.options?.map((opt, idx) => (
                            <option key={idx} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={previewValues[field.id] || ""}
                          onChange={(e) =>
                            setPreviewValues({
                              ...previewValues,
                              [field.id]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Signature Section */}
          {(formData.require_signature || formData.require_initials) && (
            <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__("Signature")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.require_signature && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__("Your Signature")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <SignaturePadPreview
                      id="signature-preview"
                      placeholder={__("Draw your signature here")}
                      onContentChange={setHasSignature}
                      canvasRef={signatureCanvasRef}
                    />
                  </div>
                )}

                {formData.require_initials && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__("Initials")} <span className="text-red-500">*</span>
                    </label>
                    <SignaturePadPreview
                      id="initials-preview"
                      placeholder={__("Draw initials here")}
                      onContentChange={setHasInitials}
                      canvasRef={initialsCanvasRef}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="button"
              onClick={handlePreviewSubmit}
              disabled={isSubmitting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {__("Submitting...")}
                </>
              ) : (
                __("Submit Consent Form")
              )}
            </Button>
            <p className="text-xs text-center text-gray-500 mt-2">
              {__(
                "This is an interactive preview. Test the form submission behavior.",
              )}
            </p>
          </div>

          {/* Empty State */}
          {formData.fields.length === 0 &&
            formData.content_blocks.length === 0 && (
              <div className="text-center py-12">
                <FileSignature className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {__("No content yet")}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {__("Add form fields and content blocks to see the preview.")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    generateSimpleForm();
                    setActiveTab("preview");
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {__("Generate Simple Form")}
                </Button>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TripConsentForm;
