import { v as useQueryClient, r as reactExports, x as useQuery, j as jsxRuntimeExports, S as Sparkles, ay as Plus, U as Users, p as CalendarDays, b9 as Pencil, aQ as Trash2, X as AlertTriangle, aV as Image } from "./react-vendor-B8PqgpgO.js";
import { u as useToast, _ as __, s as sprintf, I as Input, e as formatDate, a as apiClient } from "./index-_dIN_405.js";
import { j as isModuleActive, E as useWordPressMedia, P as PageHeader, B as Button, C as Card, d as CardContent, t as Label, S as Select, e as Badge, M as Modal, l as ConfirmationDialog } from "../../admin/dist/js/app.js";
const TYPE_LABELS = {
  guide: __("Guide", "yatra"),
  vehicle: __("Vehicle", "yatra"),
  room: __("Room", "yatra"),
  equipment: __("Equipment", "yatra"),
  other: __("Other", "yatra")
};
const EMPTY = {
  type: "guide",
  name: "",
  photo_id: null,
  bio: "",
  languages: "",
  experience_years: null,
  quantity: 1,
  capacity: null,
  phone: "",
  email: "",
  notes: "",
  show_on_site: true,
  status: "active"
};
const today = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
const plusDays = (d, n) => {
  const t = /* @__PURE__ */ new Date(d + "T12:00:00");
  t.setDate(t.getDate() + n);
  return t.toISOString().slice(0, 10);
};
const errorMessage = (e, fallback) => e && typeof e.message === "string" && e.message || fallback;
const GuidesResources = () => {
  var _a, _b;
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const toast = (type, message) => showToast(message, type);
  const [moduleAvailable, setModuleAvailable] = reactExports.useState(isModuleActive("guides_resources"));
  reactExports.useEffect(() => {
    const sync = () => setModuleAvailable(isModuleActive("guides_resources"));
    window.addEventListener("yatra-modules-updated", sync);
    return () => window.removeEventListener("yatra-modules-updated", sync);
  }, []);
  const [tab, setTab] = reactExports.useState("resources");
  const [typeFilter, setTypeFilter] = reactExports.useState("");
  const [editing, setEditing] = reactExports.useState(null);
  const [formOpen, setFormOpen] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({ ...EMPTY });
  const [photoUrl, setPhotoUrl] = reactExports.useState("");
  const [saving, setSaving] = reactExports.useState(false);
  const [toDelete, setToDelete] = reactExports.useState(null);
  const [from, setFrom] = reactExports.useState(today());
  const [to, setTo] = reactExports.useState(plusDays(today(), 60));
  const [assignOpen, setAssignOpen] = reactExports.useState(false);
  const [assign, setAssign] = reactExports.useState({ resource_id: "", trip_id: "", start_date: today(), end_date: "", quantity: "1", note: "" });
  const [conflictAsk, setConflictAsk] = reactExports.useState("");
  const { openMediaLibrary } = useWordPressMedia({ title: __("Choose a photo", "yatra") });
  const resourcesQuery = useQuery({
    queryKey: ["resources"],
    queryFn: async () => await apiClient.get("/resources"),
    enabled: moduleAvailable
  });
  const resources = ((_a = resourcesQuery.data) == null ? void 0 : _a.data) ?? [];
  const shown = reactExports.useMemo(() => resources.filter((r) => !typeFilter || r.type === typeFilter), [resources, typeFilter]);
  const scheduleQuery = useQuery({
    queryKey: ["resource-assignments", from, to],
    queryFn: async () => await apiClient.get("/resource-assignments", { params: { from, to } }),
    enabled: moduleAvailable && tab === "schedule"
  });
  const schedule = ((_b = scheduleQuery.data) == null ? void 0 : _b.data) ?? [];
  const tripsQuery = useQuery({
    queryKey: ["resources-trips"],
    queryFn: async () => {
      var _a2;
      const res = await apiClient.get("/trips", { params: { per_page: 100, status: "publish" } });
      const items = ((_a2 = res == null ? void 0 : res.data) == null ? void 0 : _a2.data) || (res == null ? void 0 : res.data) || res || [];
      return Array.isArray(items) ? items : [];
    },
    enabled: moduleAvailable && assignOpen
  });
  if (!moduleAvailable) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-amber-900 dark:text-amber-100", children: __("Guides & Resources", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-amber-800 dark:text-amber-200 mt-1 max-w-2xl", children: __(
          "Guide profiles on your trip pages and a schedule for guides, vehicles, rooms and equipment. A Yatra Pro module — switch it on in Yatra → Modules.",
          "yatra"
        ) })
      ] })
    ] }) });
  }
  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, type: typeFilter || "guide" });
    setPhotoUrl("");
    setFormOpen(true);
  };
  const openEdit = (r) => {
    setEditing(r);
    setForm({ ...r });
    setPhotoUrl(r.photo_url);
    setFormOpen(true);
  };
  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await apiClient.post(`/resources/${editing.id}`, form);
      } else {
        await apiClient.post("/resources", form);
      }
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast("success", __("Saved.", "yatra"));
    } catch (e) {
      toast("error", errorMessage(e, __("Could not save.", "yatra")));
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!toDelete) return;
    try {
      await apiClient.delete(`/resources/${toDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["resource-assignments"] });
    } catch (e) {
      toast("error", errorMessage(e, __("Could not delete.", "yatra")));
    }
    setToDelete(null);
  };
  const submitAssign = async (force = false) => {
    try {
      await apiClient.post("/resource-assignments", { ...assign, quantity: parseInt(assign.quantity, 10) || 1, force });
      setAssignOpen(false);
      setConflictAsk("");
      queryClient.invalidateQueries({ queryKey: ["resource-assignments"] });
      toast("success", __("Assigned.", "yatra"));
    } catch (e) {
      const msg = errorMessage(e, __("Could not assign.", "yatra"));
      if (!force && /already booked/i.test(msg)) {
        setConflictAsk(msg);
      } else {
        toast("error", msg);
      }
    }
  };
  const unassign = async (a) => {
    try {
      await apiClient.delete(`/resource-assignments/${a.id}`);
      queryClient.invalidateQueries({ queryKey: ["resource-assignments"] });
    } catch (e) {
      toast("error", errorMessage(e, __("Could not remove.", "yatra")));
    }
  };
  const selectedResource = resources.find((r) => String(r.id) === assign.resource_id);
  const field = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", "data-testid": "guides-resources-page", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        description: __(
          "Your guides, vehicles, rooms and equipment, and who or what goes on which trip date.",
          "yatra"
        ),
        actions: tab === "resources" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openCreate, "data-testid": "resource-add", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-1" }),
          __("Add", "yatra")
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => {
          setAssign({ resource_id: "", trip_id: "", start_date: today(), end_date: "", quantity: "1", note: "" });
          setAssignOpen(true);
        }, "data-testid": "assignment-add", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-1" }),
          __("Assign", "yatra")
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 border-b border-gray-200 dark:border-gray-700", children: [["resources", __("Guides & resources", "yatra"), Users], ["schedule", __("Schedule", "yatra"), CalendarDays]].map(([key, label, Icon]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => setTab(key),
        className: `px-3 py-2 text-sm flex items-center gap-1 border-b-2 -mb-px ${tab === key ? "border-blue-600 text-blue-700 dark:text-blue-300" : "border-transparent text-gray-600 dark:text-gray-400"}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-4 h-4" }),
          label
        ]
      },
      key
    )) }),
    tab === "resources" && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "resource-type-filter", className: "text-sm", children: __("Show", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { id: "resource-type-filter", value: typeFilter, onChange: (e) => setTypeFilter(e.target.value), className: "w-48", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: __("All", "yatra") }),
          Object.keys(TYPE_LABELS).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: t, children: TYPE_LABELS[t] }, t))
        ] })
      ] }),
      resourcesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: __("Loading…", "yatra") }) : shown.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", "data-testid": "resources-empty", children: __("Nothing here yet. Add your first guide, vehicle or room.", "yatra") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", "data-testid": "resources-table", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-left text-gray-500 dark:text-gray-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2", children: __("Name", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: __("Type", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: __("Details", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: __("Status", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", {})
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: shown.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-gray-100 dark:border-gray-800", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 font-medium text-gray-900 dark:text-white", children: r.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: TYPE_LABELS[r.type] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-gray-600 dark:text-gray-400", children: r.type === "guide" ? [r.languages, r.experience_years ? sprintf(__("%d years", "yatra"), r.experience_years) : ""].filter(Boolean).join(" · ") : [r.quantity > 1 ? sprintf(__("%d units", "yatra"), r.quantity) : "", r.capacity ? sprintf(__("%d seats/beds each", "yatra"), r.capacity) : ""].filter(Boolean).join(" · ") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: r.status === "active" ? "success" : "outline", children: r.status === "active" ? __("Active", "yatra") : __("Inactive", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "text-right whitespace-nowrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", "aria-label": __("Edit", "yatra"), onClick: () => openEdit(r), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", "aria-label": __("Delete", "yatra"), onClick: () => setToDelete(r), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" }) })
          ] })
        ] }, r.id)) })
      ] })
    ] }) }),
    tab === "schedule" && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "schedule-from", className: "text-xs", children: __("From", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "schedule-from", type: "date", value: from, onChange: (e) => setFrom(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "schedule-to", className: "text-xs", children: __("To", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "schedule-to", type: "date", value: to, onChange: (e) => setTo(e.target.value) })
        ] })
      ] }),
      scheduleQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: __("Loading…", "yatra") }) : schedule.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", "data-testid": "schedule-empty", children: __("Nothing assigned in these dates.", "yatra") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", "data-testid": "schedule-table", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-left text-gray-500 dark:text-gray-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2", children: __("Dates", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: __("Trip", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: __("Assigned", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: __("Travellers", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", {})
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: schedule.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-gray-100 dark:border-gray-800", "data-testid": `assignment-${a.id}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "py-2 whitespace-nowrap", children: [
            formatDate(a.start_date),
            a.end_date !== a.start_date ? ` – ${formatDate(a.end_date)}` : ""
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: a.trip_title }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { children: [
            a.resource_name,
            a.quantity > 1 ? ` × ${a.quantity}` : "",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-500", children: [
              "(",
              TYPE_LABELS[a.resource_type],
              ")"
            ] }),
            a.conflict && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 inline-flex items-center gap-1 text-red-600", "data-testid": "assignment-conflict", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "w-3 h-3" }),
              __("Double-booked", "yatra")
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { children: [
            a.booked_travellers,
            a.short_of_capacity && a.assigned_capacity !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 inline-flex items-center gap-1 text-amber-700", "data-testid": "assignment-short", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "w-3 h-3" }),
              sprintf(__("only %d seats/beds", "yatra"), a.assigned_capacity)
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", "aria-label": __("Remove", "yatra"), onClick: () => unassign(a), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" }) }) })
        ] }, a.id)) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: formOpen,
        onClose: () => setFormOpen(false),
        title: editing ? __("Edit", "yatra") : __("Add a guide or resource", "yatra"),
        size: "lg",
        footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setFormOpen(false), children: __("Cancel", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: save, disabled: saving || !String(form.name || "").trim(), "data-testid": "resource-save", children: __("Save", "yatra") })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "res-type", children: __("Type", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Select, { id: "res-type", value: form.type, onChange: (e) => field("type", e.target.value), children: Object.keys(TYPE_LABELS).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: t, children: TYPE_LABELS[t] }, t)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "res-name", children: __("Name", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "res-name", value: form.name, maxLength: 191, onChange: (e) => field("name", e.target.value) })
          ] }),
          form.type === "guide" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "res-languages", children: __("Languages", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "res-languages", value: form.languages, placeholder: __("English, Nepali", "yatra"), onChange: (e) => field("languages", e.target.value) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "res-years", children: __("Years of experience", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "res-years", type: "number", min: 0, max: 80, value: form.experience_years ?? "", onChange: (e) => field("experience_years", e.target.value === "" ? null : parseInt(e.target.value, 10)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "res-bio", children: __("About (shown on trip pages)", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { id: "res-bio", rows: 3, maxLength: 2e3, value: form.bio, onChange: (e) => field("bio", e.target.value), className: "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2 flex items-center gap-3", children: [
              photoUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: photoUrl, alt: "", className: "w-12 h-12 rounded-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "w-8 h-8 text-gray-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => openMediaLibrary((att) => {
                var _a2, _b2;
                const a = Array.isArray(att) ? att[0] : att;
                if (a) {
                  field("photo_id", a.id);
                  setPhotoUrl(((_b2 = (_a2 = a.sizes) == null ? void 0 : _a2.thumbnail) == null ? void 0 : _b2.url) || a.url);
                }
              }), children: __("Choose photo", "yatra") }),
              photoUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => {
                field("photo_id", null);
                setPhotoUrl("");
              }, children: __("Remove photo", "yatra") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "md:col-span-2 flex items-center gap-2 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: !!form.show_on_site, onChange: (e) => field("show_on_site", e.target.checked) }),
              __("Show on trip pages (pick the trips in each trip's editor)", "yatra")
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "res-qty", children: __("How many you have", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "res-qty", type: "number", min: 1, value: form.quantity, onChange: (e) => field("quantity", parseInt(e.target.value, 10) || 1) })
            ] }),
            (form.type === "vehicle" || form.type === "room") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "res-capacity", children: form.type === "vehicle" ? __("Seats (each)", "yatra") : __("Beds (each)", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "res-capacity", type: "number", min: 1, value: form.capacity ?? "", onChange: (e) => field("capacity", e.target.value === "" ? null : parseInt(e.target.value, 10)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "res-phone", children: __("Phone (staff only)", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "res-phone", value: form.phone, onChange: (e) => field("phone", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "res-email", children: __("Email (staff only)", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "res-email", type: "email", value: form.email, onChange: (e) => field("email", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "res-notes", children: __("Internal notes", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { id: "res-notes", rows: 2, value: form.notes, onChange: (e) => field("notes", e.target.value), className: "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "res-status", children: __("Status", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { id: "res-status", value: form.status, onChange: (e) => field("status", e.target.value), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "active", children: __("Active", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "inactive", children: __("Inactive", "yatra") })
            ] })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: assignOpen,
        onClose: () => {
          setAssignOpen(false);
          setConflictAsk("");
        },
        title: __("Assign to a trip date", "yatra"),
        footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => {
            setAssignOpen(false);
            setConflictAsk("");
          }, children: __("Cancel", "yatra") }),
          conflictAsk ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "destructive", onClick: () => submitAssign(true), "data-testid": "assignment-force", children: __("Assign anyway", "yatra") }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => submitAssign(false), disabled: !assign.resource_id || !assign.trip_id || !assign.start_date, "data-testid": "assignment-save", children: __("Assign", "yatra") })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          conflictAsk && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-red-700 bg-red-50 dark:bg-red-900/20 rounded-md p-2 flex items-center gap-2", "data-testid": "assignment-conflict-warning", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "w-4 h-4" }),
            conflictAsk
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "as-resource", children: __("Guide or resource", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { id: "as-resource", value: assign.resource_id, onChange: (e) => {
              setConflictAsk("");
              setAssign({ ...assign, resource_id: e.target.value });
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: __("Choose…", "yatra") }),
              resources.filter((r) => r.status === "active").map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: String(r.id), children: `${r.name} (${TYPE_LABELS[r.type]})` }, r.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "as-trip", children: __("Trip", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { id: "as-trip", value: assign.trip_id, onChange: (e) => {
              setConflictAsk("");
              setAssign({ ...assign, trip_id: e.target.value });
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: __("Choose…", "yatra") }),
              (tripsQuery.data || []).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: String(t.id), children: t.title }, t.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "as-start", children: __("Departure date", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "as-start", type: "date", value: assign.start_date, onChange: (e) => {
                setConflictAsk("");
                setAssign({ ...assign, start_date: e.target.value });
              } })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "as-end", children: __("Until (empty = the trip's length)", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "as-end", type: "date", value: assign.end_date, onChange: (e) => {
                setConflictAsk("");
                setAssign({ ...assign, end_date: e.target.value });
              } })
            ] })
          ] }),
          selectedResource && selectedResource.quantity > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "as-qty", children: sprintf(__("How many (you have %d)", "yatra"), selectedResource.quantity) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "as-qty", type: "number", min: 1, max: selectedResource.quantity, value: assign.quantity, onChange: (e) => setAssign({ ...assign, quantity: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "as-note", children: __("Note", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "as-note", value: assign.note, maxLength: 255, onChange: (e) => setAssign({ ...assign, note: e.target.value }) })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: toDelete !== null,
        onClose: () => setToDelete(null),
        onConfirm: remove,
        title: __("Delete?", "yatra"),
        message: __("This also removes its assignments.", "yatra"),
        confirmText: __("Delete", "yatra"),
        variant: "danger"
      }
    )
  ] });
};
export {
  GuidesResources as default
};
//# sourceMappingURL=GuidesResources-CaWOGsCi.js.map
