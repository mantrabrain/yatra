import { r as reactExports, t as useQueryClient, u as useQuery, v as useMutation, j as jsxRuntimeExports, F as FileSignature, z as ArrowLeft, S as Sparkles, D as Loader2, aV as Save, bZ as Hash, aW as Phone, d as Mail, p as Calendar, L as List, bC as CheckSquare, b_ as AlignLeft, b$ as Type, b9 as GripVertical, ba as ChevronUp, x as ChevronDown, aN as Trash2, aw as Plus, a5 as React } from "./react-vendor-CqkbFEvK.js";
import { B as Button, C as Card, f as CardHeader, d as CardContent, P as PageHeader, g as CardTitle, I as Input, S as Select } from "../../admin/dist/js/app.js";
import { A as ApplicableTripSelector } from "./ApplicableTripSelector-Ca2ZTa4y.js";
import { u as useToast, _ as __, a as apiClient } from "./index-fqW8jODk.js";
const defaultFormData = {
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
  content_blocks: []
};
const fieldTypeIcons = {
  text: Type,
  textarea: AlignLeft,
  checkbox: CheckSquare,
  select: List,
  date: Calendar,
  email: Mail,
  phone: Phone,
  number: Hash
};
const isModuleAvailable = () => {
  const yatraAdmin = window == null ? void 0 : window.yatraAdmin;
  return Boolean((yatraAdmin == null ? void 0 : yatraAdmin.isPro) && (yatraAdmin == null ? void 0 : yatraAdmin.tripConsentEnabled));
};
const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const SignaturePadPreview = ({
  id,
  placeholder,
  onContentChange,
  canvasRef: externalCanvasRef
}) => {
  const internalCanvasRef = React.useRef(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasContent, setHasContent] = React.useState(false);
  const updateContent = (value) => {
    setHasContent(value);
    onContentChange == null ? void 0 : onContentChange(value);
  };
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas == null ? void 0 : canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    updateContent(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas == null ? void 0 : canvas.getContext("2d");
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
    const ctx = canvas == null ? void 0 : canvas.getContext("2d");
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "canvas",
      {
        ref: canvasRef,
        id,
        className: "w-full h-32 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white cursor-crosshair touch-none",
        onMouseDown: startDrawing,
        onMouseMove: draw,
        onMouseUp: stopDrawing,
        onMouseLeave: stopDrawing,
        onTouchStart: startDrawing,
        onTouchMove: draw,
        onTouchEnd: stopDrawing
      }
    ),
    !hasContent && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-sm", children: placeholder }) }),
    hasContent && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: clearCanvas,
        className: "absolute top-2 right-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded",
        children: __("Clear")
      }
    )
  ] });
};
const TripConsentForm = () => {
  const [formData, setFormData] = reactExports.useState(defaultFormData);
  const [errors, setErrors] = reactExports.useState({});
  const [activeTab, setActiveTab] = reactExports.useState("general");
  const [expandedField, setExpandedField] = reactExports.useState(null);
  const [testEmail, setTestEmail] = reactExports.useState("");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const formId = urlParams.get("id");
  const isEditMode = !!formId;
  const { data: existingFormResponse, isLoading: isLoadingForm } = useQuery({
    queryKey: ["consent-form", formId],
    queryFn: async () => {
      const response = await apiClient.get(`/consent-forms/${formId}`);
      return response;
    },
    enabled: isEditMode && isModuleAvailable()
  });
  reactExports.useEffect(() => {
    var _a, _b;
    const existingForm = (existingFormResponse == null ? void 0 : existingFormResponse.data) || existingFormResponse;
    if (existingForm && existingForm.id) {
      const fields = ((_a = existingForm.form_config) == null ? void 0 : _a.fields) || [];
      const sortedFields = [...fields].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );
      const contentBlocks = ((_b = existingForm.form_config) == null ? void 0 : _b.content_blocks) || [];
      const sortedContentBlocks = [...contentBlocks].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
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
        content_blocks: sortedContentBlocks
      });
    }
  }, [existingFormResponse]);
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const fieldsWithOrder = data.fields.map((field, index) => ({
        id: field.id,
        type: field.type,
        label: field.label || "",
        placeholder: field.placeholder || "",
        required: field.required ?? false,
        enabled: field.enabled ?? true,
        order: index,
        width: field.width || "full",
        options: field.options || void 0
      }));
      const contentBlocksWithOrder = data.content_blocks.map(
        (block, index) => ({
          id: block.id,
          type: block.type,
          title: block.title || "",
          content: block.content || "",
          order: index
        })
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
          content_blocks: contentBlocksWithOrder
        }
      };
      if (isEditMode) {
        return await apiClient.put(`/consent-forms/${formId}`, payload);
      }
      return await apiClient.post("/consent-forms", payload);
    },
    onSuccess: (response) => {
      var _a, _b;
      queryClient.invalidateQueries({ queryKey: ["consent-forms"] });
      showToast(
        isEditMode ? __("Consent form updated successfully") : __("Consent form created successfully"),
        "success"
      );
      if (isEditMode) {
        return;
      }
      const newId = ((_a = response == null ? void 0 : response.data) == null ? void 0 : _a.id) ?? (response == null ? void 0 : response.id) ?? ((_b = response == null ? void 0 : response.form) == null ? void 0 : _b.id);
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
        `${window.location.pathname}?${params.toString()}`
      );
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    onError: (error) => {
      showToast((error == null ? void 0 : error.message) || __("Failed to save consent form"), "error");
    }
  });
  const sendTestEmailMutation = useMutation({
    mutationFn: async (email) => {
      const payload = {
        email,
        form_data: {
          ...formData,
          fields: formData.fields.map((field, index) => ({
            ...field,
            order: index
          })),
          content_blocks: formData.content_blocks.map((block, index) => ({
            ...block,
            order: index
          }))
        }
      };
      return await apiClient.post("/consent-forms/send-test-email", payload);
    },
    onSuccess: () => {
      showToast(__("Test email sent successfully"), "success");
      setTestEmail("");
    },
    onError: (error) => {
      showToast((error == null ? void 0 : error.message) || __("Failed to send test email"), "error");
    }
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
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = __("Form name is required");
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    saveMutation.mutate(formData);
  };
  const addField = (type) => {
    const newField = {
      id: generateId(),
      type,
      label: "",
      placeholder: "",
      required: false,
      enabled: true,
      order: formData.fields.length,
      width: "full",
      options: type === "select" ? [{ value: "", label: "" }] : void 0
    };
    setFormData({ ...formData, fields: [...formData.fields, newField] });
    setExpandedField(newField.id);
  };
  const updateField = (fieldId, updates) => {
    setFormData({
      ...formData,
      fields: formData.fields.map(
        (f) => f.id === fieldId ? { ...f, ...updates } : f
      )
    });
  };
  const removeField = (fieldId) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((f) => f.id !== fieldId)
    });
  };
  const moveField = (fromIndex, toIndex) => {
    const newFields = [...formData.fields];
    const [movedField] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, movedField);
    const reorderedFields = newFields.map((field, index) => ({
      ...field,
      order: index
    }));
    setFormData({ ...formData, fields: reorderedFields });
  };
  const [draggedFieldIndex, setDraggedFieldIndex] = reactExports.useState(
    null
  );
  const [dragOverFieldIndex, setDragOverFieldIndex] = reactExports.useState(
    null
  );
  const handleDragStart = (e, index) => {
    setDraggedFieldIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedFieldIndex !== null && draggedFieldIndex !== index) {
      setDragOverFieldIndex(index);
    }
  };
  const handleDragLeave = () => {
    setDragOverFieldIndex(null);
  };
  const handleDrop = (e, toIndex) => {
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
  const addContentBlock = (type) => {
    const newBlock = {
      id: generateId(),
      type,
      title: "",
      content: "",
      order: formData.content_blocks.length
    };
    setFormData({
      ...formData,
      content_blocks: [...formData.content_blocks, newBlock]
    });
  };
  const updateContentBlock = (blockId, updates) => {
    setFormData({
      ...formData,
      content_blocks: formData.content_blocks.map(
        (b) => b.id === blockId ? { ...b, ...updates } : b
      )
    });
  };
  const removeContentBlock = (blockId) => {
    setFormData({
      ...formData,
      content_blocks: formData.content_blocks.filter((b) => b.id !== blockId)
    });
  };
  const generateSimpleForm = () => {
    const simpleFields = [
      {
        id: generateId(),
        type: "text",
        label: __("Full Name"),
        placeholder: __("Enter your full legal name"),
        required: true,
        enabled: true,
        order: 0,
        width: "half"
      },
      {
        id: generateId(),
        type: "email",
        label: __("Email Address"),
        placeholder: __("Enter your email address"),
        required: true,
        enabled: true,
        order: 1,
        width: "half"
      },
      {
        id: generateId(),
        type: "phone",
        label: __("Phone Number"),
        placeholder: __("Enter your phone number"),
        required: true,
        enabled: true,
        order: 2,
        width: "half"
      },
      {
        id: generateId(),
        type: "date",
        label: __("Date of Birth"),
        placeholder: "",
        required: true,
        enabled: true,
        order: 3,
        width: "half"
      },
      {
        id: generateId(),
        type: "text",
        label: __("Emergency Contact Name"),
        placeholder: __("Name of emergency contact"),
        required: true,
        enabled: true,
        order: 4,
        width: "half"
      },
      {
        id: generateId(),
        type: "phone",
        label: __("Emergency Contact Phone"),
        placeholder: __("Emergency contact phone number"),
        required: true,
        enabled: true,
        order: 5,
        width: "half"
      },
      {
        id: generateId(),
        type: "textarea",
        label: __("Medical Conditions or Allergies"),
        placeholder: __(
          "Please list any medical conditions, allergies, or dietary restrictions we should be aware of"
        ),
        required: false,
        enabled: true,
        order: 6,
        width: "full"
      },
      {
        id: generateId(),
        type: "checkbox",
        label: __(
          "I confirm that I am physically fit to participate in this trip"
        ),
        placeholder: "",
        required: true,
        enabled: true,
        order: 7,
        width: "full"
      }
    ];
    const simpleContentBlocks = [
      {
        id: generateId(),
        type: "heading",
        title: __("Trip Participation Agreement"),
        content: "",
        order: 0
      },
      {
        id: generateId(),
        type: "paragraph",
        title: __("Introduction"),
        content: __(
          "By signing this consent form, you acknowledge that you have read, understood, and agree to the terms and conditions outlined below for your participation in the trip."
        ),
        order: 1
      },
      {
        id: generateId(),
        type: "terms",
        title: __("Assumption of Risk"),
        content: __(
          "I understand that participation in this trip involves inherent risks, including but not limited to physical injury, illness, property damage, and other hazards. I voluntarily assume all risks associated with my participation and agree to hold harmless the trip organizers, guides, and affiliated parties from any liability arising from my participation."
        ),
        order: 2
      },
      {
        id: generateId(),
        type: "terms",
        title: __("Medical Authorization"),
        content: __(
          "In the event of a medical emergency, I authorize the trip organizers to seek and consent to medical treatment on my behalf. I understand that I am responsible for any medical expenses incurred during the trip."
        ),
        order: 3
      },
      {
        id: generateId(),
        type: "terms",
        title: __("Photo/Video Release"),
        content: __(
          "I grant permission to the trip organizers to use photographs and videos taken during the trip for promotional and marketing purposes without compensation."
        ),
        order: 4
      },
      {
        id: generateId(),
        type: "paragraph",
        title: __("Agreement"),
        content: __(
          "By signing below, I confirm that I have read and understood this consent form, that I am at least 18 years of age (or have parental/guardian consent), and that I agree to abide by all rules and instructions provided by the trip organizers."
        ),
        order: 5
      }
    ];
    setFormData({
      ...formData,
      name: formData.name || __("Trip Liability Waiver"),
      description: formData.description || __("Standard liability waiver and consent form for trip participants"),
      require_signature: true,
      require_initials: true,
      fields: simpleFields,
      content_blocks: simpleContentBlocks
    });
    showToast(
      __("Simple consent form generated! Review and customize as needed."),
      "success"
    );
  };
  if (!isModuleAvailable()) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(FileSignature, { className: "w-16 h-16 mx-auto text-gray-400 mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-2", children: __("Trip Consent is a Premium Feature") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-4", children: __("Upgrade to Yatra Pro to create and manage consent forms.") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: () => window.open(
            "https://wpyatra.com/pricing?module=trip-consent",
            "_blank"
          ),
          children: __("Upgrade to Pro")
        }
      )
    ] });
  }
  if (isLoadingForm) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2", children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        },
        i
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-2 space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-24 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }) })
          ] })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        title: isEditMode ? __("Edit Consent Form") : __("Create Consent Form"),
        description: isEditMode ? __("Update your consent form settings and fields.") : __("Create a new consent form for your trips."),
        actions: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: navigateBack, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
            __("Back")
          ] }),
          !isEditMode && formData.fields.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: generateSimpleForm,
              className: "border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900/20",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-4 h-4 mr-2" }),
                __("Generate Simple Form")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: handleSubmit,
              disabled: saveMutation.isPending,
              className: "bg-blue-600 hover:bg-blue-700",
              children: [
                saveMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4 mr-2" }),
                isEditMode ? __("Update Form") : __("Create Form")
              ]
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-gray-200 dark:border-gray-700 mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex gap-6", children: ["general", "fields", "content", "settings", "preview"].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => setActiveTab(tab),
          className: `pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`,
          children: [
            tab === "general" && __("General"),
            tab === "fields" && __("Form Fields"),
            tab === "content" && __("Content Blocks"),
            tab === "settings" && __("Settings"),
            tab === "preview" && __("Preview")
          ]
        },
        tab
      )) }) }),
      activeTab === "general" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-2 space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Form Details") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: [
                __("Form Name"),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: formData.name,
                  onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                  placeholder: __("e.g., Liability Waiver"),
                  className: errors.name ? "border-red-500" : ""
                }
              ),
              errors.name && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.name })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: __("Description") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  value: formData.description,
                  onChange: (e) => setFormData({
                    ...formData,
                    description: e.target.value
                  }),
                  placeholder: __(
                    "Brief description of this consent form..."
                  ),
                  rows: 3,
                  className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                }
              )
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Status") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.status,
                onChange: (e) => setFormData({
                  ...formData,
                  status: e.target.value
                }),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "publish", children: __("Published") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "draft", children: __("Draft") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "archived", children: __("Archived") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "trash", children: __("Trash") })
                ]
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Signature Requirements") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: formData.require_signature,
                    onChange: (e) => setFormData({
                      ...formData,
                      require_signature: e.target.checked
                    }),
                    className: "w-4 h-4 rounded border-gray-300"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: __("Require signature") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: formData.require_initials,
                    onChange: (e) => setFormData({
                      ...formData,
                      require_initials: e.target.checked
                    }),
                    className: "w-4 h-4 rounded border-gray-300"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: __("Require initials") })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Applicable To", "yatra") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              ApplicableTripSelector,
              {
                value: formData.applicable_to,
                onValueChange: (val) => setFormData({ ...formData, applicable_to: val }),
                selectedTripIds: formData.trip_ids,
                onTripIdsChange: (ids) => setFormData({ ...formData, trip_ids: ids }),
                description: __(
                  "Choose whether this consent form applies to all trips or specific ones."
                ),
                helperText: __(
                  "Trips shown with ID for quick identification."
                )
              }
            ) })
          ] })
        ] })
      ] }),
      activeTab === "fields" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __("Form Fields") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: Object.entries(fieldTypeIcons).map(([type, Icon]) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: () => addField(type),
              title: type,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-4 h-4" })
            },
            type
          )) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: formData.fields.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8 text-gray-500", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "w-12 h-12 mx-auto mb-3 opacity-50" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: __(
            "No fields added yet. Click the buttons above to add fields."
          ) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: formData.fields.map((field, index) => {
          var _a;
          const FieldIcon = fieldTypeIcons[field.type] || Type;
          const isExpanded = expandedField === field.id;
          const isDragging = draggedFieldIndex === index;
          const isDragOver = dragOverFieldIndex === index;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              draggable: true,
              onDragStart: (e) => handleDragStart(e, index),
              onDragOver: (e) => handleDragOver(e, index),
              onDragLeave: handleDragLeave,
              onDrop: (e) => handleDrop(e, index),
              onDragEnd: handleDragEnd,
              className: `border rounded-lg transition-all ${isDragging ? "opacity-50 border-blue-400 bg-blue-50 dark:bg-blue-900/20" : isDragOver ? "border-blue-500 border-2 bg-blue-50 dark:bg-blue-900/10" : "border-gray-200 dark:border-gray-700"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                    onClick: () => setExpandedField(isExpanded ? null : field.id),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(GripVertical, { className: "w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(FieldIcon, { className: "w-4 h-4 text-blue-600" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm font-medium", children: field.label || __("Untitled Field") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 capitalize", children: field.type }),
                      isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "w-4 h-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-4 h-4" })
                    ]
                  }
                ),
                isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-t border-gray-200 dark:border-gray-700 space-y-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-1", children: __("Label") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          value: field.label,
                          onChange: (e) => updateField(field.id, {
                            label: e.target.value
                          }),
                          placeholder: __("Field label")
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-1", children: __("Placeholder") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          value: field.placeholder || "",
                          onChange: (e) => updateField(field.id, {
                            placeholder: e.target.value
                          }),
                          placeholder: __("Placeholder text")
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-6", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "checkbox",
                          checked: field.required,
                          onChange: (e) => updateField(field.id, {
                            required: e.target.checked
                          }),
                          className: "w-4 h-4 rounded"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: __("Required") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "checkbox",
                          checked: field.enabled,
                          onChange: (e) => updateField(field.id, {
                            enabled: e.target.checked
                          }),
                          className: "w-4 h-4 rounded"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: __("Enabled") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Select,
                      {
                        value: field.width,
                        onChange: (e) => updateField(field.id, {
                          width: e.target.value
                        }),
                        className: "w-32",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "full", children: __("Full Width") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "half", children: __("Half Width") })
                        ]
                      }
                    )
                  ] }),
                  field.type === "select" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-2", children: __("Options") }),
                    (_a = field.options) == null ? void 0 : _a.map((opt, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mb-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          value: opt.value,
                          onChange: (e) => {
                            const newOptions = [
                              ...field.options || []
                            ];
                            newOptions[idx] = {
                              ...newOptions[idx],
                              value: e.target.value
                            };
                            updateField(field.id, {
                              options: newOptions
                            });
                          },
                          placeholder: __("Value"),
                          className: "flex-1"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          value: opt.label,
                          onChange: (e) => {
                            const newOptions = [
                              ...field.options || []
                            ];
                            newOptions[idx] = {
                              ...newOptions[idx],
                              label: e.target.value
                            };
                            updateField(field.id, {
                              options: newOptions
                            });
                          },
                          placeholder: __("Label"),
                          className: "flex-1"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "button",
                          variant: "ghost",
                          size: "sm",
                          onClick: () => {
                            var _a2;
                            const newOptions = (_a2 = field.options) == null ? void 0 : _a2.filter(
                              (_, i) => i !== idx
                            );
                            updateField(field.id, {
                              options: newOptions
                            });
                          },
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 text-red-500" })
                        }
                      )
                    ] }, idx)),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        type: "button",
                        variant: "outline",
                        size: "sm",
                        onClick: () => {
                          const newOptions = [
                            ...field.options || [],
                            { value: "", label: "" }
                          ];
                          updateField(field.id, {
                            options: newOptions
                          });
                        },
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-1" }),
                          __("Add Option")
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "ghost",
                      size: "sm",
                      onClick: () => removeField(field.id),
                      className: "text-red-600 hover:text-red-700 hover:bg-red-50",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 mr-1" }),
                        __("Remove Field")
                      ]
                    }
                  ) })
                ] })
              ]
            },
            field.id
          );
        }) }) })
      ] }) }),
      activeTab === "content" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __("Content Blocks") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => addContentBlock("heading"),
                children: __("Add Heading")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => addContentBlock("paragraph"),
                children: __("Add Paragraph")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => addContentBlock("terms"),
                children: __("Add Terms")
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: formData.content_blocks.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8 text-gray-500", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlignLeft, { className: "w-12 h-12 mx-auto mb-3 opacity-50" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: __(
            "No content blocks added yet. Add headings, paragraphs, or terms sections."
          ) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: formData.content_blocks.map((block) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "border border-gray-200 dark:border-gray-700 rounded-lg p-4",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-blue-600 capitalize", children: block.type }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "ghost",
                    size: "sm",
                    onClick: () => removeContentBlock(block.id),
                    className: "text-red-600",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: block.title,
                    onChange: (e) => updateContentBlock(block.id, {
                      title: e.target.value
                    }),
                    placeholder: __("Title")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "textarea",
                  {
                    value: block.content,
                    onChange: (e) => updateContentBlock(block.id, {
                      content: e.target.value
                    }),
                    placeholder: __("Content..."),
                    rows: 4,
                    className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  }
                )
              ] })
            ]
          },
          block.id
        )) }) })
      ] }) }),
      activeTab === "settings" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Recipient Settings") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Send consent form to") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "radio",
                    name: "send_to",
                    value: "all_travelers",
                    checked: formData.send_to === "all_travelers",
                    onChange: (e) => setFormData({
                      ...formData,
                      send_to: e.target.value
                    }),
                    className: "mt-1"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: __("All Travelers") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: __(
                    "Each traveler in the booking will receive their own consent form to sign individually."
                  ) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "radio",
                    name: "send_to",
                    value: "lead_traveler",
                    checked: formData.send_to === "lead_traveler",
                    onChange: (e) => setFormData({
                      ...formData,
                      send_to: e.target.value
                    }),
                    className: "mt-1"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: __("Lead Traveler Only") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: __(
                    "Only the first/lead traveler will receive the consent form."
                  ) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "radio",
                    name: "send_to",
                    value: "primary_contact",
                    checked: formData.send_to === "primary_contact",
                    onChange: (e) => setFormData({
                      ...formData,
                      send_to: e.target.value
                    }),
                    className: "mt-1"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: __("Primary Contact Only") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: __(
                    "Only the person who made the booking (primary contact) will receive the consent form."
                  ) })
                ] })
              ] })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Delivery Settings") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: __("Send before trip (days)") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: formData.send_before_days,
                  onChange: (e) => setFormData({
                    ...formData,
                    send_before_days: parseInt(e.target.value) || 7
                  }),
                  min: 1,
                  max: 90
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 mt-1", children: __(
                "Number of days before the trip to send the consent request."
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: __("Reminder days") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: formData.reminder_days,
                  onChange: (e) => setFormData({
                    ...formData,
                    reminder_days: e.target.value
                  }),
                  placeholder: "3,1"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 mt-1", children: __(
                "Comma-separated days before trip to send reminders (e.g., 3,1 for 3 days and 1 day before)."
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: __("Test Email") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "email",
                    value: testEmail || "",
                    onChange: (e) => setTestEmail(e.target.value),
                    placeholder: __(
                      "Enter email address to test consent email"
                    ),
                    className: "flex-1"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    onClick: handleSendTestEmail,
                    disabled: !testEmail || sendTestEmailMutation.isPending,
                    className: "flex items-center gap-2",
                    children: [
                      sendTestEmailMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-4 h-4" }),
                      __("Send Test")
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 mt-1", children: __(
                "Send a test consent email to preview how it will appear to customers."
              ) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Expiry Settings") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: __("Link expiry (hours)") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                value: formData.expiry_hours || "",
                onChange: (e) => setFormData({
                  ...formData,
                  expiry_hours: e.target.value ? parseInt(e.target.value) : null
                }),
                placeholder: __("No expiry"),
                min: 1
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 mt-1", children: __(
              "Leave empty for no expiry. The consent link will expire after this many hours."
            ) })
          ] }) })
        ] })
      ] }),
      activeTab === "preview" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        PreviewForm,
        {
          formData,
          showToast,
          generateSimpleForm,
          setActiveTab
        }
      )
    ] })
  ] });
};
const PreviewForm = ({
  formData,
  showToast,
  generateSimpleForm,
  setActiveTab
}) => {
  const [previewValues, setPreviewValues] = React.useState({});
  const [previewChecked, setPreviewChecked] = React.useState({});
  const [hasSignature, setHasSignature] = React.useState(false);
  const [hasInitials, setHasInitials] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [savedConsentId, setSavedConsentId] = React.useState(
    null
  );
  const signatureCanvasRef = React.useRef(null);
  const initialsCanvasRef = React.useRef(null);
  const handlePreviewSubmit = async () => {
    var _a, _b, _c;
    const errors = [];
    formData.fields.filter((f) => f.enabled && f.required).forEach((field) => {
      var _a2;
      if (field.type === "checkbox") {
        if (!previewChecked[field.id]) {
          errors.push(`"${field.label}" ${__("is required")}`);
        }
      } else {
        if (!((_a2 = previewValues[field.id]) == null ? void 0 : _a2.trim())) {
          errors.push(`"${field.label}" ${__("is required")}`);
        }
      }
    });
    if (formData.require_signature && !hasSignature) {
      errors.push(__("Signature is required"));
    }
    if (formData.require_initials && !hasInitials) {
      errors.push(__("Initials are required"));
    }
    setValidationErrors(errors);
    if (errors.length > 0) {
      showToast(__("Please fill in all required fields"), "error");
      return;
    }
    const signatureData = ((_a = signatureCanvasRef.current) == null ? void 0 : _a.toDataURL("image/png")) || "";
    const initialsData = ((_b = initialsCanvasRef.current) == null ? void 0 : _b.toDataURL("image/png")) || "";
    const submittedFormData = {};
    formData.fields.filter((f) => f.enabled).forEach((field) => {
      if (field.type === "checkbox") {
        submittedFormData[field.label] = previewChecked[field.id] || false;
      } else {
        submittedFormData[field.label] = previewValues[field.id] || "";
      }
    });
    setIsSubmitting(true);
    try {
      const response = await apiClient.post("/signed-consents/preview", {
        form_id: formData.id || 0,
        form_version: 1,
        signer_name: previewValues["full_name"] || previewValues["name"] || __("Preview User", "yatra"),
        signer_email: previewValues["email"] || "preview@example.com",
        form_data: submittedFormData,
        signature_data: formData.require_signature ? signatureData : null,
        initials_data: formData.require_initials ? initialsData : null,
        is_preview: true
      });
      if (response == null ? void 0 : response.success) {
        setSavedConsentId(((_c = response.data) == null ? void 0 : _c.id) || null);
        setIsSubmitted(true);
        showToast(__("Consent form saved successfully!"), "success");
      } else {
        throw new Error((response == null ? void 0 : response.message) || __("Failed to save", "yatra"));
      }
    } catch (error) {
      console.error("Failed to save consent:", error);
      showToast((error == null ? void 0 : error.message) || __("Failed to save consent form"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isSubmitted) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-3xl mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckSquare, { className: "w-10 h-10 text-blue-600" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-3", children: __("Consent Form Saved!") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-2", children: __(
        "Your consent form submission has been saved to the database."
      ) }),
      savedConsentId && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-blue-600 dark:text-blue-400 mb-6", children: [
        __("Consent ID"),
        ": #",
        savedConsentId
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-gray-900 dark:text-white mb-2", children: __("Saved Data:") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm text-gray-600 dark:text-gray-400 space-y-1", children: [
          formData.fields.filter((f) => f.enabled).map((field) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
              field.label,
              ":"
            ] }),
            " ",
            field.type === "checkbox" ? previewChecked[field.id] ? __("✓ Checked", "yatra") : __("✗ Not checked", "yatra") : previewValues[field.id] || "-"
          ] }, field.id)),
          formData.require_signature && /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
              __("Signature"),
              ":"
            ] }),
            " ✓",
            " ",
            __("Saved")
          ] }),
          formData.require_initials && /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
              __("Initials"),
              ":"
            ] }),
            " ✓",
            " ",
            __("Saved")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 justify-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => {
              setIsSubmitted(false);
              setSavedConsentId(null);
              setPreviewValues({});
              setPreviewChecked({});
              setHasSignature(false);
              setHasInitials(false);
            },
            children: __("Submit Another")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            onClick: () => {
              var _a;
              window.location.href = `${((_a = window.yatraAdmin) == null ? void 0 : _a.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=trip-consent`;
            },
            children: __("View Signed Consents")
          }
        )
      ] })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-3xl mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: formData.name || __("Consent Form") }),
      formData.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-blue-100", children: formData.description })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 space-y-8", children: [
      validationErrors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-red-800 dark:text-red-300 font-medium mb-2", children: __("Please fix the following errors:") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1", children: validationErrors.map((error, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: error }, idx)) })
      ] }),
      formData.content_blocks.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: formData.content_blocks.sort((a, b) => a.order - b.order).map((block) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "prose dark:prose-invert max-w-none",
          children: [
            block.type === "heading" && /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2", children: block.title }),
            block.type === "paragraph" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              block.title && /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-lg font-medium text-gray-800 dark:text-gray-200 mb-2", children: block.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400 leading-relaxed", children: block.content })
            ] }),
            block.type === "terms" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-lg font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CheckSquare, { className: "w-5 h-5 text-blue-600" }),
                block.title
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400 text-sm leading-relaxed", children: block.content })
            ] })
          ]
        },
        block.id
      )) }),
      formData.fields.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2", children: __("Participant Information") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: formData.fields.filter((f) => f.enabled).sort((a, b) => a.order - b.order).map((field) => {
          var _a;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: field.width === "full" ? "md:col-span-2" : "",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: [
                  field.label || __("Untitled Field"),
                  field.required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500 ml-1", children: "*" })
                ] }),
                field.type === "textarea" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "textarea",
                  {
                    placeholder: field.placeholder,
                    value: previewValues[field.id] || "",
                    onChange: (e) => setPreviewValues({
                      ...previewValues,
                      [field.id]: e.target.value
                    }),
                    rows: 3,
                    className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  }
                ) : field.type === "checkbox" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-3 cursor-pointer", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: previewChecked[field.id] || false,
                      onChange: (e) => setPreviewChecked({
                        ...previewChecked,
                        [field.id]: e.target.checked
                      }),
                      className: "mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: field.label })
                ] }) : field.type === "select" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "select",
                  {
                    value: previewValues[field.id] || "",
                    onChange: (e) => setPreviewValues({
                      ...previewValues,
                      [field.id]: e.target.value
                    }),
                    className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: field.placeholder || __("Select an option") }),
                      (_a = field.options) == null ? void 0 : _a.map((opt, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: opt.value, children: opt.label }, idx))
                    ]
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: field.type,
                    placeholder: field.placeholder,
                    value: previewValues[field.id] || "",
                    onChange: (e) => setPreviewValues({
                      ...previewValues,
                      [field.id]: e.target.value
                    }),
                    className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  }
                )
              ]
            },
            field.id
          );
        }) })
      ] }),
      (formData.require_signature || formData.require_initials) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Signature") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          formData.require_signature && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
              __("Your Signature"),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              SignaturePadPreview,
              {
                id: "signature-preview",
                placeholder: __("Draw your signature here"),
                onContentChange: setHasSignature,
                canvasRef: signatureCanvasRef
              }
            )
          ] }),
          formData.require_initials && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
              __("Initials"),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              SignaturePadPreview,
              {
                id: "initials-preview",
                placeholder: __("Draw initials here"),
                onContentChange: setHasInitials,
                canvasRef: initialsCanvasRef
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            onClick: handlePreviewSubmit,
            disabled: isSubmitting,
            className: "w-full bg-blue-600 hover:bg-blue-700 text-white py-3",
            children: isSubmitting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
              __("Submitting...")
            ] }) : __("Submit Consent Form")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-center text-gray-500 mt-2", children: __(
          "This is an interactive preview. Test the form submission behavior."
        ) })
      ] }),
      formData.fields.length === 0 && formData.content_blocks.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileSignature, { className: "w-16 h-16 mx-auto text-gray-300 mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-2", children: __("No content yet") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 dark:text-gray-400 mb-4", children: __("Add form fields and content blocks to see the preview.") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => {
              generateSimpleForm();
              setActiveTab("preview");
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-4 h-4 mr-2" }),
              __("Generate Simple Form")
            ]
          }
        )
      ] })
    ] })
  ] }) });
};
export {
  TripConsentForm as default
};
//# sourceMappingURL=TripConsentForm-D3m7x_N8.js.map
