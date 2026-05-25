import { t as useQueryClient, r as reactExports, u as useQuery, v as useMutation, j as jsxRuntimeExports, bJ as Building2, bK as Palette, c1 as PanelLeft, c2 as Layout, b8 as Lock, D as Loader2, aV as Save, S as Sparkles, C as Crown, V as ExternalLink, ax as X, aS as Image, x as ChevronDown, y as ChevronRight, aQ as Eye, bt as EyeOff, b9 as GripVertical } from "./react-vendor-CqkbFEvK.js";
import { u as useToast, _ as __, a as apiClient } from "./index-DRAt5dnR.js";
import { aC as DEFAULT_MENU_ITEMS, aD as useWordPressMedia, P as PageHeader, C as Card, d as CardContent, B as Button, f as CardHeader, g as CardTitle, h as CardDescription, w as Label, I as Input, aE as MenuIcon, aF as ICON_MAP, n as IconPicker } from "../../admin/dist/js/app.js";
import { M as ModulePageSkeleton } from "./module-skeleton-DUioukJc.js";
function toPickerValue(icon) {
  if (!icon) return null;
  if (typeof icon === "string") return null;
  return icon;
}
const THEME_PRESETS = [
  {
    label: "Light",
    surfaces: {
      sidebar_bg: "#ffffff",
      sidebar_text: "#374151",
      topbar_bg: "#ffffff",
      topbar_text: "#111827"
    }
  },
  {
    label: "Dark",
    surfaces: {
      sidebar_bg: "#111827",
      sidebar_text: "#e5e7eb",
      topbar_bg: "#111827",
      topbar_text: "#f9fafb"
    }
  },
  {
    label: "Midnight",
    surfaces: {
      sidebar_bg: "#0f172a",
      sidebar_text: "#94a3b8",
      topbar_bg: "#1e293b",
      topbar_text: "#e2e8f0"
    }
  },
  {
    label: "Ocean",
    surfaces: {
      sidebar_bg: "#0c4a6e",
      sidebar_text: "#e0f2fe",
      topbar_bg: "#075985",
      topbar_text: "#f0f9ff"
    }
  },
  {
    label: "Sand",
    surfaces: {
      sidebar_bg: "#fef3c7",
      sidebar_text: "#78350f",
      topbar_bg: "#fef9c3",
      topbar_text: "#854d0e"
    }
  },
  {
    label: "Forest",
    surfaces: {
      sidebar_bg: "#064e3b",
      sidebar_text: "#d1fae5",
      topbar_bg: "#065f46",
      topbar_text: "#ecfdf5"
    }
  }
];
const SECTIONS = [
  {
    id: "brand",
    label: "Brand Identity",
    icon: Building2,
    description: "Plugin name, company, URLs, and logo shown across the admin and PDFs."
  },
  {
    id: "theme",
    label: "Theme",
    icon: Palette,
    description: "Brand accent color, plus surface theme — sidebar and top bar background + text colors. Pick a preset or fine-tune each color."
  },
  {
    id: "menu",
    label: "Sidebar Menu",
    icon: PanelLeft,
    description: "Reorder, rename, re-icon, or hide entries in the Yatra sidebar."
  },
  {
    id: "chrome",
    label: "UI Chrome",
    icon: Layout,
    description: "Show or hide the version number, Back to WordPress link, and Join Community button."
  }
];
const DEFAULT_SETTINGS = {
  plugin_name: "",
  company_name: "",
  website_url: "",
  support_url: "",
  logo_url: "",
  primary_color: "",
  menu_overrides: {},
  menu_order: {},
  ui_chrome: {},
  theme_surfaces: {}
};
function toOrderMap(raw) {
  if (!raw) return {};
  if (Array.isArray(raw)) return { "": [...raw] };
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? [...v] : []])
  );
}
const PlanBadge = () => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-3 w-3" }),
  __("Agency plan", "yatra")
] });
const UpgradeCard = ({ meta }) => {
  const upgradeUrl = (meta == null ? void 0 : meta.upgrade_url) || "https://wpyatra.com/pricing?module=white-label";
  const licensePageUrl = (meta == null ? void 0 : meta.license_page_url) || "admin.php?page=yatra&subpage=license";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "max-w-3xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("White Label", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PlanBadge, {})
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "mt-1", children: __(
          "White Label is exclusive to the Agency plan (Yearly or Lifetime). Upgrade to remove all Yatra / MantraBrain references from your clients' admin.",
          "yatra"
        ) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: __(
        "Rebrand the entire Yatra plugin as your own product — admin menu, plugin list, and PDFs — and remove every reference to Yatra or MantraBrain from what your clients see.",
        "yatra"
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: upgradeUrl, target: "_blank", rel: "noopener noreferrer", children: [
          (meta == null ? void 0 : meta.is_pro_active) ? __("Upgrade to Agency", "yatra") : __("Get Yatra Pro Agency", "yatra"),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "ml-2 h-4 w-4" })
        ] }) }),
        (meta == null ? void 0 : meta.is_pro_active) && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: licensePageUrl, children: __("Manage License", "yatra") }) })
      ] })
    ] })
  ] });
};
const MenuRow = ({
  slug,
  defaultLabel,
  defaultIconName,
  override,
  isSubmenu = false,
  draggable = false,
  isDragging = false,
  dropPosition = null,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDragLeave,
  onDrop,
  onPatch
}) => {
  const FallbackIcon = ICON_MAP[defaultIconName] || ICON_MAP.Settings;
  const hidden = Boolean(override.hidden);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "relative",
      onDragOver,
      onDragLeave,
      onDrop,
      children: [
        dropPosition === "above" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "pointer-events-none absolute -top-1 left-0 right-0 z-10 h-1 rounded bg-blue-500 shadow",
            "aria-hidden": "true"
          }
        ),
        dropPosition === "below" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "pointer-events-none absolute -bottom-1 left-0 right-0 z-10 h-1 rounded bg-blue-500 shadow",
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            draggable,
            onDragStart,
            onDragEnd,
            className: `flex items-center gap-3 rounded-md border px-3 py-2 transition-shadow ${isDragging ? "border-blue-400 bg-blue-50 opacity-60 dark:border-blue-500 dark:bg-blue-900/20" : dropPosition === "into" ? "border-blue-400 bg-blue-50 ring-2 ring-blue-400 dark:border-blue-500 dark:bg-blue-900/30" : isSubmenu ? "border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"}`,
            children: [
              draggable ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-200",
                  "aria-label": __("Drag to reorder", "yatra"),
                  onMouseDown: (e) => e.stopPropagation(),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(GripVertical, { className: "h-4 w-4" })
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-4", "aria-hidden": "true" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                MenuIcon,
                {
                  icon: override.icon,
                  fallback: FallbackIcon,
                  className: "h-4 w-4 text-gray-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-[140px]", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: defaultLabel }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-wide text-gray-400", children: slug })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: override.label ?? "",
                  placeholder: defaultLabel,
                  disabled: hidden,
                  className: "max-w-[180px]",
                  onChange: (e) => onPatch({ label: e.target.value })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-[180px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                IconPicker,
                {
                  value: toPickerValue(override.icon),
                  onChange: (val) => onPatch({ icon: val ?? void 0 }),
                  size: "sm",
                  allowImageUpload: true,
                  allowIconSelection: true
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => onPatch({ hidden: !hidden }),
                  className: `ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${hidden ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"}`,
                  "aria-label": hidden ? __("Show this menu item", "yatra") : __("Hide this menu item", "yatra"),
                  children: hidden ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-3 w-3" }),
                    __("Hidden", "yatra")
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3 w-3" }),
                    __("Visible", "yatra")
                  ] })
                }
              )
            ]
          }
        )
      ]
    }
  );
};
const WhiteLabel = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = reactExports.useState(DEFAULT_SETTINGS);
  const [activeSection, setActiveSection] = reactExports.useState("brand");
  const [draggingSlug, setDraggingSlug] = reactExports.useState(null);
  const [dropTarget, setDropTarget] = reactExports.useState(null);
  const [expandedSubmenus, setExpandedSubmenus] = reactExports.useState(
    () => new Set(DEFAULT_MENU_ITEMS.filter((m) => m.submenu).map((m) => m.slug))
  );
  const { openMediaLibrary } = useWordPressMedia({
    title: __("Select brand logo", "yatra"),
    buttonText: __("Use this image", "yatra"),
    multiple: false,
    library: { type: "image" }
  });
  const { data, isLoading } = useQuery({
    queryKey: ["white-label-settings"],
    queryFn: async () => {
      const response = await apiClient.get("/white-label/settings");
      return response;
    }
  });
  reactExports.useEffect(() => {
    if (data == null ? void 0 : data.data) {
      setForm({
        ...DEFAULT_SETTINGS,
        ...data.data,
        menu_overrides: data.data.menu_overrides ?? {},
        menu_order: toOrderMap(data.data.menu_order),
        ui_chrome: data.data.ui_chrome ?? {},
        theme_surfaces: data.data.theme_surfaces ?? {}
      });
    }
  }, [data]);
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await apiClient.put("/white-label/settings", payload);
      return response;
    },
    onSuccess: () => {
      showToast(__("White Label settings saved.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["white-label-settings"] });
    },
    onError: (error) => {
      var _a, _b;
      const msg = ((_b = (_a = error == null ? void 0 : error.response) == null ? void 0 : _a.data) == null ? void 0 : _b.message) || __("Failed to save settings.", "yatra");
      showToast(msg, "error");
    }
  });
  const meta = data == null ? void 0 : data.meta;
  const isAgency = Boolean(meta == null ? void 0 : meta.is_agency_active);
  const isModuleEnabled = Boolean(meta == null ? void 0 : meta.is_module_enabled);
  const updateField = reactExports.useCallback(
    (key, value) => setForm((prev) => ({ ...prev, [key]: value })),
    []
  );
  const updateMenuOverride = reactExports.useCallback(
    (slug, patch) => {
      setForm((prev) => {
        const next = { ...prev.menu_overrides ?? {} };
        const current = next[slug] ?? {};
        const merged = { ...current, ...patch };
        if (merged.label === "") delete merged.label;
        if (merged.icon === "") delete merged.icon;
        if (merged.hidden === false) delete merged.hidden;
        if (Object.keys(merged).length === 0) {
          delete next[slug];
        } else {
          next[slug] = merged;
        }
        return { ...prev, menu_overrides: next };
      });
    },
    []
  );
  const toggleUiChrome = reactExports.useCallback((key) => {
    setForm((prev) => {
      const next = { ...prev.ui_chrome ?? {} };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return { ...prev, ui_chrome: next };
    });
  }, []);
  const handlePickLogo = reactExports.useCallback(() => {
    openMediaLibrary((attachment) => {
      if (attachment && !Array.isArray(attachment)) {
        updateField("logo_url", attachment.url);
      }
    });
  }, [openMediaLibrary, updateField]);
  const atoms = reactExports.useMemo(() => {
    const list = [];
    for (const item of DEFAULT_MENU_ITEMS) {
      list.push({
        key: item.slug,
        defaultParent: "",
        defaultLabel: item.label,
        defaultIconName: item.iconName
      });
      if (item.submenu) {
        for (const sub of item.submenu) {
          list.push({
            key: sub.key,
            defaultParent: item.slug,
            defaultLabel: sub.label,
            defaultIconName: sub.iconName
          });
        }
      }
    }
    return list;
  }, []);
  const atomMap = reactExports.useMemo(() => new Map(atoms.map((a) => [a.key, a])), [atoms]);
  const effectiveParent = reactExports.useCallback(
    (key) => {
      var _a, _b, _c;
      const ov = (_a = form.menu_overrides) == null ? void 0 : _a[key];
      if (ov && typeof ov.parent === "string") {
        if (ov.parent === "") return "";
        if (((_b = atomMap.get(ov.parent)) == null ? void 0 : _b.defaultParent) === "") return ov.parent;
      }
      return ((_c = atomMap.get(key)) == null ? void 0 : _c.defaultParent) ?? "";
    },
    [form.menu_overrides, atomMap]
  );
  const renderRows = reactExports.useMemo(() => {
    const orderMap = form.menu_order ?? {};
    const groups = /* @__PURE__ */ new Map();
    for (const atom of atoms) {
      const parent = effectiveParent(atom.key);
      if (parent === atom.key) continue;
      const list = groups.get(parent) ?? [];
      list.push(atom.key);
      groups.set(parent, list);
    }
    const orderGroup = (parent, group) => {
      const saved = orderMap[parent] ?? [];
      if (saved.length === 0) return group;
      const set = new Set(group);
      const seen = /* @__PURE__ */ new Set();
      const ordered = [];
      for (const k of saved) {
        if (set.has(k) && !seen.has(k)) {
          ordered.push(k);
          seen.add(k);
        }
      }
      for (const k of group) if (!seen.has(k)) ordered.push(k);
      return ordered;
    };
    const rows = [];
    for (const topKey of orderGroup("", groups.get("") ?? [])) {
      const topAtom = atomMap.get(topKey);
      if (!topAtom) continue;
      rows.push({ atom: topAtom, depth: 0, parent: "" });
      if (expandedSubmenus.has(topKey)) {
        for (const childKey of orderGroup(topKey, groups.get(topKey) ?? [])) {
          const childAtom = atomMap.get(childKey);
          if (childAtom)
            rows.push({ atom: childAtom, depth: 1, parent: topKey });
        }
      }
    }
    return rows;
  }, [atoms, atomMap, effectiveParent, form.menu_order, expandedSubmenus]);
  const hasChildrenByParent = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const atom of atoms) {
      const parent = effectiveParent(atom.key);
      if (parent === "") continue;
      map.set(parent, true);
    }
    return map;
  }, [atoms, effectiveParent]);
  const handleDragStart = reactExports.useCallback((key, e) => {
    setDraggingSlug(key);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  }, []);
  const handleRowDragOver = reactExports.useCallback(
    (key, e) => {
      if (!draggingSlug || draggingSlug === key) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const h = rect.height || 1;
      const ratio = Math.max(0, Math.min(1, y / h));
      const isHoveredTopLevel = effectiveParent(key) === "";
      const draggedAtom = atomMap.get(draggingSlug);
      const isDescendantOfDragged = draggedAtom && draggedAtom.defaultParent === "" && effectiveParent(key) === draggingSlug;
      let position;
      if (isHoveredTopLevel && !isDescendantOfDragged) {
        if (ratio < 0.25) position = "above";
        else if (ratio > 0.75) position = "below";
        else position = "into";
      } else {
        position = ratio < 0.5 ? "above" : "below";
      }
      setDropTarget(
        (prev) => prev && prev.key === key && prev.position === position ? prev : { key, position }
      );
    },
    [draggingSlug, effectiveParent, atomMap]
  );
  const handleRowDragLeave = reactExports.useCallback(() => {
  }, []);
  const handleDragEnd = reactExports.useCallback(() => {
    setDraggingSlug(null);
    setDropTarget(null);
  }, []);
  const handleRowDrop = reactExports.useCallback(
    (targetKey, e) => {
      e.preventDefault();
      const src = draggingSlug;
      const drop = dropTarget;
      setDraggingSlug(null);
      setDropTarget(null);
      if (!src || src === targetKey || !drop || drop.key !== targetKey) return;
      const srcAtom = atomMap.get(src);
      const targetAtom = atomMap.get(targetKey);
      if (!srcAtom || !targetAtom) return;
      let newParent;
      if (drop.position === "into") {
        if (targetAtom.defaultParent !== "") return;
        newParent = targetKey;
      } else {
        newParent = effectiveParent(targetKey);
      }
      const parentAtom = atomMap.get(newParent);
      if (newParent !== "" && parentAtom && parentAtom.defaultParent !== "") {
        return;
      }
      if (newParent === src) return;
      const parentEffective = newParent === "" ? "" : effectiveParent(newParent);
      if (parentEffective === src) return;
      setForm((prev) => {
        const overrides = { ...prev.menu_overrides ?? {} };
        const orderMap = toOrderMap(prev.menu_order);
        {
          const ov = { ...overrides[src] ?? {} };
          if (newParent === srcAtom.defaultParent) {
            delete ov.parent;
          } else {
            ov.parent = newParent;
          }
          if (Object.keys(ov).length === 0) {
            delete overrides[src];
          } else {
            overrides[src] = ov;
          }
        }
        const effectiveWithNew = (key) => {
          var _a, _b;
          const ov = overrides[key];
          if (ov && typeof ov.parent === "string") {
            if (ov.parent === "") return "";
            if (((_a = atomMap.get(ov.parent)) == null ? void 0 : _a.defaultParent) === "") return ov.parent;
          }
          return ((_b = atomMap.get(key)) == null ? void 0 : _b.defaultParent) ?? "";
        };
        for (const [p, list] of Object.entries(orderMap)) {
          orderMap[p] = list.filter((k) => k !== src);
        }
        const destGroup = atoms.filter((a) => a.key !== src && effectiveWithNew(a.key) === newParent).map((a) => a.key);
        const existing = orderMap[newParent] ?? [];
        const seeded = [];
        const seen = /* @__PURE__ */ new Set();
        for (const k of existing) {
          if (destGroup.includes(k) && !seen.has(k)) {
            seeded.push(k);
            seen.add(k);
          }
        }
        for (const k of destGroup) {
          if (!seen.has(k)) seeded.push(k);
        }
        if (drop.position === "into") {
          seeded.push(src);
        } else {
          const targetIdx = seeded.indexOf(targetKey);
          if (targetIdx === -1) {
            seeded.push(src);
          } else {
            const insertIdx = drop.position === "above" ? targetIdx : targetIdx + 1;
            seeded.splice(insertIdx, 0, src);
          }
        }
        orderMap[newParent] = seeded;
        return {
          ...prev,
          menu_overrides: overrides,
          menu_order: orderMap
        };
      });
    },
    [draggingSlug, dropTarget, atomMap, effectiveParent, atoms]
  );
  const toggleSubmenuExpanded = reactExports.useCallback((slug) => {
    setExpandedSubmenus((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ModulePageSkeleton, { variant: "form" });
  }
  if (!isAgency) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        PageHeader,
        {
          description: __("Rebrand Yatra as your own product.", "yatra")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(UpgradeCard, { meta })
    ] });
  }
  const onSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };
  const renderBrand = () => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Brand identity", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __("Shown in the admin menu, plugin list, and PDFs.", "yatra") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "grid gap-4 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "plugin_name", children: __("Plugin name", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "plugin_name",
            value: form.plugin_name,
            placeholder: "Yatra",
            onChange: (e) => updateField("plugin_name", e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "company_name", children: __("Company / Author", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "company_name",
            value: form.company_name,
            placeholder: "MantraBrain",
            onChange: (e) => updateField("company_name", e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "website_url", children: __("Website URL", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "website_url",
            type: "url",
            value: form.website_url,
            placeholder: "https://your-agency.com",
            onChange: (e) => updateField("website_url", e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "support_url", children: __("Support URL", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "support_url",
            type: "url",
            value: form.support_url,
            placeholder: "https://your-agency.com/support",
            onChange: (e) => updateField("support_url", e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 md:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "logo_url", children: __("Logo", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start gap-3", children: [
          form.logo_url ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: form.logo_url,
                alt: __("Brand logo preview", "yatra"),
                className: "max-h-full max-w-full object-contain"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => updateField("logo_url", ""),
                className: "absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-gray-600 shadow hover:text-red-600 dark:bg-gray-900/80 dark:text-gray-300",
                "aria-label": __("Remove logo", "yatra"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" })
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-900/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-6 w-6" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 min-w-0 flex-col gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: handlePickLogo,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "mr-2 h-4 w-4" }),
                    form.logo_url ? __("Change logo", "yatra") : __("Choose from media library", "yatra")
                  ]
                }
              ),
              form.logo_url && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  onClick: () => updateField("logo_url", ""),
                  children: __("Remove", "yatra")
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "logo_url",
                type: "url",
                value: form.logo_url,
                placeholder: "https://your-agency.com/logo.png",
                onChange: (e) => updateField("logo_url", e.target.value)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
              "Used for the admin menu icon and PDF header. Square PNG, 64×64 or larger recommended.",
              "yatra"
            ) })
          ] })
        ] })
      ] })
    ] })
  ] });
  const renderTheme = () => {
    const updateSurface = (key, value) => {
      setForm((prev) => {
        const next = { ...prev.theme_surfaces ?? {} };
        if (value === "") {
          delete next[key];
        } else {
          next[key] = value;
        }
        return { ...prev, theme_surfaces: next };
      });
    };
    const applyPreset = (surfaces) => {
      setForm((prev) => ({ ...prev, theme_surfaces: { ...surfaces } }));
    };
    const surfaceFields = [
      {
        key: "sidebar_bg",
        label: __("Sidebar background", "yatra"),
        fallback: "#ffffff"
      },
      {
        key: "sidebar_text",
        label: __("Sidebar text", "yatra"),
        fallback: "#374151"
      },
      {
        key: "topbar_bg",
        label: __("Top bar background", "yatra"),
        fallback: "#ffffff"
      },
      {
        key: "topbar_text",
        label: __("Top bar text", "yatra"),
        fallback: "#111827"
      }
    ];
    const hasAnySurface = Object.values(form.theme_surfaces ?? {}).some(
      (v) => typeof v === "string" && v !== ""
    );
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Palette, { className: "h-4 w-4 text-gray-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Color scheme", "yatra") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
            "Brand accent color used for buttons, active menu items, and badges across the admin.",
            "yatra"
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "color",
                value: form.primary_color || "#2563eb",
                onChange: (e) => updateField("primary_color", e.target.value),
                className: "h-10 w-12 cursor-pointer rounded border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800",
                "aria-label": __("Pick brand accent color", "yatra")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: form.primary_color,
                placeholder: "#2563eb",
                onChange: (e) => updateField("primary_color", e.target.value),
                className: "max-w-[200px]"
              }
            ),
            form.primary_color && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "ghost",
                onClick: () => updateField("primary_color", ""),
                children: __("Reset to default", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: [
            { label: "Yatra Blue", color: "" },
            { label: "Emerald", color: "#10b981" },
            { label: "Indigo", color: "#6366f1" },
            { label: "Rose", color: "#f43f5e" },
            { label: "Slate", color: "#475569" },
            { label: "Amber", color: "#d97706" }
          ].map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => updateField("primary_color", preset.color),
              className: "inline-flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: "inline-block h-4 w-4 rounded-sm border border-gray-200 dark:border-gray-700",
                    style: { background: preset.color || "#2563eb" }
                  }
                ),
                preset.label
              ]
            },
            preset.label
          )) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-gray-500 dark:text-gray-400", children: __("Leave blank to keep the default Yatra blue.", "yatra") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4 text-gray-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Theme", "yatra") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
            "Like a custom light/dark mode — pick a preset to repaint the sidebar and top bar in one click, or fine-tune the four colors below.",
            "yatra"
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex flex-wrap gap-2", children: [
            THEME_PRESETS.map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => applyPreset(preset.surfaces),
                className: "inline-flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex h-4 w-4 overflow-hidden rounded-sm border border-gray-200 dark:border-gray-700", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: "block w-1/2",
                        style: { background: preset.surfaces.sidebar_bg }
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: "block w-1/2",
                        style: { background: preset.surfaces.topbar_bg }
                      }
                    )
                  ] }),
                  preset.label
                ]
              },
              preset.label
            )),
            hasAnySurface && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => updateField("theme_surfaces", {}),
                className: "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-200",
                children: __("Reset theme", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-2", children: surfaceFields.map(({ key, label, fallback }) => {
            const value = (form.theme_surfaces ?? {})[key] ?? "";
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center gap-2 rounded-md border border-gray-200 p-2 dark:border-gray-700",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "color",
                      value: value || fallback,
                      onChange: (e) => updateSurface(key, e.target.value),
                      className: "h-9 w-10 cursor-pointer rounded border border-gray-300 bg-white p-1 dark:border-gray-600 dark:bg-gray-800",
                      "aria-label": label
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-gray-700 dark:text-gray-200", children: label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        value,
                        placeholder: fallback,
                        onChange: (e) => updateSurface(key, e.target.value),
                        className: "mt-1 max-w-full"
                      }
                    )
                  ] }),
                  value && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => updateSurface(key, ""),
                      className: "text-xs text-gray-400 hover:text-red-600",
                      "aria-label": __("Clear this color", "yatra"),
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" })
                    }
                  )
                ]
              },
              key
            );
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs text-gray-500 dark:text-gray-400", children: __(
            "Each color is independent — clear one to fall back to its Yatra default while keeping the others.",
            "yatra"
          ) })
        ] })
      ] })
    ] });
  };
  const renderMenu = () => {
    const hasAnyOverrides = Object.keys(form.menu_order ?? {}).length > 0 || Object.values(form.menu_overrides ?? {}).some(
      (ov) => ov && ov.parent !== void 0
    );
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Sidebar menu", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "Drag items to reorder, nest, or promote — like the WordPress Menus screen. Drop on the top or bottom edge of a row to place above or below; drop on the middle of a top-level row to nest the item underneath. Nesting is one level deep.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-2", children: renderRows.map((row) => {
          var _a;
          const ov = ((_a = form.menu_overrides) == null ? void 0 : _a[row.atom.key]) ?? {};
          const effectiveOwnParent = effectiveParent(row.atom.key);
          const isTopLevel = effectiveOwnParent === "";
          const showsChildren = isTopLevel && hasChildrenByParent.has(row.atom.key);
          const expanded = expandedSubmenus.has(row.atom.key);
          const isDropTarget = dropTarget !== null && dropTarget.key === row.atom.key && draggingSlug !== row.atom.key;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              style: row.depth > 0 ? { marginLeft: 32 } : void 0,
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-stretch gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MenuRow,
                  {
                    slug: row.atom.key,
                    defaultLabel: row.atom.defaultLabel,
                    defaultIconName: row.atom.defaultIconName,
                    override: ov,
                    isSubmenu: row.depth > 0,
                    draggable: true,
                    isDragging: draggingSlug === row.atom.key,
                    dropPosition: isDropTarget ? dropTarget.position : null,
                    onDragStart: (e) => handleDragStart(row.atom.key, e),
                    onDragOver: (e) => handleRowDragOver(row.atom.key, e),
                    onDragEnd: handleDragEnd,
                    onDragLeave: handleRowDragLeave,
                    onDrop: (e) => handleRowDrop(row.atom.key, e),
                    onPatch: (patch) => updateMenuOverride(row.atom.key, patch)
                  }
                ) }),
                showsChildren && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => toggleSubmenuExpanded(row.atom.key),
                    className: "inline-flex items-center justify-center rounded-md border border-gray-200 px-2 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800",
                    "aria-expanded": expanded,
                    "aria-label": __("Toggle submenu", "yatra"),
                    children: expanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" })
                  }
                )
              ] })
            },
            row.atom.key
          );
        }) }),
        hasAnyOverrides && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "ghost",
            onClick: () => {
              updateField("menu_order", {});
              setForm((prev) => {
                const next = { ...prev.menu_overrides ?? {} };
                for (const [key, ov] of Object.entries(next)) {
                  if (ov && ov.parent !== void 0) {
                    const stripped = { ...ov };
                    delete stripped.parent;
                    if (Object.keys(stripped).length === 0) {
                      delete next[key];
                    } else {
                      next[key] = stripped;
                    }
                  }
                }
                return { ...prev, menu_overrides: next };
              });
            },
            children: __("Reset structure to default", "yatra")
          }
        ) })
      ] })
    ] });
  };
  const renderChrome = () => {
    const items = [
      {
        key: "hideVersion",
        label: __("Hide version number", "yatra"),
        description: __(
          'Removes the small "v3.0.4" tag shown next to the brand name in the sidebar header.',
          "yatra"
        )
      },
      {
        key: "hideBackToWp",
        label: __('Hide "Back to WordPress" link', "yatra"),
        description: __(
          "Removes the link from the top bar AND the sidebar footer so clients don't see the wp-admin escape hatch.",
          "yatra"
        )
      },
      {
        key: "hideJoinCommunity",
        label: __('Hide "Join Community" link', "yatra"),
        description: __(
          "Removes the Facebook community button from the top bar.",
          "yatra"
        )
      }
    ];
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("UI chrome", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "Hide or show specific pieces of admin chrome — useful when delivering the app to clients who shouldn't be reminded of the underlying platform.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: items.map((item) => {
        var _a;
        const checked = !((_a = form.ui_chrome) == null ? void 0 : _a[item.key]);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "label",
          {
            className: "flex items-start gap-3 rounded-md border border-gray-200 p-3 dark:border-gray-700",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  className: "mt-1",
                  checked: !checked,
                  onChange: () => toggleUiChrome(item.key),
                  "aria-label": item.label
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: item.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: item.description })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${checked ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`,
                  children: checked ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3 w-3" }),
                    __("Visible", "yatra")
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-3 w-3" }),
                    __("Hidden", "yatra")
                  ] })
                }
              )
            ]
          },
          item.key
        );
      }) })
    ] });
  };
  const currentSection = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        description: __(
          "Replace Yatra/MantraBrain branding shown in the admin and on PDFs.",
          "yatra"
        )
      }
    ),
    !isModuleEnabled && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex items-start gap-3 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "mt-0.5 h-5 w-5 text-amber-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: __("Module disabled", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-300", children: __(
          "Your Agency license is active, but the White Label module is not enabled yet. Enable it from the Modules page so branding overrides take effect.",
          "yatra"
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "a",
          {
            className: "mt-1 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400",
            href: "admin.php?page=yatra&subpage=modules",
            children: __("Go to Modules →", "yatra")
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("form", { onSubmit, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-[240px_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "lg:sticky lg:top-4 lg:self-start", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex flex-col gap-1", children: SECTIONS.map((section) => {
          const Icon = section.icon;
          const active = section.id === activeSection;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => setActiveSection(section.id),
              className: `flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${active ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 truncate", children: section.label })
              ]
            },
            section.id
          );
        }) }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 px-2 text-xs text-gray-500 dark:text-gray-400", children: currentSection.description })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        activeSection === "brand" && renderBrand(),
        activeSection === "theme" && renderTheme(),
        activeSection === "menu" && renderMenu(),
        activeSection === "chrome" && renderChrome(),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: saveMutation.isPending, children: saveMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
            __("Saving…", "yatra")
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-2 h-4 w-4" }),
            __("Save White Label settings", "yatra")
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "-mt-0.5 mr-1 inline h-3 w-3" }),
            __("Saves all sections at once.", "yatra")
          ] })
        ] })
      ] })
    ] }) })
  ] });
};
export {
  WhiteLabel as default
};
//# sourceMappingURL=WhiteLabel-8i10Kntk.js.map
