import { v as useQueryClient, r as reactExports, x as useQuery, j as jsxRuntimeExports, ay as Plus, B as Briefcase, b9 as Pencil, bT as KeyRound, aP as Archive, aZ as Download, e as Mail, c9 as Banknote, aJ as Copy, S as Sparkles, av as ArrowRight, l as FileText } from "./react-vendor-B8PqgpgO.js";
import { u as useToast, _ as __, s as sprintf, I as Input, e as formatDate, a as apiClient, f as formatYatraMoney } from "./index-_dIN_405.js";
import { u as usePermissions, j as isModuleActive, P as PageHeader, B as Button, C as Card, d as CardContent, e as Badge, t as Label, S as Select, M as Modal, l as ConfirmationDialog } from "../../admin/dist/js/app.js";
const EMPTY_FORM = {
  name: "",
  contact_name: "",
  email: "",
  billing_email: "",
  phone: "",
  billing_address: "",
  vat_number: "",
  payment_terms: "invoice",
  users: "",
  notes: ""
};
const thisMonth = () => {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const money = (n, c) => {
  var _a;
  return formatYatraMoney(Number(n) || 0, c || ((_a = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a.currency) || "USD", {
    zeroAsUnknown: false
  });
};
const errorMessage = (e, fallback) => e && typeof e.message === "string" && e.message || fallback;
const UpgradeCard = () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-amber-900 dark:text-amber-100", children: __("Travel Agencies", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-amber-800 dark:text-amber-200 mt-1 max-w-2xl", children: __(
        "Take bookings from travel agencies for their clients: agency billing details kept apart from the guest's, tour emails to the guest and booking and payment emails to the agency, pay by invoice, and one monthly statement settled with a single payment. Available on the Growth and Scale plans — switch it on in Yatra → Modules.",
        "yatra"
      ) })
    ] })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Button,
    {
      onClick: () => window.open("https://wpyatra.com/pricing?module=travel-agency", "_blank", "noopener"),
      children: [
        __("See plans", "yatra"),
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4 ml-1" })
      ]
    }
  )
] }) });
const TravelAgencies = () => {
  var _a, _b;
  const { can } = usePermissions();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const canEdit = can("yatra_edit_bookings");
  const [moduleAvailable, setModuleAvailable] = reactExports.useState(
    () => isModuleActive("travel_agency")
  );
  reactExports.useEffect(() => {
    const sync = () => setModuleAvailable(isModuleActive("travel_agency"));
    window.addEventListener("yatra-modules-updated", sync);
    window.addEventListener("yatra-force-nav-refresh", sync);
    return () => {
      window.removeEventListener("yatra-modules-updated", sync);
      window.removeEventListener("yatra-force-nav-refresh", sync);
    };
  }, []);
  const [tab, setTab] = reactExports.useState("agencies");
  const [showArchived, setShowArchived] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [formOpen, setFormOpen] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({ ...EMPTY_FORM });
  const [saving, setSaving] = reactExports.useState(false);
  const [newCode, setNewCode] = reactExports.useState(null);
  const [toArchive, setToArchive] = reactExports.useState(null);
  const [toRotate, setToRotate] = reactExports.useState(null);
  const [stAgency, setStAgency] = reactExports.useState(0);
  const [stMonth, setStMonth] = reactExports.useState(thisMonth());
  const [payOpen, setPayOpen] = reactExports.useState(false);
  const [pay, setPay] = reactExports.useState({ amount: "", method: "bank_transfer", reference: "", date: "" });
  const [busy, setBusy] = reactExports.useState("");
  const [routing, setRouting] = reactExports.useState(null);
  const agenciesQuery = useQuery({
    queryKey: ["travel-agencies", showArchived],
    queryFn: async () => await apiClient.get("/travel-agencies", { params: showArchived ? { archived: 1 } : {} }),
    enabled: moduleAvailable
  });
  const agencies = ((_a = agenciesQuery.data) == null ? void 0 : _a.data) ?? [];
  const activeAgencies = reactExports.useMemo(() => agencies.filter((a) => a.status === "active"), [agencies]);
  reactExports.useEffect(() => {
    if (!stAgency && activeAgencies.length > 0) {
      setStAgency(activeAgencies[0].id);
    }
  }, [activeAgencies, stAgency]);
  const statementQuery = useQuery({
    queryKey: ["travel-agency-statement", stAgency, stMonth],
    queryFn: async () => await apiClient.get(`/travel-agencies/${stAgency}/statement`, { params: { month: stMonth } }),
    enabled: moduleAvailable && tab === "statements" && stAgency > 0
  });
  const statement = ((_b = statementQuery.data) == null ? void 0 : _b.data) ?? null;
  const settingsQuery = useQuery({
    queryKey: ["travel-agency-settings"],
    queryFn: async () => await apiClient.get("/travel-agencies/settings"),
    enabled: moduleAvailable && tab === "emails"
  });
  reactExports.useEffect(() => {
    var _a2, _b2;
    const r = (_b2 = (_a2 = settingsQuery.data) == null ? void 0 : _a2.data) == null ? void 0 : _b2.routing;
    if (r) setRouting(r);
  }, [settingsQuery.data]);
  if (!moduleAvailable) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(UpgradeCard, {});
  }
  const refreshAgencies = () => queryClient.invalidateQueries({ queryKey: ["travel-agencies"] });
  const refreshStatement = () => queryClient.invalidateQueries({ queryKey: ["travel-agency-statement"] });
  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormOpen(true);
  };
  const openEdit = (a) => {
    setEditing(a);
    setForm({
      name: a.name,
      contact_name: a.contact_name,
      email: a.email,
      billing_email: a.billing_email,
      phone: a.phone,
      billing_address: a.billing_address,
      vat_number: a.vat_number,
      payment_terms: a.payment_terms,
      users: (a.users ?? []).map((u) => u.login).join(", "),
      notes: a.notes
    });
    setFormOpen(true);
  };
  const saveAgency = async () => {
    var _a2;
    setSaving(true);
    try {
      const res = editing ? await apiClient.post(`/travel-agencies/${editing.id}`, form) : await apiClient.post("/travel-agencies", form);
      setFormOpen(false);
      if (!editing && (res == null ? void 0 : res.code)) {
        setNewCode({ agency: ((_a2 = res.data) == null ? void 0 : _a2.name) ?? form.name, code: res.code });
      }
      showToast(editing ? __("Agency saved.", "yatra") : __("Agency added.", "yatra"), "success");
      refreshAgencies();
    } catch (e) {
      showToast(errorMessage(e, __("The agency could not be saved.", "yatra")), "error");
    } finally {
      setSaving(false);
    }
  };
  const rotateCode = async (a) => {
    try {
      const res = await apiClient.post(`/travel-agencies/${a.id}/code`, {});
      setNewCode({ agency: a.name, code: res.code });
      refreshAgencies();
    } catch (e) {
      showToast(errorMessage(e, __("A new code could not be created.", "yatra")), "error");
    } finally {
      setToRotate(null);
    }
  };
  const archiveAgency = async (a) => {
    try {
      const res = await apiClient.delete(`/travel-agencies/${a.id}`);
      showToast((res == null ? void 0 : res.message) || __("Agency archived.", "yatra"), "success");
      refreshAgencies();
    } catch (e) {
      showToast(errorMessage(e, __("The agency could not be archived.", "yatra")), "error");
    } finally {
      setToArchive(null);
    }
  };
  const downloadPdf = async () => {
    setBusy("pdf");
    try {
      const blob = await apiClient.getBlob(`/travel-agencies/${stAgency}/statement/pdf`, {
        params: { month: stMonth }
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const isPdf = blob.type.includes("pdf");
      link.download = `${(statement == null ? void 0 : statement.number) || "statement"}.${isPdf ? "pdf" : "html"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2e3);
    } catch (e) {
      showToast(errorMessage(e, __("The statement could not be downloaded.", "yatra")), "error");
    } finally {
      setBusy("");
    }
  };
  const emailStatement = async () => {
    setBusy("email");
    try {
      const res = await apiClient.post(
        `/travel-agencies/${stAgency}/statement/email?month=${encodeURIComponent(stMonth)}`,
        {}
      );
      showToast((res == null ? void 0 : res.message) || __("Statement emailed to the agency.", "yatra"), "success");
    } catch (e) {
      showToast(errorMessage(e, __("The statement could not be emailed.", "yatra")), "error");
    } finally {
      setBusy("");
    }
  };
  const recordPayment = async () => {
    setBusy("pay");
    try {
      const res = await apiClient.post(
        `/travel-agencies/${stAgency}/statement/payment?month=${encodeURIComponent(stMonth)}`,
        { ...pay, amount: Number(pay.amount) }
      );
      showToast(
        (res == null ? void 0 : res.message) || __("Payment recorded.", "yatra"),
        (res == null ? void 0 : res.partial) ? "warning" : "success",
        (res == null ? void 0 : res.partial) ? 1e4 : void 0
      );
      setPayOpen(false);
      setPay({ amount: "", method: "bank_transfer", reference: "", date: "" });
      refreshStatement();
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    } catch (e) {
      showToast(errorMessage(e, __("The payment could not be recorded.", "yatra")), "error");
    } finally {
      setBusy("");
    }
  };
  const saveRouting = async () => {
    if (!routing) return;
    setBusy("routing");
    try {
      await apiClient.post("/travel-agencies/settings", { routing });
      showToast(__("Email settings saved.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["travel-agency-settings"] });
    } catch (e) {
      showToast(errorMessage(e, __("The settings could not be saved.", "yatra")), "error");
    } finally {
      setBusy("");
    }
  };
  const field = (key, label, props = {}) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `ta-${key}`, children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        id: `ta-${key}`,
        value: form[key],
        onChange: (e) => setForm({ ...form, [key]: e.target.value }),
        ...props
      }
    )
  ] });
  const tabButton = (key, label, Icon) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick: () => setTab(key),
      className: `inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === key ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400" : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`,
      "aria-pressed": tab === key,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-4 h-4" }),
        label
      ]
    }
  );
  const openDue = statement ? Object.entries(statement.totals).filter(([, t]) => t.due > 4e-3) : [];
  const routingRow = (group, title, help) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-3 py-4 border-b border-gray-100 dark:border-gray-700 last:border-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-500 dark:text-gray-400", children: help })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Select,
      {
        value: (routing == null ? void 0 : routing[group]) ?? "agency",
        onChange: (e) => routing && setRouting({ ...routing, [group]: e.target.value }),
        disabled: !canEdit,
        className: "md:w-56",
        "aria-label": title,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "agency", children: __("Agency", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "guest", children: __("Guest", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "both", children: __("Agency and guest", "yatra") })
        ]
      }
    )
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        description: __(
          "Agencies that book tours for their clients. The booking keeps the guest's details; the agency's details, invoices and statements are kept here.",
          "yatra"
        ),
        actions: canEdit && tab === "agencies" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openCreate, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-1" }),
          __("Add agency", "yatra")
        ] }) : null
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto", children: [
      tabButton("agencies", __("Agencies", "yatra"), Briefcase),
      tabButton("statements", __("Statements", "yatra"), FileText),
      tabButton("emails", __("Emails", "yatra"), Mail)
    ] }),
    tab === "agencies" && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-end px-4 py-3 border-b border-gray-100 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            checked: showArchived,
            onChange: (e) => setShowArchived(e.target.checked)
          }
        ),
        __("Show archived", "yatra")
      ] }) }),
      agenciesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 text-sm text-gray-500", children: __("Loading…", "yatra") }) : agencies.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-10 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Briefcase, { className: "w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-gray-600 dark:text-gray-300", children: __("No agencies yet. Add an agency to give it an agency code for checkout.", "yatra") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-gray-50 dark:bg-gray-800 text-left text-xs uppercase text-gray-500 dark:text-gray-400", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: __("Agency", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: __("Billing", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: __("Payment terms", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: __("Agency code", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-right", children: __("Bookings", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-gray-100 dark:divide-gray-700", children: agencies.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: a.status !== "active" ? "opacity-60" : "", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: a.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: [a.contact_name, a.email, a.phone].filter(Boolean).join(" · ") }),
            a.users && a.users.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: sprintf(
              /* translators: %s: list of WordPress users. */
              __("Signs in as: %s", "yatra"),
              a.users.map((u) => u.login).join(", ")
            ) }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3 text-gray-600 dark:text-gray-300", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: a.billing_email || a.email }),
            a.vat_number ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500", children: [
              __("VAT", "yatra"),
              ": ",
              a.vat_number
            ] }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3", children: [
            a.payment_terms === "invoice" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 text-xs", children: __("Pay by invoice", "yatra") }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs", children: __("Pays at checkout", "yatra") }),
            a.status !== "active" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "ml-1 bg-gray-100 text-gray-600 text-xs", children: __("Archived", "yatra") }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-300", children: a.has_code ? `AG-····-${a.code_hint}` : "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-right", children: a.bookings_count }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: canEdit && a.status === "active" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => openEdit(a), title: __("Edit", "yatra"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => setToRotate(a), title: __("New agency code", "yatra"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => setToArchive(a), title: __("Archive", "yatra"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Archive, { className: "w-4 h-4" }) })
          ] }) : null })
        ] }, a.id)) })
      ] }) })
    ] }) }),
    tab === "statements" && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6 space-y-5", children: activeAgencies.length === 0 && agencies.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: __("Add an agency first.", "yatra") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row gap-4 md:items-end", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:w-72", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ta-st-agency", children: __("Agency", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Select,
            {
              id: "ta-st-agency",
              value: String(stAgency),
              onChange: (e) => setStAgency(Number(e.target.value)),
              children: agencies.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: a.id, children: a.name }, a.id))
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:w-48", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ta-st-month", children: __("Month travelled", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "ta-st-month",
              type: "month",
              value: stMonth,
              onChange: (e) => e.target.value && setStMonth(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 md:ml-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: downloadPdf, disabled: !statement || busy !== "", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4 mr-1" }),
            __("Download", "yatra")
          ] }),
          canEdit ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                onClick: emailStatement,
                disabled: !statement || statement.rows.length === 0 || busy !== "",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-4 h-4 mr-1" }),
                  busy === "email" ? __("Sending…", "yatra") : __("Email to agency", "yatra")
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setPayOpen(true), disabled: openDue.length === 0 || busy !== "", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { className: "w-4 h-4 mr-1" }),
              __("Record payment", "yatra")
            ] })
          ] }) : null
        ] })
      ] }),
      statementQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-500", children: __("Loading…", "yatra") }) : !statement || statement.rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: __("No tours travelled in this month.", "yatra") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-x-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-500 dark:text-gray-400 mb-2", children: sprintf(
          /* translators: %s: statement number. */
          __("Statement %s", "yatra"),
          statement.number
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-gray-50 dark:bg-gray-800 text-left text-xs uppercase text-gray-500 dark:text-gray-400", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2", children: __("Date", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2", children: __("Booking", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2", children: __("Guest", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2", children: __("Tour", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right", children: __("Total", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right", children: __("Paid", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right", children: __("Due", "yatra") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-gray-100 dark:divide-gray-700", children: [
            statement.rows.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 whitespace-nowrap", children: formatDate(r.travel_date) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  href: `?page=yatra&subpage=bookings&action=view&id=${r.booking_id}`,
                  className: "text-blue-600 dark:text-blue-400 hover:underline",
                  children: r.reference
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-3 py-2", children: [
                r.guest,
                r.travelers > 1 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-500", children: [
                  " ×",
                  r.travelers
                ] }) : null
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: r.trip }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right whitespace-nowrap", children: money(r.total, r.currency) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right whitespace-nowrap", children: money(r.paid, r.currency) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right whitespace-nowrap font-medium", children: money(r.due, r.currency) })
            ] }, r.booking_id)),
            Object.entries(statement.totals).map(([cur, t]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "font-semibold border-t-2 border-gray-300 dark:border-gray-600", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-3 py-2", colSpan: 4, children: [
                __("Total", "yatra"),
                Object.keys(statement.totals).length > 1 ? ` (${cur})` : ""
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right whitespace-nowrap", children: money(t.total, cur) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right whitespace-nowrap", children: money(t.paid, cur) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right whitespace-nowrap", children: money(t.due, cur) })
            ] }, cur))
          ] })
        ] })
      ] })
    ] }) }) }),
    tab === "emails" && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300 mb-2", children: __(
        "For bookings made by an agency, choose who receives each kind of email. Your own admin copies are not affected.",
        "yatra"
      ) }),
      routingRow(
        "booking",
        __("Booking emails", "yatra"),
        __("Booking confirmation (with prices), cancellations and expiry.", "yatra")
      ),
      routingRow(
        "payment",
        __("Payment emails", "yatra"),
        __("Payment receipts, balance reminders, payment links. Sent to the agency's billing email.", "yatra")
      ),
      routingRow(
        "trip",
        __("Tour emails", "yatra"),
        __("Pickup reminder before the tour, consent forms, review request.", "yatra")
      ),
      canEdit ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveRouting, disabled: !routing || busy !== "", children: busy === "routing" ? __("Saving…", "yatra") : __("Save", "yatra") }) }) : null
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: formOpen,
        onClose: () => setFormOpen(false),
        title: editing ? __("Edit agency", "yatra") : __("Add agency", "yatra"),
        size: "lg",
        footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setFormOpen(false), children: __("Cancel", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveAgency, disabled: saving, children: saving ? __("Saving…", "yatra") : __("Save", "yatra") })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          field("name", __("Agency name", "yatra"), { required: true }),
          field("contact_name", __("Contact person", "yatra")),
          field("email", __("Email", "yatra"), { type: "email", required: true }),
          field("billing_email", __("Billing email (invoices and receipts)", "yatra"), { type: "email" }),
          field("phone", __("Phone", "yatra")),
          field("vat_number", __("VAT / tax number", "yatra")),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ta-billing_address", children: __("Billing address", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                id: "ta-billing_address",
                rows: 3,
                className: "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm",
                value: form.billing_address,
                onChange: (e) => setForm({ ...form, billing_address: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ta-terms", children: __("Payment terms", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                id: "ta-terms",
                value: form.payment_terms,
                onChange: (e) => setForm({ ...form, payment_terms: e.target.value }),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "invoice", children: __("Pay by invoice (monthly statement)", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "standard", children: __("Pays at checkout", "yatra") })
                ]
              }
            )
          ] }),
          field("users", __("WordPress users who book for this agency", "yatra"), {
            placeholder: __("usernames or emails, comma separated", "yatra")
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ta-notes", children: __("Internal notes", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                id: "ta-notes",
                rows: 2,
                className: "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm",
                value: form.notes,
                onChange: (e) => setForm({ ...form, notes: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "md:col-span-2 text-xs text-gray-500 dark:text-gray-400", children: __(
            'Pay by invoice also needs the "Pay by invoice" method switched on in Settings → Payments. Only agencies on invoice terms see it at checkout.',
            "yatra"
          ) })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: newCode !== null,
        onClose: () => setNewCode(null),
        title: __("Agency code", "yatra"),
        footer: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setNewCode(null), children: __("Done", "yatra") }) }),
        children: newCode ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: sprintf(
            /* translators: %s: agency name. */
            __("Give this code to %s. They enter it at checkout to book as the agency. It is shown only once — create a new one if it is lost.", "yatra"),
            newCode.agency
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-lg font-mono px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 select-all", children: newCode.code }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => {
                  var _a2;
                  (_a2 = navigator.clipboard) == null ? void 0 : _a2.writeText(newCode.code).then(
                    () => showToast(__("Copied.", "yatra"), "success"),
                    () => void 0
                  );
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4 mr-1" }),
                  __("Copy", "yatra")
                ]
              }
            )
          ] })
        ] }) : null
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: payOpen,
        onClose: () => setPayOpen(false),
        title: __("Record statement payment", "yatra"),
        footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setPayOpen(false), children: __("Cancel", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: recordPayment, disabled: busy === "pay" || !(Number(pay.amount) > 0), children: busy === "pay" ? __("Saving…", "yatra") : __("Record payment", "yatra") })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: __(
            "The amount is applied to the statement's bookings, oldest tour first. Each booking gets its own payment record; the agency gets one receipt.",
            "yatra"
          ) }),
          openDue.map(([cur, t]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
            __("Due on this statement:", "yatra"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: money(t.due, cur) })
          ] }, cur)),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ta-pay-amount", children: __("Amount received", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "ta-pay-amount",
                type: "number",
                min: "0",
                step: "0.01",
                value: pay.amount,
                onChange: (e) => setPay({ ...pay, amount: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ta-pay-method", children: __("Method", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                id: "ta-pay-method",
                value: pay.method,
                onChange: (e) => setPay({ ...pay, method: e.target.value }),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "bank_transfer", children: __("Bank transfer", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "cash", children: __("Cash", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "credit_card", children: __("Card", "yatra") })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ta-pay-ref", children: __("Reference", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "ta-pay-ref",
                value: pay.reference,
                onChange: (e) => setPay({ ...pay, reference: e.target.value })
              }
            )
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: toRotate !== null,
        onClose: () => setToRotate(null),
        onConfirm: () => toRotate && rotateCode(toRotate),
        title: __("Create a new agency code?", "yatra"),
        message: __("The current code stops working straight away.", "yatra"),
        confirmText: __("New code", "yatra"),
        variant: "warning"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: toArchive !== null,
        onClose: () => setToArchive(null),
        onConfirm: () => toArchive && archiveAgency(toArchive),
        title: __("Archive this agency?", "yatra"),
        message: __("Its agency code stops working. Its bookings and statements are kept.", "yatra"),
        confirmText: __("Archive", "yatra"),
        variant: "danger"
      }
    )
  ] });
};
export {
  TravelAgencies as default
};
//# sourceMappingURL=TravelAgencies-D2llVuvh.js.map
