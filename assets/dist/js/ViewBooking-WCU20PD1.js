import { j as jsxRuntimeExports, v as useQueryClient, a7 as React, w as useMutation, e as Mail, z as ChevronDown, r as reactExports, x as useQuery, B as Briefcase, a_ as CircleDollarSign, ce as Link2, bY as Percent, V as Inbox, at as Clock, ay as Plus, b8 as XCircle, cf as PenLine, a as MessageSquare, cg as RefreshCcw, ch as ArrowDownLeft, S as Sparkles, E as ArrowLeft, aZ as Download, aB as AlertCircle, s as Calendar, U as Users, b0 as Phone, t as MapPin, l as FileText, k as CreditCard, F as FileSignature, ax as CheckCircle, bp as Send } from "./react-vendor-B8PqgpgO.js";
import { u as useToast, _ as __, a as apiClient, s as sprintf, I as Input, f as formatYatraMoney, e as formatDate, m as getCountryName, b as apiService } from "./index-_dIN_405.js";
import { ah as Popover, ai as PopoverTrigger, B as Button, aj as PopoverContent, C as Card, f as CardHeader, g as CardTitle, d as CardContent, S as Select, M as Modal, t as Label, F as ConditionalRender, u as usePermissions, Z as Skeleton, P as PageHeader, j as isModuleActive, ak as downloadAdminBookingInvoice } from "../../admin/dist/js/app.js";
function phoneData() {
  return window.yatraPhoneData || {};
}
function detectPhoneCountry(raw) {
  raw = (raw || "").trim();
  if (!raw || raw.charAt(0) !== "+") return null;
  const digits = raw.replace(/\D+/g, "");
  if (!digits) return null;
  const countries = phoneData().countries || [];
  const priority = phoneData().priority || {};
  for (let len = Math.min(4, digits.length); len >= 1; len--) {
    const prefix = digits.slice(0, len);
    const matches = countries.filter((c) => c.dial === prefix);
    if (matches.length) {
      const iso = priority[prefix] || matches[0].iso;
      return { iso, dial: prefix, national: digits.slice(len) };
    }
  }
  return null;
}
function flagUrl(iso) {
  const base = phoneData().flagBase || "";
  return base ? `${base}${String(iso).toLowerCase()}.svg` : "";
}
function formatPhone(raw) {
  const d = detectPhoneCountry(raw);
  if (!d) return raw;
  return `+${d.dial}${d.national ? " " + d.national : ""}`;
}
const PhoneDisplay = ({
  value,
  className
}) => {
  const raw = (value || "").trim();
  if (!raw) return null;
  const detected = detectPhoneCountry(raw);
  const url = detected ? flagUrl(detected.iso) : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      className,
      style: { display: "inline-flex", alignItems: "center", gap: 6 },
      children: [
        url && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: url,
            alt: detected ? detected.iso : "",
            width: 18,
            height: 13,
            loading: "lazy",
            style: {
              borderRadius: 2,
              objectFit: "cover",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
              flex: "0 0 auto"
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: detected ? formatPhone(raw) : raw })
      ]
    }
  );
};
const EMAIL_ITEMS = [
  { type: "confirmation", label: __("Booking confirmation", "yatra"), group: "customer" },
  {
    type: "payment_confirmation",
    label: __("Payment confirmation", "yatra"),
    group: "customer",
    needsPayment: true
  },
  { type: "reminder", label: __("Trip reminder", "yatra"), group: "customer" },
  {
    type: "cancellation",
    label: __("Cancellation notice", "yatra"),
    group: "customer",
    statuses: ["cancelled"]
  },
  {
    type: "completed",
    label: __("Trip completed / thank-you", "yatra"),
    group: "customer",
    statuses: ["completed"]
  },
  { type: "admin_new_booking", label: __("New booking", "yatra"), group: "admin" },
  {
    type: "admin_payment_received",
    label: __("Payment received", "yatra"),
    group: "admin",
    needsPayment: true
  }
];
const ResendEmailMenu = ({
  bookingId,
  status = "",
  amountPaid = 0
}) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const mutation = useMutation({
    mutationFn: async (type) => {
      const res = await apiClient.post(`/bookings/${bookingId}/send-email`, {
        type
      });
      if (res && res.success === false) {
        throw new Error(res.message || __("Failed to send email.", "yatra"));
      }
      return res;
    },
    onSuccess: (res) => {
      showToast((res == null ? void 0 : res.message) || __("Email sent.", "yatra"), "success");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["booking-activity", bookingId] });
    },
    onError: (err) => {
      showToast((err == null ? void 0 : err.message) || __("Failed to send email.", "yatra"), "error");
    }
  });
  const paid = Number(amountPaid || 0) > 0;
  const items = EMAIL_ITEMS.filter((item) => {
    if (item.needsPayment && !paid) return false;
    if (item.statuses && !item.statuses.includes(status)) return false;
    return true;
  });
  const customerItems = items.filter((i) => i.group === "customer");
  const adminItems = items.filter((i) => i.group === "admin");
  const renderItem = (item) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      disabled: mutation.isPending,
      onClick: () => mutation.mutate(item.type),
      className: "w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed",
      children: item.label
    },
    item.type
  );
  const groupLabel = (text) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500", children: text });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-4 h-4" }),
      __("Resend Email", "yatra"),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-4 h-4" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { align: "end", className: "w-64 p-1", children: [
      customerItems.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        groupLabel(__("To customer", "yatra")),
        customerItems.map(renderItem)
      ] }),
      adminItems.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        groupLabel(__("To admin", "yatra")),
        adminItems.map(renderItem)
      ] }),
      mutation.isPending && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-2 text-xs text-gray-400", children: __("Sending…", "yatra") })
    ] })
  ] });
};
const TravelAgencyPanel = ({ bookingId, canEdit }) => {
  var _a, _b;
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = reactExports.useState(false);
  const [choice, setChoice] = reactExports.useState("0");
  const [saving, setSaving] = reactExports.useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["booking-travel-agency", bookingId],
    queryFn: async () => await apiClient.get(`/bookings/${bookingId}/travel-agency`),
    enabled: bookingId > 0
  });
  const agency = ((_a = data == null ? void 0 : data.data) == null ? void 0 : _a.agency) ?? null;
  const agencies = ((_b = data == null ? void 0 : data.data) == null ? void 0 : _b.agencies) ?? [];
  reactExports.useEffect(() => {
    setChoice(agency ? String(agency.id) : "0");
  }, [agency == null ? void 0 : agency.id]);
  if (isLoading || !agency && !canEdit && !isError) {
    return null;
  }
  if (isError) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-testid": "booking-travel-agency-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Briefcase, { className: "w-4 h-4" }),
        __("Travel Agency", "yatra")
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "text-sm text-gray-500 dark:text-gray-400", children: __("The travel agency for this booking could not be loaded.", "yatra") })
    ] });
  }
  const save = async () => {
    setSaving(true);
    try {
      await apiClient.post(`/bookings/${bookingId}/travel-agency`, { agency_id: Number(choice) });
      showToast(__("Saved.", "yatra"), "success");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["booking-travel-agency", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking-activity", bookingId] });
    } catch (e) {
      showToast((e == null ? void 0 : e.message) || __("Could not be saved.", "yatra"), "error");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-testid": "booking-travel-agency-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Briefcase, { className: "w-4 h-4" }),
      __("Travel Agency", "yatra")
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3 text-sm", children: !editing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      agency ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: agency.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-gray-600 dark:text-gray-300", children: [
          agency.contact_name ? `${agency.contact_name} · ` : "",
          agency.email
        ] }),
        agency.billing_email && agency.billing_email !== agency.email ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-gray-500 dark:text-gray-400", children: [
          __("Billing:", "yatra"),
          " ",
          agency.billing_email
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __("The contact details on this booking are the guest's.", "yatra") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-500 dark:text-gray-400", children: __("Not booked through an agency.", "yatra") }),
      canEdit && agencies.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", onClick: () => setEditing(true), children: agency ? __("Change", "yatra") : __("Link to an agency", "yatra") }) : null
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          value: choice,
          onChange: (e) => setChoice(e.target.value),
          "aria-label": __("Travel Agency", "yatra"),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "0", children: __("No agency", "yatra") }),
            agencies.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: a.id, children: a.name }, a.id))
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: save, disabled: saving, children: saving ? __("Saving…", "yatra") : __("Save", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => setEditing(false), children: __("Cancel", "yatra") })
      ] })
    ] }) })
  ] });
};
const money = (n, currency) => formatYatraMoney(Number(n) || 0, currency || "USD", { zeroAsUnknown: false });
const errorMessage = (e, fallback) => {
  var _a, _b;
  return ((_b = (_a = e == null ? void 0 : e.response) == null ? void 0 : _a.data) == null ? void 0 : _b.message) || (e == null ? void 0 : e.message) || fallback;
};
const useRefresh = (bookingId) => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["booking", String(bookingId)] });
    qc.invalidateQueries({ queryKey: ["booking", bookingId] });
    qc.invalidateQueries({ queryKey: ["booking-activity", bookingId] });
    qc.invalidateQueries({ queryKey: ["bookings"] });
  };
};
const METHODS = [
  { value: "bank_transfer", label: () => __("Bank transfer", "yatra") },
  { value: "cash", label: () => __("Cash", "yatra") },
  { value: "card_terminal", label: () => __("Card (terminal)", "yatra") },
  { value: "cheque", label: () => __("Cheque", "yatra") },
  { value: "other", label: () => __("Other", "yatra") }
];
const RecordPaymentButton = ({ bookingId, amountDue, currency }) => {
  const { showToast } = useToast();
  const refresh = useRefresh(bookingId);
  const [open, setOpen] = reactExports.useState(false);
  const [amount, setAmount] = reactExports.useState("");
  const [method, setMethod] = reactExports.useState("bank_transfer");
  const [reference, setReference] = reactExports.useState("");
  const [note, setNote] = reactExports.useState("");
  const start = () => {
    setAmount(amountDue > 0 ? amountDue.toFixed(2) : "");
    setMethod("bank_transfer");
    setReference("");
    setNote("");
    setOpen(true);
  };
  const mutation = useMutation({
    mutationFn: async () => apiClient.post(`/bookings/${bookingId}/payments`, {
      amount: Number(amount),
      status: "completed",
      gateway: method,
      payment_method: method,
      transaction_id: reference.trim() || void 0,
      notes: note.trim() || void 0
    }),
    onSuccess: () => {
      showToast(__("Payment recorded.", "yatra"), "success");
      setOpen(false);
      refresh();
    },
    onError: (e) => showToast(errorMessage(e, __("The payment could not be recorded.", "yatra")), "error")
  });
  const overDue = Number(amount) > Math.max(0, amountDue) + 9e-3;
  const valid = Number(amount) > 0 && !overDue;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: start, className: "flex items-center gap-2", "data-testid": "record-payment", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleDollarSign, { className: "w-4 h-4" }),
      __("Record payment", "yatra")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: open,
        onClose: () => setOpen(false),
        size: "sm",
        title: __("Record a payment", "yatra"),
        description: __(
          "Money you received outside online checkout — a bank transfer, cash at the office, a card terminal. The booking's balance and payment status update straight away, and the customer gets the payment receipt email if it is switched on.",
          "yatra"
        ),
        footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 w-full", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: __("Cancel", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { disabled: !valid || mutation.isPending, onClick: () => mutation.mutate(), "data-testid": "record-payment-submit", children: mutation.isPending ? __("Saving…", "yatra") : __("Record payment", "yatra") })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: sprintf(__("Amount (%s)", "yatra"), currency || "") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: "0", step: "0.01", value: amount, onChange: (e) => setAmount(e.target.value), "data-testid": "record-payment-amount" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs mt-1 ${overDue ? "text-red-600" : "text-gray-500"}`, "data-testid": "record-payment-hint", children: overDue ? sprintf(
              __("More than the balance due (%s). Use Adjust price first if the customer owes more.", "yatra"),
              money(Math.max(0, amountDue), currency)
            ) : sprintf(__("Balance due: %s", "yatra"), money(amountDue, currency)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Paid by", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "select",
              {
                className: "w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm",
                value: method,
                onChange: (e) => setMethod(e.target.value),
                children: METHODS.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: m.value, children: m.label() }, m.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Reference (optional)", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: reference, onChange: (e) => setReference(e.target.value), placeholder: __("e.g. bank reference or receipt number", "yatra") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Note (optional)", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: note, onChange: (e) => setNote(e.target.value) })
          ] })
        ] })
      }
    )
  ] });
};
const PaymentLinkButton = ({ bookingId, amountDue, currency }) => {
  var _a;
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = reactExports.useState(false);
  const [amount, setAmount] = reactExports.useState("");
  const [note, setNote] = reactExports.useState("");
  const [sendEmail, setSendEmail] = reactExports.useState(true);
  const [created, setCreated] = reactExports.useState("");
  const links = useQuery({
    queryKey: ["booking-payment-links", bookingId],
    queryFn: async () => {
      const res = await apiClient.get(`/bookings/${bookingId}/payment-links`);
      return {
        rows: (res == null ? void 0 : res.data) || [],
        // Older Free builds don't send it: assume payable.
        canPayOnline: (res == null ? void 0 : res.can_pay_online) !== false
      };
    },
    enabled: open
  });
  const rows = ((_a = links.data) == null ? void 0 : _a.rows) || [];
  const canPayOnline = links.data ? links.data.canPayOnline : true;
  const requested = rows.filter((l) => l.status === "open").reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const requestable = Math.max(0, Math.max(0, amountDue) - requested);
  reactExports.useEffect(() => {
    if (open && links.data && !created && requested > 0 && amount === (amountDue > 0 ? amountDue.toFixed(2) : "")) {
      setAmount(requestable > 0 ? requestable.toFixed(2) : "");
    }
  }, [open, links.data]);
  const start = () => {
    setAmount(amountDue > 0 ? amountDue.toFixed(2) : "");
    setNote("");
    setSendEmail(true);
    setCreated("");
    setOpen(true);
  };
  const create = useMutation({
    mutationFn: async () => apiClient.post(`/bookings/${bookingId}/payment-links`, {
      amount: Number(amount),
      note: note.trim(),
      send_email: sendEmail
    }),
    onSuccess: (res) => {
      setCreated(String((res == null ? void 0 : res.url) || ""));
      showToast(sendEmail ? __("Payment link created and emailed.", "yatra") : __("Payment link created.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["booking-payment-links", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking-activity", bookingId] });
    },
    onError: (e) => showToast(errorMessage(e, __("The payment link could not be created.", "yatra")), "error")
  });
  const cancel = useMutation({
    mutationFn: async (id) => apiClient.delete(`/bookings/${bookingId}/payment-links/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-payment-links", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking-activity", bookingId] });
    },
    onError: (e) => showToast(errorMessage(e, __("The link could not be cancelled.", "yatra")), "error")
  });
  const n = Number(amount);
  const over = n > requestable + 9e-3;
  const valid = n > 0 && !over && canPayOnline;
  const statusLabel = (s) => s === "paid" ? __("Paid", "yatra") : s === "cancelled" ? __("Cancelled", "yatra") : s === "expired" ? __("Expired", "yatra") : __("Waiting for payment", "yatra");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "outline",
        onClick: start,
        className: "flex items-center gap-2",
        disabled: amountDue <= 0,
        "data-testid": "payment-link",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "w-4 h-4" }),
          __("Payment link", "yatra")
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: open,
        onClose: () => setOpen(false),
        size: "sm",
        title: __("Request a payment", "yatra"),
        description: __(
          "A link the customer opens to pay this amount by card or PayPal — part of the balance or all of it. It works once and expires after 14 days.",
          "yatra"
        ),
        footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 w-full", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: __("Close", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { disabled: !valid || create.isPending, onClick: () => create.mutate(), "data-testid": "payment-link-create", children: create.isPending ? __("Creating…", "yatra") : __("Create link", "yatra") })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `payment-link-amount-${bookingId}`, children: __("Amount", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: `payment-link-amount-${bookingId}`,
                type: "number",
                min: "0",
                step: "0.01",
                value: amount,
                onChange: (e) => setAmount(e.target.value),
                "data-testid": "payment-link-amount"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs mt-1 ${over ? "text-red-600" : "text-gray-500"}`, children: over ? requested > 0 ? sprintf(
              __("Open links already ask for %1$s. You can ask for at most %2$s more.", "yatra"),
              money(requested, currency),
              money(requestable, currency)
            ) : sprintf(__("More than the balance due (%s).", "yatra"), money(Math.max(0, amountDue), currency)) : requested > 0 ? sprintf(
              __("Balance due: %1$s · already requested by open links: %2$s", "yatra"),
              money(amountDue, currency),
              money(requested, currency)
            ) : sprintf(__("Balance due: %s", "yatra"), money(amountDue, currency)) })
          ] }),
          !canPayOnline && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              className: "rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
              role: "alert",
              "data-testid": "payment-link-no-gateway",
              children: __(
                "No online payment method is turned on, so the customer could not pay a link. Turn on a card or PayPal payment method in Settings → Payments first.",
                "yatra"
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `payment-link-note-${bookingId}`, children: __("Message to the customer (optional)", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: `payment-link-note-${bookingId}`, value: note, onChange: (e) => setNote(e.target.value), placeholder: __("e.g. Second instalment", "yatra") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: sendEmail, onChange: (e) => setSendEmail(e.target.checked) }),
            __("Email the link to the customer", "yatra")
          ] }),
          created && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-green-200 bg-green-50 p-2 text-xs dark:border-green-800 dark:bg-green-900/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-green-800 dark:text-green-300 mb-1", children: __("Link created", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "flex-1 break-all", "data-testid": "payment-link-url", children: created }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outline",
                  onClick: async () => {
                    try {
                      await navigator.clipboard.writeText(created);
                      showToast(__("Copied.", "yatra"), "success");
                    } catch {
                      showToast(__("Couldn't copy — copy manually.", "yatra"), "error");
                    }
                  },
                  children: __("Copy", "yatra")
                }
              )
            ] })
          ] }),
          rows.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-gray-600 dark:text-gray-300 mb-1", children: __("Links for this booking", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1", "data-testid": "payment-link-list", children: rows.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between gap-2 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                money(l.amount, currency),
                " · ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-500", children: statusLabel(l.status) })
              ] }),
              l.status === "open" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "text-xs text-red-600 hover:underline",
                  onClick: () => cancel.mutate(l.id),
                  children: __("Cancel", "yatra")
                }
              )
            ] }, l.id)) })
          ] })
        ] })
      }
    )
  ] });
};
const AdjustPriceButton = ({ bookingId, total, currency }) => {
  const { showToast } = useToast();
  const refresh = useRefresh(bookingId);
  const [open, setOpen] = reactExports.useState(false);
  const [kind, setKind] = reactExports.useState("discount");
  const [amount, setAmount] = reactExports.useState("");
  const [reason, setReason] = reactExports.useState("");
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/bookings/${bookingId}/adjustments`, {
        kind,
        amount: Number(amount),
        reason: reason.trim()
      });
      if (res && res.success === false) throw new Error(res.message);
      return res;
    },
    onSuccess: (res) => {
      showToast((res == null ? void 0 : res.message) || __("Price updated.", "yatra"), "success");
      setOpen(false);
      setAmount("");
      setReason("");
      refresh();
    },
    onError: (e) => showToast(errorMessage(e, __("The price could not be changed.", "yatra")), "error")
  });
  const n = Number(amount);
  const newTotal = kind === "discount" ? total - n : total + n;
  const valid = n > 0 && reason.trim() !== "" && (kind === "surcharge" || n <= total);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => setOpen(true), className: "flex items-center gap-2", "data-testid": "adjust-price", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Percent, { className: "w-4 h-4" }),
      __("Adjust price", "yatra")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: open,
        onClose: () => setOpen(false),
        size: "sm",
        title: __("Adjust the price", "yatra"),
        description: __(
          "Give a discount or add a surcharge after the booking was made. The total, balance due and payment status update, and the change is kept in the booking history with your reason.",
          "yatra"
        ),
        footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 w-full", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: __("Cancel", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { disabled: !valid || mutation.isPending, onClick: () => mutation.mutate(), "data-testid": "adjust-price-submit", children: mutation.isPending ? __("Saving…", "yatra") : __("Apply", "yatra") })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: ["discount", "surcharge"].map((k) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setKind(k),
              className: `flex-1 rounded-md border px-3 py-2 text-sm ${kind === k ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" : "border-gray-200 dark:border-gray-700"}`,
              children: k === "discount" ? __("Discount", "yatra") : __("Surcharge", "yatra")
            },
            k
          )) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: sprintf(__("Amount (%s)", "yatra"), currency || "") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: "0", step: "0.01", value: amount, onChange: (e) => setAmount(e.target.value), "data-testid": "adjust-price-amount" }),
            n > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 mt-1", children: sprintf(__("New total: %1$s (was %2$s)", "yatra"), money(newTotal, currency), money(total, currency)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Reason", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: reason, onChange: (e) => setReason(e.target.value), placeholder: __("e.g. Repeat customer, single room", "yatra"), "data-testid": "adjust-price-reason" })
          ] })
        ] })
      }
    )
  ] });
};
const RefundPaymentButton = ({ bookingId, paymentId, maxAmount, currency, gatewayRefundAvailable, gatewayLabel }) => {
  const { showToast } = useToast();
  const refresh = useRefresh(bookingId);
  const [open, setOpen] = reactExports.useState(false);
  const [amount, setAmount] = reactExports.useState("");
  const [reason, setReason] = reactExports.useState("");
  const [throughGateway, setThroughGateway] = reactExports.useState(false);
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/payments/${paymentId}/refund`, {
        amount: Number(amount),
        reason: reason.trim(),
        through_gateway: Boolean(gatewayRefundAvailable && throughGateway)
      });
      if (res && res.success === false) throw new Error(res.message);
      return res;
    },
    onSuccess: (res) => {
      showToast(
        (res == null ? void 0 : res.message) || ((res == null ? void 0 : res.through_gateway) ? __("Refund sent to the customer and recorded.", "yatra") : __("Refund recorded.", "yatra")),
        (res == null ? void 0 : res.pending) ? "warning" : "success"
      );
      setOpen(false);
      refresh();
    },
    onError: (e) => showToast(errorMessage(e, __("The refund could not be recorded.", "yatra")), "error")
  });
  const n = Number(amount);
  const valid = n > 0 && n <= maxAmount;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ConditionalRender, { capability: "yatra_refund_bookings", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        className: "text-xs text-red-600 hover:underline dark:text-red-400",
        onClick: () => {
          setAmount(maxAmount.toFixed(2));
          setReason("");
          setThroughGateway(false);
          setOpen(true);
        },
        "data-testid": `refund-payment-${paymentId}`,
        children: __("Refund", "yatra")
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: open,
        onClose: () => setOpen(false),
        size: "sm",
        title: __("Refund", "yatra"),
        description: gatewayRefundAvailable && throughGateway ? sprintf(
          __(
            "Sends the money back to the customer through %s, then records the refund in the booking's ledger. The original payment is kept.",
            "yatra"
          ),
          gatewayLabel || __("the payment provider", "yatra")
        ) : __(
          "Records money you sent back to the customer. Send the money itself from your payment provider or bank — Yatra keeps the original payment and adds the refund to the booking's ledger.",
          "yatra"
        ),
        footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 w-full", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: __("Cancel", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { disabled: !valid || mutation.isPending, onClick: () => mutation.mutate(), "data-testid": "refund-submit", children: mutation.isPending ? __("Saving…", "yatra") : gatewayRefundAvailable && throughGateway ? __("Refund now", "yatra") : __("Record refund", "yatra") })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: sprintf(__("Amount (%s)", "yatra"), currency || "") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: "0", step: "0.01", value: amount, onChange: (e) => setAmount(e.target.value), "data-testid": "refund-amount" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 mt-1", children: sprintf(__("Up to %s", "yatra"), money(maxAmount, currency)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Reason", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: reason, onChange: (e) => setReason(e.target.value), "data-testid": "refund-reason" })
          ] }),
          gatewayRefundAvailable && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-2 text-sm cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                className: "mt-0.5",
                checked: throughGateway,
                onChange: (e) => setThroughGateway(e.target.checked),
                "data-testid": "refund-through-gateway"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              sprintf(
                __("Send the money back through %s", "yatra"),
                gatewayLabel || __("the payment provider", "yatra")
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-gray-500", children: __("Untick if you already refunded it yourself and only want to record it.", "yatra") })
            ] })
          ] })
        ] })
      }
    )
  ] });
};
const ICONS = {
  created: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-3.5 h-3.5" }),
  payment: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleDollarSign, { className: "w-3.5 h-3.5" }),
  refund: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownLeft, { className: "w-3.5 h-3.5" }),
  status_changed: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCcw, { className: "w-3.5 h-3.5" }),
  email_sent: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-3.5 h-3.5" }),
  note: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "w-3.5 h-3.5" }),
  price_adjusted: /* @__PURE__ */ jsxRuntimeExports.jsx(Percent, { className: "w-3.5 h-3.5" }),
  edited: /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "w-3.5 h-3.5" }),
  expired: /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "w-3.5 h-3.5" }),
  customer_request: /* @__PURE__ */ jsxRuntimeExports.jsx(Inbox, { className: "w-3.5 h-3.5" })
};
const COLORS = {
  payment: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  refund: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  note: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  expired: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  customer_request: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
};
const CustomerRequestsCard = ({ bookingId, requests }) => {
  const { showToast } = useToast();
  const refresh = useRefresh(bookingId);
  const open = (requests || []).filter((r) => r.status === "open");
  const resolve = useMutation({
    mutationFn: async (requestId) => {
      const res = await apiClient.post(
        `/bookings/${bookingId}/requests/${requestId}/resolve`,
        {}
      );
      if (res && res.success === false) throw new Error(res.message);
      return res;
    },
    onSuccess: (res) => {
      showToast((res == null ? void 0 : res.message) || __("Request marked as resolved.", "yatra"), "success");
      refresh();
    },
    onError: (e) => showToast(errorMessage(e, __("The request could not be updated.", "yatra")), "error")
  });
  if (open.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      className: "border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/10",
      "data-testid": "customer-requests-card",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Inbox, { className: "w-4 h-4" }),
          __("Customer requests", "yatra")
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
          open.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "rounded-md border border-blue-100 dark:border-blue-900 bg-white dark:bg-gray-800 p-3",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: r.type === "cancel" ? __("Cancellation requested", "yatra") : __("Change requested", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: r.created_at })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_edit_bookings", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      size: "sm",
                      variant: "outline",
                      disabled: resolve.isPending,
                      onClick: () => resolve.mutate(r.id),
                      "data-testid": `resolve-request-${r.id}`,
                      children: __("Mark as resolved", "yatra")
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line", children: r.message })
              ]
            },
            r.id
          )),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
            "Nothing has been changed yet. Cancel, refund or edit the booking as your policy allows, reply to the customer, then mark the request as resolved.",
            "yatra"
          ) })
        ] })
      ]
    }
  );
};
const BookingActivityCard = ({ bookingId }) => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [note, setNote] = reactExports.useState("");
  const [showAll, setShowAll] = reactExports.useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["booking-activity", bookingId],
    queryFn: async () => {
      const res = await apiClient.get(`/bookings/${bookingId}/activity`);
      return (res == null ? void 0 : res.data) ?? [];
    },
    enabled: bookingId > 0
  });
  const addNote = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/bookings/${bookingId}/notes`, { note: note.trim() });
      if (res && res.success === false) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      setNote("");
      qc.invalidateQueries({ queryKey: ["booking-activity", bookingId] });
    },
    onError: (e) => showToast(errorMessage(e, __("The note could not be saved.", "yatra")), "error")
  });
  const events = reactExports.useMemo(() => data ?? [], [data]);
  const shown = reactExports.useMemo(() => showAll ? events : events.slice(0, 8), [events, showAll]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-testid": "booking-activity-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-4 h-4" }),
      __("History & notes", "yatra")
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_edit_bookings", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: note,
            onChange: (e) => setNote(e.target.value),
            rows: 2,
            placeholder: __("Add an internal note — only your team sees it", "yatra"),
            className: "flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm",
            "data-testid": "booking-note-input"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            size: "sm",
            disabled: note.trim() === "" || addNote.isPending,
            onClick: () => addNote.mutate(),
            className: "self-start flex items-center gap-1",
            "data-testid": "booking-note-add",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
              __("Add", "yatra")
            ]
          }
        )
      ] }) }),
      isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-500", children: __("Loading…", "yatra") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "relative border-l border-gray-200 dark:border-gray-700 ml-2 space-y-3", children: shown.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "ml-4", "data-testid": `activity-${e.type}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: `absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ${COLORS[e.type] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`,
            children: ICONS[e.type] || /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-3.5 h-3.5" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-sm ${e.type === "note" ? "rounded-md bg-amber-50 dark:bg-amber-900/10 px-2 py-1" : ""} text-gray-900 dark:text-white whitespace-pre-line`, children: e.message }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: [
          e.at,
          e.author ? ` · ${e.author}` : ""
        ] })
      ] }, e.id)) }),
      events.length > 8 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "text-xs text-blue-600 hover:underline", onClick: () => setShowAll(!showAll), children: showAll ? __("Show less", "yatra") : sprintf(__("Show all %d entries", "yatra"), events.length) })
    ] })
  ] });
};
const optionLabel = (field, value) => {
  const raw = String(value ?? "");
  if ((field == null ? void 0 : field.type) === "select" && Array.isArray(field.options)) {
    const match = field.options.find((o) => String(o.value) === raw);
    if (match == null ? void 0 : match.label) return match.label;
  }
  return raw;
};
const ViewBooking = () => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  const { can } = usePermissions();
  const bookingId = reactExports.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") ? parseInt(params.get("id") || "0") : null;
  }, []);
  const getFieldLabel = (fieldId, fields) => {
    const field = fields.find((f) => f.id === fieldId);
    return (field == null ? void 0 : field.label) || fieldId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };
  const {
    data: booking,
    isLoading,
    error
  } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      var _a2, _b2;
      if (!bookingId) return null;
      const result = await apiService.getBooking(bookingId);
      if (!result) {
        throw new Error("Failed to fetch booking");
      }
      const data = (result == null ? void 0 : result.data) ?? result;
      if (data && data.id) {
        const contact = data.contact || {};
        return {
          id: data.id,
          booking_number: data.reference,
          customer_name: data.customer_name || (((_a2 = data.contact) == null ? void 0 : _a2.first_name) && ((_b2 = data.contact) == null ? void 0 : _b2.last_name) ? `${data.contact.first_name} ${data.contact.last_name}`.trim() : `${data.contact_first_name || ""} ${data.contact_last_name || ""}`.trim()) || "N/A",
          customer_email: data.customer_email || data.contact_email || contact.email || "",
          customer_phone: data.customer_phone || data.contact_phone || contact.phone || "",
          customer_country: data.contact_country || contact.country || "",
          trip_id: data.trip_id,
          trip_title: data.trip_title || `Trip #${data.trip_id}`,
          trip_image: data.trip_image,
          trip_price: (parseFloat(data.subtotal) || data.total_amount || 0) / (data.travelers_count || 1),
          booking_date: data.created_at,
          travel_date: data.travel_date,
          travelers: data.travelers_count,
          travelers_data: data.travelers || [],
          total_amount: data.total_amount,
          amount_paid: data.amount_paid || 0,
          amount_due: data.amount_due || 0,
          // Set by Yatra Pro's Scheduled Payments module; absent otherwise.
          payment_schedule: data.payment_schedule || null,
          discount_amount: data.discount_amount || 0,
          discount_code: data.discount_code || null,
          // Discounts / surcharges added on this screen after booking.
          price_adjustments: Array.isArray(data.price_adjustments) ? data.price_adjustments : [],
          customer_requests: Array.isArray(data.customer_requests) ? data.customer_requests : [],
          currency: data.currency || "USD",
          // Tax fields
          subtotal: data.subtotal,
          tax_amount: data.tax_amount,
          tax_rate: data.tax_rate,
          tax_inclusive: data.tax_inclusive,
          tax_details: data.tax_details,
          tax_breakdown: data.tax_breakdown,
          taxable_amount: data.taxable_amount,
          // Itinerary costs
          itinerary_costs: data.itinerary_costs,
          itinerary_costs_total: data.itinerary_costs_total,
          // Additional services
          additional_services: data.additional_services,
          services_total: data.services_total,
          // End tax fields
          payment_status: data.payment_status,
          booking_status: data.status,
          payment_method: data.payment_gateway_label || data.payment_gateway,
          payment_date: data.payment_date,
          notes: data.special_requests,
          pickup_point: data.pickup_point || null,
          accommodation: data.accommodation || null,
          travel_insurance: data.travel_insurance || null,
          internal_notes: data.internal_notes,
          emergency_contact: data.emergency_contact,
          contact_data: data.contact_data,
          payments: data.payments || [],
          net_received: data.net_received,
          total_received: data.total_received,
          total_refunded: data.total_refunded,
          created_at: data.created_at,
          updated_at: data.updated_at,
          confirmed_at: data.confirmed_at,
          completed_at: data.completed_at,
          cancelled_at: data.cancelled_at,
          cancellation_reason: data.cancellation_reason,
          trip_details: data.trip_details,
          google_calendar: data.google_calendar
        };
      }
      return null;
    },
    enabled: !!bookingId && can("yatra_view_bookings")
  });
  const bookingTripId = (booking == null ? void 0 : booking.trip_id) ? Number(booking.trip_id) : null;
  const { data: formConfig } = useQuery({
    queryKey: ["booking-form-config", bookingTripId],
    queryFn: async () => {
      var _a2;
      const response = await apiService.getBookingFormConfig(bookingTripId);
      return ((_a2 = response == null ? void 0 : response.data) == null ? void 0 : _a2.booking_form_config) || (response == null ? void 0 : response.booking_form_config) || null;
    },
    enabled: !!booking
  });
  const travelerFields = reactExports.useMemo(() => {
    var _a2;
    if (!((_a2 = formConfig == null ? void 0 : formConfig.traveler_form) == null ? void 0 : _a2.fields)) return [];
    return formConfig.traveler_form.fields.filter((field) => field.enabled).sort((a, b) => a.order - b.order);
  }, [formConfig]);
  const emergencyFields = reactExports.useMemo(() => {
    var _a2;
    if (!((_a2 = formConfig == null ? void 0 : formConfig.emergency_contact_form) == null ? void 0 : _a2.fields)) return [];
    return formConfig.emergency_contact_form.fields.filter((field) => field.enabled).sort((a, b) => a.order - b.order);
  }, [formConfig]);
  const contactFields = reactExports.useMemo(() => {
    var _a2;
    if (!((_a2 = formConfig == null ? void 0 : formConfig.contact_form) == null ? void 0 : _a2.fields)) return [];
    return formConfig.contact_form.fields.filter((field) => field.enabled).sort((a, b) => a.order - b.order);
  }, [formConfig]);
  const isPro = !!((_a = window.yatraAdmin) == null ? void 0 : _a.isPro);
  const tripConsentOn = !!((_b = window.yatraAdmin) == null ? void 0 : _b.tripConsentEnabled);
  const { data: consentStatus } = useQuery({
    queryKey: ["booking-consent-status", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const response = await apiClient.get(
        `/bookings/${bookingId}/consent-status`
      );
      return (response == null ? void 0 : response.data) || null;
    },
    enabled: !!bookingId && isPro && tripConsentOn
  });
  const formatDate$1 = (dateString) => {
    return formatDate(dateString);
  };
  const formatPrice = (price, currencyCode = "USD") => formatYatraMoney(Number(price) || 0, currencyCode, {
    zeroAsUnknown: false
  });
  const getBookingStatusBadge = (status) => {
    const statusMap = {
      confirmed: {
        className: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: __("Confirmed", "yatra")
      },
      pending: {
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        label: __("Pending", "yatra")
      },
      cancelled: {
        className: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        label: __("Cancelled", "yatra")
      },
      completed: {
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        label: __("Completed", "yatra")
      }
    };
    const statusInfo = statusMap[status] || {
      className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
      label: status
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        className: `inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${statusInfo.className}`,
        children: statusInfo.label
      }
    );
  };
  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      paid: {
        className: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: __("Paid", "yatra")
      },
      pending: {
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        label: __("Pending", "yatra")
      },
      partial: {
        className: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
        label: __("Partial", "yatra")
      },
      refunded: {
        className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
        label: __("Refunded", "yatra")
      }
    };
    const statusInfo = statusMap[status] || {
      className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
      label: status
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        className: `inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${statusInfo.className}`,
        children: statusInfo.label
      }
    );
  };
  const handleBack = () => {
    var _a2;
    window.location.href = `${((_a2 = window.yatraAdmin) == null ? void 0 : _a2.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=bookings`;
  };
  const handleEdit = () => {
    var _a2;
    window.location.href = `${((_a2 = window.yatraAdmin) == null ? void 0 : _a2.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=bookings&action=edit&id=${bookingId}`;
  };
  const [invoiceError, setInvoiceError] = reactExports.useState("");
  const handleDownloadInvoice = async () => {
    const id = Number((booking == null ? void 0 : booking.id) ?? 0);
    if (!id) {
      return;
    }
    setInvoiceError("");
    try {
      await downloadAdminBookingInvoice(id);
    } catch (error2) {
      setInvoiceError(
        (error2 == null ? void 0 : error2.message) || __("Failed to download invoice", "yatra")
      );
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-48" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-64" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-28" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-20" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-36" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-20 rounded-md" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-16 rounded-md" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [...Array(6)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-32" })
            ] }, i)) }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-40" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-36" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-48" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-32" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-16" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-20 w-full" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-36" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-16 rounded-md" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-28" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-32" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-20" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-28" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-20" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-16" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-40" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-40" })
              ] })
            ] })
          ] })
        ] })
      ] })
    ] });
  }
  if (error || !booking) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        PageHeader,
        {
          title: __("Booking Not Found", "yatra"),
          description: __(
            "The booking you are looking for does not exist",
            "yatra"
          ),
          actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              onClick: handleBack,
              className: "flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4" }),
                __("Back to Bookings", "yatra")
              ]
            }
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-8 text-center text-red-500", children: __("Error loading booking or booking not found", "yatra") }) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        title: __("Booking Details", "yatra"),
        description: __("View complete booking information", "yatra"),
        actions: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_view_bookings", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              onClick: handleDownloadInvoice,
              className: "flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4" }),
                __("Download invoice", "yatra")
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_edit_bookings", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            RecordPaymentButton,
            {
              bookingId: Number(booking.id),
              amountDue: Number(booking.amount_due) || 0,
              currency: booking.currency
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_edit_bookings", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PaymentLinkButton,
            {
              bookingId: Number(booking.id),
              amountDue: Number(booking.amount_due) || 0,
              currency: booking.currency
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_edit_bookings", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            AdjustPriceButton,
            {
              bookingId: Number(booking.id),
              total: Number(booking.total_amount) || 0,
              currency: booking.currency
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_edit_bookings", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            ResendEmailMenu,
            {
              bookingId: Number(booking.id),
              status: booking.booking_status,
              amountPaid: Number(booking.amount_paid) || 0
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_edit_bookings", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleEdit, className: "flex items-center gap-2", children: __("Edit Booking", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              onClick: handleBack,
              className: "flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4" }),
                __("Back", "yatra")
              ]
            }
          )
        ] })
      }
    ),
    invoiceError && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        role: "alert",
        className: "flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }),
          invoiceError
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_view_bookings", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Booking Overview", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400", children: [
                __("Booking", "yatra"),
                getBookingStatusBadge(booking.booking_status)
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400", children: [
                __("Payment", "yatra"),
                getPaymentStatusBadge(booking.payment_status)
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Booking Number", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: booking.booking_number })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Trip", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: booking.trip_title }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: [
                  __("Trip ID", "yatra"),
                  ": #",
                  booking.trip_id
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3 h-3" }),
                  __("Booking Date", "yatra")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatDate$1(booking.booking_date) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3 h-3" }),
                  __("Travel Date", "yatra")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatDate$1(booking.travel_date) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-3 h-3" }),
                  __("Number of Travelers", "yatra")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-gray-900 dark:text-white", children: [
                  booking.travelers,
                  " ",
                  booking.travelers === 1 ? __("Traveler", "yatra") : __("Travelers", "yatra")
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 pt-4 border-t border-gray-200 dark:border-gray-700", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-3", children: __("Payment Summary", "yatra") }),
              (() => {
                const adjustmentsNet = (Array.isArray(booking.price_adjustments) ? booking.price_adjustments : []).reduce(
                  (sum, a) => sum + ((a == null ? void 0 : a.type) === "discount" ? -1 : 1) * (Number(a == null ? void 0 : a.amount) || 0),
                  0
                );
                const dbSubtotal = parseFloat(booking.subtotal) || (booking.total_amount || 0) - adjustmentsNet || 0;
                const discountAmount = booking.discount_amount || 0;
                const itineraryCostsTotal = parseFloat(booking.itinerary_costs_total) || 0;
                const taxAmount = parseFloat(booking.tax_amount) || 0;
                const taxInclusiveRaw = booking.tax_inclusive;
                const taxInclusive = taxInclusiveRaw === true || parseInt(String(taxInclusiveRaw), 10) === 1;
                const totalAmount = booking.total_amount || 0;
                const amountPaid = booking.amount_paid || 0;
                const amountDue = booking.amount_due || 0;
                let taxLines = [];
                const taxBreakdownRaw = booking.tax_breakdown;
                if (Array.isArray(taxBreakdownRaw) && taxBreakdownRaw.length > 0) {
                  taxLines = taxBreakdownRaw;
                } else {
                  const taxDetailsRaw = booking.tax_details;
                  if (taxDetailsRaw) {
                    try {
                      const parsed = typeof taxDetailsRaw === "string" ? JSON.parse(taxDetailsRaw) : taxDetailsRaw;
                      if (Array.isArray(parsed) && parsed.length > 0)
                        taxLines = parsed;
                    } catch (_) {
                    }
                  }
                  if (taxLines.length === 0 && taxAmount > 0) {
                    taxLines = [
                      {
                        name: __("Tax", "yatra"),
                        rate: parseFloat(booking.tax_rate) || 0,
                        amount: taxAmount
                      }
                    ];
                  }
                }
                let itineraryCosts = [];
                const itineraryCostsRaw = booking.itinerary_costs;
                if (typeof itineraryCostsRaw === "string") {
                  try {
                    itineraryCosts = JSON.parse(itineraryCostsRaw);
                  } catch (_) {
                  }
                } else if (Array.isArray(itineraryCostsRaw)) {
                  itineraryCosts = itineraryCostsRaw;
                }
                const rawServices = booking.additional_services;
                const selectedServices = Array.isArray(rawServices) ? rawServices.filter((s) => (s == null ? void 0 : s.selected) !== false) : [];
                const getServiceAmt = (s) => parseFloat(
                  (s == null ? void 0 : s.total_price) ?? (s == null ? void 0 : s.calculated_price) ?? (s == null ? void 0 : s.total_cost) ?? (s == null ? void 0 : s.amount) ?? (s == null ? void 0 : s.unit_price) ?? (s == null ? void 0 : s.price) ?? 0
                );
                const servicesTotal = selectedServices.reduce(
                  (sum, s) => sum + getServiceAmt(s),
                  0
                );
                const baseTripCost = dbSubtotal - servicesTotal;
                const taxableAmount = Math.max(0, dbSubtotal - discountAmount) + itineraryCostsTotal;
                const hasServices = selectedServices.length > 0;
                const hasDiscount = discountAmount > 0;
                const hasItinerary = itineraryCosts.length > 0 && itineraryCostsTotal > 0;
                const hasTax = taxLines.length > 0;
                const showTaxableRow = hasTax && (hasDiscount || hasItinerary);
                const Row = ({
                  label,
                  value,
                  sub = false,
                  green = false,
                  bold = false
                }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: `flex justify-between text-sm${sub ? " ml-4" : ""}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          className: bold ? "font-semibold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400",
                          children: label
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          className: bold ? "font-semibold text-gray-900 dark:text-white" : green ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white",
                          children: value
                        }
                      )
                    ]
                  }
                );
                return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-600 dark:text-gray-400 flex items-center gap-1.5", children: [
                      __("Trip Base Price", "yatra"),
                      taxInclusive && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", children: __("Tax Incl.", "yatra") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: formatPrice(baseTripCost, booking.currency) })
                  ] }),
                  hasServices && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        "+ ",
                        __("Additional Services", "yatra")
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", {})
                    ] }),
                    selectedServices.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Row,
                      {
                        sub: true,
                        label: (s == null ? void 0 : s.service_name) || (s == null ? void 0 : s.name) || (s == null ? void 0 : s.title) || (s == null ? void 0 : s.label) || __("Service", "yatra"),
                        value: formatPrice(
                          getServiceAmt(s),
                          booking.currency
                        )
                      },
                      i
                    )),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm font-semibold border-t border-gray-200 dark:border-gray-600 pt-1.5 mt-0.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: __("Gross Total", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: formatPrice(dbSubtotal, booking.currency) })
                    ] })
                  ] }),
                  hasDiscount && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Row,
                    {
                      label: __("Discount", "yatra"),
                      value: `-${formatPrice(discountAmount, booking.currency)}`,
                      green: true
                    }
                  ),
                  hasItinerary && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        "+ ",
                        __("Itinerary Costs", "yatra")
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", {})
                    ] }),
                    itineraryCosts.map((cost, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Row,
                      {
                        sub: true,
                        label: `${cost.name} ${cost.price_per === "person" ? __("(per person)", "yatra") : cost.price_per === "group" ? __("(per booking)", "yatra") : __("(flat rate)", "yatra")}`,
                        value: formatPrice(
                          cost.total_cost ?? cost.price,
                          booking.currency
                        )
                      },
                      i
                    ))
                  ] }),
                  !taxInclusive && showTaxableRow && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm font-semibold border-t border-dashed border-gray-300 dark:border-gray-600 pt-1.5 mt-0.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-700 dark:text-gray-300", children: __("Taxable Amount", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: formatPrice(taxableAmount, booking.currency) })
                  ] }),
                  hasTax && !taxInclusive && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        "+ ",
                        __("Tax", "yatra")
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", {})
                    ] }),
                    taxLines.map((tax, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "flex justify-between text-sm ml-4",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-600 dark:text-gray-400", children: [
                            tax.name,
                            tax.rate > 0 ? ` (${tax.rate}%)` : ""
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-900 dark:text-white", children: [
                            "+",
                            formatPrice(
                              parseFloat(tax.amount) || 0,
                              booking.currency
                            )
                          ] })
                        ]
                      },
                      i
                    ))
                  ] }),
                  Array.isArray(booking.price_adjustments) && booking.price_adjustments.map(
                    (adj, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Row,
                      {
                        label: (adj.type === "discount" ? __("Price adjustment: discount", "yatra") : __("Price adjustment: surcharge", "yatra")) + (adj.reason ? ` (${adj.reason})` : ""),
                        value: `${adj.type === "discount" ? "-" : "+"}${formatPrice(
                          Number(adj.amount) || 0,
                          booking.currency
                        )}`,
                        green: adj.type === "discount"
                      },
                      `adj-${i}`
                    )
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-base font-bold border-t-2 border-gray-800 dark:border-gray-300 pt-2 mt-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: __("Net Amount", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: formatPrice(totalAmount, booking.currency) })
                  ] }),
                  hasTax && taxInclusive && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 space-y-0.5", children: taxLines.map((tax, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: "text-xs text-gray-400 dark:text-gray-500 italic",
                      children: [
                        __("Incl.", "yatra"),
                        " ",
                        tax.name,
                        tax.rate > 0 ? ` (${tax.rate}%)` : "",
                        ":",
                        " ",
                        formatPrice(
                          parseFloat(tax.amount) || 0,
                          booking.currency
                        )
                      ]
                    },
                    i
                  )) }),
                  Number(booking.total_refunded) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Row,
                      {
                        label: __("Received", "yatra"),
                        value: formatPrice(Number(booking.total_received) || 0, booking.currency)
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Row,
                      {
                        label: __("Refunded", "yatra"),
                        value: `-${formatPrice(Number(booking.total_refunded) || 0, booking.currency)}`
                      }
                    )
                  ] }),
                  amountPaid > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Row,
                    {
                      label: Number(booking.total_refunded) > 0 ? __("Amount Paid (after refunds)", "yatra") : __("Amount Paid", "yatra"),
                      value: formatPrice(amountPaid, booking.currency),
                      green: true
                    }
                  ),
                  amountDue > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm font-semibold", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-orange-600 dark:text-orange-400", children: __("Due Now", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-orange-600 dark:text-orange-400", children: formatPrice(amountDue, booking.currency) })
                  ] }),
                  (() => {
                    const sched = booking.payment_schedule;
                    if (!(sched == null ? void 0 : sched.next_due_date)) return null;
                    const items = Array.isArray(sched.installments) ? sched.installments : [];
                    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "span",
                          {
                            className: sched.is_overdue ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-600 dark:text-gray-300",
                            children: sched.is_overdue ? __("Overdue since", "yatra") : __("Next payment due", "yatra")
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "span",
                          {
                            className: sched.is_overdue ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-900 dark:text-white",
                            children: formatDate(sched.next_due_date)
                          }
                        )
                      ] }),
                      items.length > 1 && items.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "div",
                        {
                          className: "flex justify-between text-xs text-gray-500 dark:text-gray-400",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                              item.number !== null ? __("Instalment", "yatra") + " " + item.number : __("Balance", "yatra"),
                              " · ",
                              formatDate(item.due_date),
                              item.status === "paid" ? " · " + __("Paid", "yatra") : ""
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatPrice(item.amount, booking.currency) })
                          ]
                        },
                        `${item.due_date}-${index}`
                      )),
                      sched.source === "projected" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 dark:text-gray-500 pt-1", children: __(
                        "Expected from your payment terms — no charge is scheduled.",
                        "yatra"
                      ) })
                    ] });
                  })()
                ] });
              })()
            ] })
          ] })
        ] }),
        Array.isArray(booking.payments) && booking.payments.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-testid": "booking-payments-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Payments", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-gray-100 dark:divide-gray-800", children: booking.payments.map((payment) => {
            const status = String(
              payment.status || payment.payment_status || "pending"
            );
            const statusClass = status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400" : status === "refunded" ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400" : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
            const statusLabel = {
              completed: __("Completed", "yatra"),
              pending: __("Pending", "yatra"),
              failed: __("Failed", "yatra"),
              refunded: __("Refunded", "yatra"),
              cancelled: __("Cancelled", "yatra")
            };
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "py-2 flex items-start justify-between gap-3 text-sm",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium text-gray-900 dark:text-white", children: [
                      payment.payment_type === "refund" || Number(payment.amount) < 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "whitespace-nowrap text-red-600 dark:text-red-400", children: [
                        __("Refund", "yatra"),
                        " ",
                        "-",
                        formatPrice(
                          Math.abs(Number(payment.amount || 0)),
                          payment.currency || booking.currency
                        )
                      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "whitespace-nowrap", children: formatPrice(
                        Number(payment.amount || 0),
                        payment.currency || booking.currency
                      ) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 font-normal text-gray-500 dark:text-gray-400", children: payment.payment_method_label || payment.gateway || "" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 truncate", children: [
                      payment.payment_date ? formatDate$1(payment.payment_date) : "",
                      payment.transaction_id ? ` · ${payment.transaction_id}` : "",
                      payment.payment_number ? ` · ${payment.payment_number}` : ""
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: `inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${statusClass}`,
                        children: statusLabel[status] || status
                      }
                    ),
                    status === "completed" && Number(payment.amount) > 0 && payment.payment_type !== "refund" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      RefundPaymentButton,
                      {
                        bookingId: Number(booking.id),
                        paymentId: Number(payment.id),
                        maxAmount: Math.min(
                          Number(payment.amount) || 0,
                          Number(booking.net_received ?? booking.amount_paid) || 0
                        ),
                        currency: payment.currency || booking.currency,
                        gatewayRefundAvailable: Boolean(payment.gateway_refund_available),
                        gatewayLabel: payment.payment_method_label || payment.gateway
                      }
                    )
                  ] })
                ]
              },
              payment.id
            );
          }) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Customer Information", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white mb-1", children: booking.customer_name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-4 h-4" }),
                  booking.customer_email
                ] }),
                booking.customer_phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "w-4 h-4" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(PhoneDisplay, { value: booking.customer_phone })
                ] })
              ] })
            ] }),
            (() => {
              const cd = booking.contact_data && typeof booking.contact_data === "object" ? booking.contact_data : {};
              const CORE = ["first_name", "last_name", "email", "phone"];
              const extras = Object.entries(cd).filter(
                ([k, v]) => !CORE.includes(k) && k !== "country" && v != null && String(v).trim() !== ""
              );
              const countryCode = booking.customer_country || (cd.country ? String(cd.country) : "");
              if (!countryCode && extras.length === 0) return null;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-gray-100 dark:border-gray-700", children: [
                countryCode && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mb-0.5", children: getFieldLabel("country", contactFields) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: getCountryName(countryCode) })
                ] }),
                extras.map(([fieldId, value]) => {
                  const field = contactFields.find(
                    (f) => f.id === fieldId
                  );
                  const display = (field == null ? void 0 : field.type) === "country" ? getCountryName(String(value)) : optionLabel(field, value);
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mb-0.5", children: getFieldLabel(fieldId, contactFields) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: display })
                  ] }, fieldId);
                })
              ] });
            })()
          ] })
        ] }),
        booking.travelers_data && booking.travelers_data.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-4 h-4" }),
            ((_c = formConfig == null ? void 0 : formConfig.traveler_form) == null ? void 0 : _c.title) || __("Travelers Information", "yatra"),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-xs font-normal text-gray-500 dark:text-gray-400", children: [
              "(",
              booking.travelers_data.length,
              " ",
              booking.travelers_data.length === 1 ? __("traveler", "yatra") : __("travelers", "yatra"),
              ")"
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: booking.travelers_data.map(
            (traveler, index) => {
              const travelerFieldsData = traveler.fields || traveler;
              const systemFields = [
                "id",
                "booking_id",
                "traveller_index",
                "is_lead",
                "created_at",
                "updated_at",
                "fields"
              ];
              const travelerEntries = Object.entries(
                travelerFieldsData
              ).filter(([key, value]) => {
                if (systemFields.includes(key)) return false;
                if (!value || typeof value === "string" && value.trim() === "")
                  return false;
                if (typeof value === "object" && !Array.isArray(value))
                  return false;
                return true;
              });
              const firstName = travelerFieldsData.first_name || traveler.first_name || "";
              const lastName = travelerFieldsData.last_name || traveler.last_name || "";
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `p-4 rounded-lg ${index === 0 ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: [
                        index === 0 ? __("Lead Traveler", "yatra") : `${__("Traveler", "yatra")} ${index + 1}`,
                        (firstName || lastName) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-normal text-gray-500 dark:text-gray-400 ml-2", children: [
                          "-",
                          " ",
                          [firstName, lastName].filter(Boolean).join(" ")
                        ] })
                      ] }),
                      index === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded", children: __("Primary Contact", "yatra") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: travelerEntries.map(([fieldId, fieldValue]) => {
                      if (fieldId === "first_name" || fieldId === "last_name")
                        return null;
                      const fieldConfig = travelerFields.find(
                        (f) => f.id === fieldId
                      );
                      const label = (fieldConfig == null ? void 0 : fieldConfig.label) || getFieldLabel(fieldId, travelerFields);
                      const isLongField = (fieldConfig == null ? void 0 : fieldConfig.type) === "textarea" || String(fieldValue).length > 50;
                      let displayValue = String(fieldValue);
                      if ((fieldConfig == null ? void 0 : fieldConfig.type) === "date" || fieldId.includes("date") || fieldId.includes("birth") || fieldId.includes("dob") || fieldId.includes("expiry")) {
                        displayValue = formatDate$1(fieldValue);
                      }
                      if ((fieldId === "nationality" || fieldId === "country") && fieldValue && typeof fieldValue === "string" && fieldValue.length === 2) {
                        displayValue = getCountryName(fieldValue);
                      }
                      let asWritten = false;
                      if ((fieldConfig == null ? void 0 : fieldConfig.type) === "select") {
                        displayValue = optionLabel(
                          fieldConfig,
                          fieldValue
                        );
                        asWritten = displayValue !== String(fieldValue);
                      }
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "div",
                        {
                          className: isLongField ? "col-span-2 md:col-span-3" : "",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mb-0.5", children: label }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "div",
                              {
                                className: `text-sm text-gray-900 dark:text-white ${fieldId === "passport" ? "font-mono" : ""} ${asWritten ? "" : "capitalize"}`,
                                children: displayValue
                              }
                            )
                          ]
                        },
                        fieldId
                      );
                    }) }),
                    travelerEntries.length <= 2 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-400 dark:text-gray-500 italic mt-2", children: __(
                      "Limited traveler information provided",
                      "yatra"
                    ) })
                  ]
                },
                index
              );
            }
          ) })
        ] }),
        booking.emergency_contact && Object.values(booking.emergency_contact).some(
          (v) => v && String(v).trim() !== ""
        ) && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
            ((_d = formConfig == null ? void 0 : formConfig.emergency_contact_form) == null ? void 0 : _d.title) || __("Emergency Contact", "yatra")
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: Object.entries(booking.emergency_contact).filter(
            ([_, value]) => value && String(value).trim() !== ""
          ).map(([fieldId, fieldValue]) => {
            const label = getFieldLabel(fieldId, emergencyFields);
            const emergencyField = emergencyFields.find(
              (f) => f.id === fieldId
            );
            const emergencyDisplay = optionLabel(
              emergencyField,
              fieldValue
            );
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mb-0.5", children: label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: `text-sm font-medium text-gray-900 dark:text-white ${emergencyDisplay !== String(fieldValue) ? "" : "capitalize"}`,
                  children: emergencyDisplay
                }
              )
            ] }, fieldId);
          }) }) })
        ] }),
        ((_e = booking.pickup_point) == null ? void 0 : _e.name) && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-4 h-4" }),
            __("Pickup point", "yatra")
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: [
              booking.pickup_point.name,
              booking.pickup_point.time ? ` — ${booking.pickup_point.time}` : ""
            ] }),
            booking.pickup_point.details && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap", children: booking.pickup_point.details })
          ] })
        ] }),
        (((_f = booking.accommodation) == null ? void 0 : _f.name) || booking.travel_insurance) && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-testid": "booking-checkout-choices", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Stay & insurance", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-1 text-sm", children: [
            ((_g = booking.accommodation) == null ? void 0 : _g.name) && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-gray-900 dark:text-white", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-500 dark:text-gray-400", children: [
                __("Accommodation", "yatra"),
                ": "
              ] }),
              booking.accommodation.name
            ] }),
            booking.travel_insurance && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-gray-900 dark:text-white", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-500 dark:text-gray-400", children: (booking.travel_insurance.title || __("Travel insurance", "yatra")) + ": " }),
              booking.travel_insurance.accepted ? __("Added", "yatra") : __("Declined by the customer", "yatra")
            ] })
          ] })
        ] }),
        booking.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4" }),
            __("Special Requests", "yatra")
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap", children: booking.notes }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        ((_h = window.yatraAdmin) == null ? void 0 : _h.isPro) && !!((_j = (_i = window.yatraAdmin) == null ? void 0 : _i.googleCalendar) == null ? void 0 : _j.enabled) && booking.google_calendar && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Google Calendar Sync", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: (() => {
            const gc = booking.google_calendar;
            const status = gc.sync_status || (gc.synced ? "synced" : "not_synced");
            const statusClass = status === "synced" ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400";
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Status", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: `inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${statusClass}`,
                    children: status === "synced" ? __("Synced", "yatra") : status === "failed" ? __("Failed", "yatra") : status === "pending" ? __("Pending", "yatra") : status === "not_synced" ? __("Not synced", "yatra") : status
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Last Synced", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: gc.last_synced_at ? formatDate$1(gc.last_synced_at) : __("—", "yatra") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Calendar", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white break-all", children: gc.calendar_id || __("—", "yatra") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Event ID", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white font-mono break-all", children: gc.event_id || __("—", "yatra") })
              ] }),
              gc.error_message && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Error", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap", children: gc.error_message })
              ] })
            ] });
          })() })
        ] }),
        isModuleActive("travel_agency") && (booking == null ? void 0 : booking.id) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          TravelAgencyPanel,
          {
            bookingId: Number(booking.id),
            canEdit: can("yatra_edit_bookings")
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Payment Information", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Payment Status", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1", children: getPaymentStatusBadge(booking.payment_status) })
            ] }),
            booking.payment_method && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-3 h-3" }),
                __("Payment Method", "yatra")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: booking.payment_method })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                __("Average Trip Price per Person", "yatra"),
                ((v) => v === true || parseInt(String(v), 10) === 1)(
                  booking.tax_inclusive
                ) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 normal-case tracking-normal", children: __("Tax Incl.", "yatra") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: (() => {
                const subtotal = parseFloat(booking.subtotal) || booking.total_amount || 0;
                const travelers = booking.travelers || 1;
                const rawServices = booking.additional_services;
                const servicesTotal = Array.isArray(rawServices) ? rawServices.filter((s) => (s == null ? void 0 : s.selected) !== false).reduce(
                  (sum, s) => sum + parseFloat(
                    (s == null ? void 0 : s.total_price) ?? (s == null ? void 0 : s.calculated_price) ?? (s == null ? void 0 : s.total_cost) ?? (s == null ? void 0 : s.amount) ?? (s == null ? void 0 : s.unit_price) ?? (s == null ? void 0 : s.price) ?? 0
                  ),
                  0
                ) : 0;
                const baseTripCost = subtotal - servicesTotal;
                const adjusted = Array.isArray(booking.price_adjustments) && booking.price_adjustments.length > 0;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  formatPrice(baseTripCost / travelers, booking.currency),
                  adjusted && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-gray-500 dark:text-gray-400", children: __("Before price adjustments", "yatra") })
                ] });
              })() })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                __("Total Amount", "yatra"),
                ((v) => v === true || parseInt(String(v), 10) === 1)(
                  booking.tax_inclusive
                ) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 normal-case tracking-normal", children: __("Tax Incl.", "yatra") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: formatPrice(booking.total_amount || 0, booking.currency) })
            ] })
          ] })
        ] }),
        booking.discount_amount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "svg",
              {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                className: "w-4 h-4",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 2L2 7l10 5 10-5-10-5z" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M2 17l10 5 10-5" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M2 12l10 5 10-5" })
                ]
              }
            ),
            __("Discount Applied", "yatra")
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1", children: __("Discount Type", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-emerald-700 dark:text-emerald-300", children: ((_k = booking.discount_code) == null ? void 0 : _k.toLowerCase().includes("group")) || ((_l = booking.discount_code) == null ? void 0 : _l.includes("GROUP")) ? __("Group Discount", "yatra") : __("Coupon Discount", "yatra") })
            ] }),
            booking.discount_code && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1", children: __("Code", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded inline-block", children: booking.discount_code })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1", children: __("Savings", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xl font-bold text-emerald-700 dark:text-emerald-300", children: [
                "-",
                formatPrice(booking.discount_amount, booking.currency)
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CustomerRequestsCard,
          {
            bookingId: Number(booking.id),
            requests: booking.customer_requests || []
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(BookingActivityCard, { bookingId: Number(booking.id) }),
        isPro && consentStatus && consentStatus.total_required > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Card,
          {
            className: consentStatus.all_signed ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20" : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                CardTitle,
                {
                  className: `text-base flex items-center gap-2 ${consentStatus.all_signed ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileSignature, { className: "w-4 h-4" }),
                    __("Consent Status", "yatra")
                  ]
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: `text-sm ${consentStatus.all_signed ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`,
                    children: consentStatus.all_signed ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4" }),
                      __("All Consents Signed", "yatra")
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-4 h-4" }),
                      __("Pending Signatures", "yatra")
                    ] })
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: __("Signed", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-gray-900 dark:text-white", children: [
                    consentStatus.total_signed,
                    " /",
                    " ",
                    consentStatus.total_required
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: `h-2 rounded-full ${consentStatus.all_signed ? "bg-green-500" : "bg-amber-500"}`,
                    style: {
                      width: `${consentStatus.total_signed / consentStatus.total_required * 100}%`
                    }
                  }
                ) }),
                consentStatus.pending_requests && consentStatus.pending_requests.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-2 border-t border-amber-200 dark:border-amber-700", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2", children: __("Pending", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    consentStatus.pending_requests.slice(0, 3).map((req, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-3 h-3" }),
                          req.recipient_name || req.recipient_email
                        ]
                      },
                      idx
                    )),
                    consentStatus.pending_requests.length > 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500", children: [
                      "+",
                      consentStatus.pending_requests.length - 3,
                      " ",
                      __("more", "yatra")
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    className: "w-full mt-2",
                    onClick: () => {
                      var _a2;
                      window.location.href = `${((_a2 = window.yatraAdmin) == null ? void 0 : _a2.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=trip-consent`;
                    },
                    children: __("Manage Consents", "yatra")
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Timeline", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Created", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatDate$1(booking.created_at) })
            ] }),
            booking.updated_at && booking.updated_at !== booking.created_at && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Last Updated", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatDate$1(booking.updated_at) })
            ] })
          ] })
        ] })
      ] })
    ] }) })
  ] });
};
export {
  ViewBooking as default
};
//# sourceMappingURL=ViewBooking-WCU20PD1.js.map
