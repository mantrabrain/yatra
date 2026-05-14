import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Crown,
  ExternalLink,
  Save,
  Loader2,
  Lock,
  Image as ImageIcon,
  X,
  Eye,
  EyeOff,
  Palette,
  Sparkles,
  Layout as LayoutIcon,
  PanelLeft,
  GripVertical,
  Wrench,
  Building2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { apiClient } from "../lib/api-client";
import { __ } from "../lib/i18n";
import { useToast } from "../components/ui/toast";
import { useWordPressMedia } from "../hooks/useWordPressMedia";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { IconPicker } from "../components/ui/icon-picker";
import type { IconPickerValue } from "../lib/icon-picker-types";
import { PageHeader } from "../components/common/PageHeader";
import { MenuIcon } from "../lib/menu-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  DEFAULT_MENU_ITEMS,
  type MenuIconValue,
  type MenuItemOverride,
  type MenuOrderMap,
  type MenuOverrides,
  type UiChromeFlags,
} from "../lib/sidebar-menu-defaults";
import { ICON_MAP } from "../lib/icon-map";

/**
 * Coerce the stored override icon into an IconPickerValue for the picker.
 * Lucide-string overrides display as the IconPicker's empty state — users
 * see the default Lucide icon in the row's preview but the picker itself
 * starts blank, which is the expected behavior since IconPicker doesn't
 * know about Lucide.
 */
function toPickerValue(icon: MenuIconValue | undefined): IconPickerValue | null {
  if (!icon) return null;
  if (typeof icon === "string") return null;
  return icon;
}

interface ThemeSurfaces {
  sidebar_bg?: string;
  sidebar_text?: string;
  topbar_bg?: string;
  topbar_text?: string;
}

interface WhiteLabelSettings {
  plugin_name: string;
  company_name: string;
  website_url: string;
  support_url: string;
  logo_url: string;
  primary_color: string;
  menu_overrides: MenuOverrides;
  /**
   * Per-parent ordered list. The "" key is the top-level order; each
   * top-level slug key holds that parent's ordered children. Backwards
   * compatible with the older flat array form (handled on read).
   */
  menu_order: MenuOrderMap | string[];
  ui_chrome: UiChromeFlags;
  /**
   * Soft "theme" overrides — sidebar + topbar background and text
   * colors. Empty / missing keys fall back to Yatra's default
   * light/dark palette.
   */
  theme_surfaces: ThemeSurfaces;
}

/** Quick-pick theme palettes for the Theme card. */
const THEME_PRESETS: Array<{
  label: string;
  surfaces: Required<ThemeSurfaces>;
}> = [
  {
    label: "Light",
    surfaces: {
      sidebar_bg: "#ffffff",
      sidebar_text: "#374151",
      topbar_bg: "#ffffff",
      topbar_text: "#111827",
    },
  },
  {
    label: "Dark",
    surfaces: {
      sidebar_bg: "#111827",
      sidebar_text: "#e5e7eb",
      topbar_bg: "#111827",
      topbar_text: "#f9fafb",
    },
  },
  {
    label: "Midnight",
    surfaces: {
      sidebar_bg: "#0f172a",
      sidebar_text: "#94a3b8",
      topbar_bg: "#1e293b",
      topbar_text: "#e2e8f0",
    },
  },
  {
    label: "Ocean",
    surfaces: {
      sidebar_bg: "#0c4a6e",
      sidebar_text: "#e0f2fe",
      topbar_bg: "#075985",
      topbar_text: "#f0f9ff",
    },
  },
  {
    label: "Sand",
    surfaces: {
      sidebar_bg: "#fef3c7",
      sidebar_text: "#78350f",
      topbar_bg: "#fef9c3",
      topbar_text: "#854d0e",
    },
  },
  {
    label: "Forest",
    surfaces: {
      sidebar_bg: "#064e3b",
      sidebar_text: "#d1fae5",
      topbar_bg: "#065f46",
      topbar_text: "#ecfdf5",
    },
  },
];

interface WhiteLabelMeta {
  is_pro_active: boolean;
  is_agency_active: boolean;
  is_module_enabled: boolean;
  agency: {
    is_agency?: boolean;
    tier?: string;
    price_id?: number | null;
    agency_price_ids?: number[];
  };
  upgrade_url: string;
  license_page_url: string;
}

interface WhiteLabelResponse {
  data: WhiteLabelSettings;
  meta: WhiteLabelMeta;
}

type SectionId = "brand" | "theme" | "menu" | "chrome";

interface SectionDef {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const SECTIONS: SectionDef[] = [
  {
    id: "brand",
    label: "Brand Identity",
    icon: Building2,
    description:
      "Plugin name, company, URLs, and logo shown across the admin and PDFs.",
  },
  {
    id: "theme",
    label: "Theme",
    icon: Palette,
    description:
      "Brand accent color, plus surface theme — sidebar and top bar background + text colors. Pick a preset or fine-tune each color.",
  },
  {
    id: "menu",
    label: "Sidebar Menu",
    icon: PanelLeft,
    description: "Reorder, rename, re-icon, or hide entries in the Yatra sidebar.",
  },
  {
    id: "chrome",
    label: "UI Chrome",
    icon: LayoutIcon,
    description:
      "Show or hide the version number, Back to WordPress link, and Join Community button.",
  },
];

const DEFAULT_SETTINGS: WhiteLabelSettings = {
  plugin_name: "",
  company_name: "",
  website_url: "",
  support_url: "",
  logo_url: "",
  primary_color: "",
  menu_overrides: {},
  menu_order: {},
  ui_chrome: {},
  theme_surfaces: {},
};

/** Normalize stored order (flat array OR map) to a map keyed by parent. */
function toOrderMap(raw: MenuOrderMap | string[] | undefined): MenuOrderMap {
  if (!raw) return {};
  if (Array.isArray(raw)) return { "": [...raw] };
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? [...v] : []]),
  );
}

/* -------------------------------------------------------------------------- */
/*  Upgrade card (non-Agency)                                                 */
/* -------------------------------------------------------------------------- */

const UpgradeCard: React.FC<{ meta?: WhiteLabelMeta }> = ({ meta }) => {
  const upgradeUrl =
    meta?.upgrade_url || "https://wpyatra.com/pricing?module=white-label";
  const licensePageUrl =
    meta?.license_page_url || "admin.php?page=yatra&subpage=license";

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>{__("Agency plan required", "yatra")}</CardTitle>
            <CardDescription>
              {__(
                "White Label is exclusive to the Yatra Pro Agency plan (Yearly or Lifetime).",
                "yatra",
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {__(
            "Rebrand the entire Yatra plugin as your own product — admin menu, plugin list, and PDFs — and remove every reference to Yatra or MantraBrain from what your clients see.",
            "yatra",
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button asChild>
            <a href={upgradeUrl} target="_blank" rel="noopener noreferrer">
              {meta?.is_pro_active
                ? __("Upgrade to Agency", "yatra")
                : __("Get Yatra Pro Agency", "yatra")}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          {meta?.is_pro_active && (
            <Button variant="outline" asChild>
              <a href={licensePageUrl}>{__("Manage License", "yatra")}</a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/*  Menu customization row (top-level + submenu)                              */
/* -------------------------------------------------------------------------- */

interface MenuRowProps {
  slug: string;
  defaultLabel: string;
  defaultIconName: string;
  override: MenuItemOverride;
  isSubmenu?: boolean;
  draggable?: boolean;
  isDragging?: boolean;
  /** Where this row would receive the drop relative to itself. */
  dropPosition?: "above" | "into" | "below" | null;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  onPatch: (patch: Partial<MenuItemOverride>) => void;
}

const MenuRow: React.FC<MenuRowProps> = ({
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
  onPatch,
}) => {
  const FallbackIcon = ICON_MAP[defaultIconName] || ICON_MAP.Settings;
  const hidden = Boolean(override.hidden);

  return (
    <div
      className="relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drop indicator: thin bar above */}
      {dropPosition === "above" && (
        <div
          className="pointer-events-none absolute -top-1 left-0 right-0 z-10 h-1 rounded bg-blue-500 shadow"
          aria-hidden="true"
        />
      )}
      {/* Drop indicator: thin bar below */}
      {dropPosition === "below" && (
        <div
          className="pointer-events-none absolute -bottom-1 left-0 right-0 z-10 h-1 rounded bg-blue-500 shadow"
          aria-hidden="true"
        />
      )}

      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={`flex items-center gap-3 rounded-md border px-3 py-2 transition-shadow ${
          isDragging
            ? "border-blue-400 bg-blue-50 opacity-60 dark:border-blue-500 dark:bg-blue-900/20"
            : dropPosition === "into"
              ? "border-blue-400 bg-blue-50 ring-2 ring-blue-400 dark:border-blue-500 dark:bg-blue-900/30"
              : isSubmenu
                ? "border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40"
                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
        }`}
      >
      {draggable ? (
        <button
          type="button"
          className="cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-200"
          aria-label={__("Drag to reorder", "yatra")}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : (
        <span className="inline-block w-4" aria-hidden="true" />
      )}

      <MenuIcon
        icon={override.icon}
        fallback={FallbackIcon}
        className="h-4 w-4 text-gray-500"
      />

      <div className="min-w-[140px]">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {defaultLabel}
        </div>
        <div className="text-[10px] uppercase tracking-wide text-gray-400">
          {slug}
        </div>
      </div>

      <Input
        value={override.label ?? ""}
        placeholder={defaultLabel}
        disabled={hidden}
        className="max-w-[180px]"
        onChange={(e) => onPatch({ label: e.target.value })}
      />

      <div className="min-w-[180px]">
        <IconPicker
          value={toPickerValue(override.icon)}
          onChange={(val) =>
            onPatch({ icon: val ?? undefined })
          }
          size="sm"
          allowImageUpload
          allowIconSelection
        />
      </div>

      <button
        type="button"
        onClick={() => onPatch({ hidden: !hidden })}
        className={`ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
          hidden
            ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
        }`}
        aria-label={
          hidden
            ? __("Show this menu item", "yatra")
            : __("Hide this menu item", "yatra")
        }
      >
        {hidden ? (
          <>
            <EyeOff className="h-3 w-3" />
            {__("Hidden", "yatra")}
          </>
        ) : (
          <>
            <Eye className="h-3 w-3" />
            {__("Visible", "yatra")}
          </>
        )}
      </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Main page                                                                 */
/* -------------------------------------------------------------------------- */

const WhiteLabel: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<WhiteLabelSettings>(DEFAULT_SETTINGS);
  const [activeSection, setActiveSection] = useState<SectionId>("brand");
  const [draggingSlug, setDraggingSlug] = useState<string | null>(null);
  /**
   * Where the dragged row would land if dropped right now. `position` is
   * derived from the mouse Y offset within the hovered row:
   *   - `above` — insert just above the hovered row (same indent)
   *   - `into`  — make the hovered row a parent, dragged row becomes its
   *               last child (only valid when hovering a top-level row)
   *   - `below` — insert just below the hovered row (same indent)
   */
  const [dropTarget, setDropTarget] = useState<{
    key: string;
    position: "above" | "into" | "below";
  } | null>(null);
  // Start with every parent expanded so users see / can manage children
  // without an extra interaction. Collapsing remains on a per-row click.
  const [expandedSubmenus, setExpandedSubmenus] = useState<Set<string>>(
    () => new Set(DEFAULT_MENU_ITEMS.filter((m) => m.submenu).map((m) => m.slug)),
  );

  const { openMediaLibrary } = useWordPressMedia({
    title: __("Select brand logo", "yatra"),
    buttonText: __("Use this image", "yatra"),
    multiple: false,
    library: { type: "image" },
  });

  const { data, isLoading } = useQuery<WhiteLabelResponse>({
    queryKey: ["white-label-settings"],
    queryFn: async () => {
      const response = await apiClient.get("/white-label/settings");
      return response as WhiteLabelResponse;
    },
  });

  useEffect(() => {
    if (data?.data) {
      setForm({
        ...DEFAULT_SETTINGS,
        ...data.data,
        menu_overrides: data.data.menu_overrides ?? {},
        menu_order: toOrderMap(data.data.menu_order),
        ui_chrome: data.data.ui_chrome ?? {},
        theme_surfaces: data.data.theme_surfaces ?? {},
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: WhiteLabelSettings) => {
      const response = await apiClient.put("/white-label/settings", payload);
      return response as WhiteLabelResponse;
    },
    onSuccess: () => {
      showToast(__("White Label settings saved.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["white-label-settings"] });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        __("Failed to save settings.", "yatra");
      showToast(msg, "error");
    },
  });

  const meta = data?.meta;
  const isAgency = Boolean(meta?.is_agency_active);
  const isModuleEnabled = Boolean(meta?.is_module_enabled);

  const updateField = useCallback(
    <K extends keyof WhiteLabelSettings>(
      key: K,
      value: WhiteLabelSettings[K],
    ) => setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const updateMenuOverride = useCallback(
    (slug: string, patch: Partial<MenuItemOverride>) => {
      setForm((prev) => {
        const next = { ...(prev.menu_overrides ?? {}) };
        const current = next[slug] ?? {};
        const merged: MenuItemOverride = { ...current, ...patch };
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
    [],
  );

  const toggleUiChrome = useCallback(
    (key: keyof UiChromeFlags) => {
      setForm((prev) => {
        const next = { ...(prev.ui_chrome ?? {}) };
        if (next[key]) {
          delete next[key];
        } else {
          next[key] = true;
        }
        return { ...prev, ui_chrome: next };
      });
    },
    [],
  );

  const handlePickLogo = useCallback(() => {
    openMediaLibrary((attachment) => {
      if (attachment && !Array.isArray(attachment)) {
        updateField("logo_url", attachment.url);
      }
    });
  }, [openMediaLibrary, updateField]);

  /**
   * Compute the ordered list of top-level slugs to display in the menu
   * customization tab. Honors any saved menu_order, then appends defaults
   * the user hasn't touched yet (so newly-added Yatra menus surface
   * automatically without requiring a settings rewrite).
   */
  /**
   * Flat registry of every known menu atom (top-level + submenu),
   * each with its default parent. The effective tree is computed by
   * overlaying menu_overrides[key].parent and menu_order on this.
   */
  interface MenuAtom {
    key: string;
    defaultParent: string;
    defaultLabel: string;
    defaultIconName: string;
  }

  const atoms = useMemo<MenuAtom[]>(() => {
    const list: MenuAtom[] = [];
    for (const item of DEFAULT_MENU_ITEMS) {
      list.push({
        key: item.slug,
        defaultParent: "",
        defaultLabel: item.label,
        defaultIconName: item.iconName,
      });
      if (item.submenu) {
        for (const sub of item.submenu) {
          list.push({
            key: sub.key,
            defaultParent: item.slug,
            defaultLabel: sub.label,
            defaultIconName: sub.iconName,
          });
        }
      }
    }
    return list;
  }, []);

  const atomMap = useMemo(
    () => new Map(atoms.map((a) => [a.key, a])),
    [atoms],
  );

  /** Effective parent for an atom (override.parent wins, else default). */
  const effectiveParent = useCallback(
    (key: string): string => {
      const ov = form.menu_overrides?.[key];
      if (ov && typeof ov.parent === "string") {
        if (ov.parent === "") return "";
        if (atomMap.get(ov.parent)?.defaultParent === "") return ov.parent;
      }
      return atomMap.get(key)?.defaultParent ?? "";
    },
    [form.menu_overrides, atomMap],
  );

  /**
   * Compute the ordered tree the table renders. Returns a flat list of
   * { atom, parent, depth } in render order. Reordering happens by
   * mutating form.menu_order[parent]; cross-parent moves go through
   * the Move-to dropdown which updates menu_overrides[key].parent.
   */
  const renderRows = useMemo(() => {
    const orderMap = (form.menu_order ?? {}) as MenuOrderMap;

    const groups = new Map<string, string[]>();
    for (const atom of atoms) {
      const parent = effectiveParent(atom.key);
      if (parent === atom.key) continue;
      const list = groups.get(parent) ?? [];
      list.push(atom.key);
      groups.set(parent, list);
    }

    const orderGroup = (parent: string, group: string[]): string[] => {
      const saved = orderMap[parent] ?? [];
      if (saved.length === 0) return group;
      const set = new Set(group);
      const seen = new Set<string>();
      const ordered: string[] = [];
      for (const k of saved) {
        if (set.has(k) && !seen.has(k)) {
          ordered.push(k);
          seen.add(k);
        }
      }
      for (const k of group) if (!seen.has(k)) ordered.push(k);
      return ordered;
    };

    type Row = { atom: MenuAtom; depth: number; parent: string };
    const rows: Row[] = [];
    for (const topKey of orderGroup("", groups.get("") ?? [])) {
      const topAtom = atomMap.get(topKey);
      if (!topAtom) continue;
      rows.push({ atom: topAtom, depth: 0, parent: "" });
      if (expandedSubmenus.has(topKey)) {
        for (const childKey of orderGroup(topKey, groups.get(topKey) ?? [])) {
          const childAtom = atomMap.get(childKey);
          if (childAtom) rows.push({ atom: childAtom, depth: 1, parent: topKey });
        }
      }
    }
    return rows;
  }, [atoms, atomMap, effectiveParent, form.menu_order, expandedSubmenus]);

  /** Whether a top-level atom currently has any children rendered under it. */
  const hasChildrenByParent = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const atom of atoms) {
      const parent = effectiveParent(atom.key);
      if (parent === "") continue;
      map.set(parent, true);
    }
    return map;
  }, [atoms, effectiveParent]);

  const handleDragStart = useCallback((key: string, e: React.DragEvent) => {
    setDraggingSlug(key);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  }, []);

  /**
   * Decide the drop zone based on cursor Y within the hovered row.
   *
   *   Top-level rows (can accept children):
   *     0–25%   → above
   *     25–75%  → into  (becomes last child of this row)
   *     75–100% → below
   *
   *   Submenu rows (cannot have grandchildren):
   *     0–50%   → above
   *     50–100% → below
   *
   * The above/below decision uses the hovered row's own parent group, so
   * a submenu row's "above" drops into its parent's children list — which
   * is the natural place for the dragged item even when it came from a
   * different parent (in that case the move also reparents).
   */
  const handleRowDragOver = useCallback(
    (key: string, e: React.DragEvent) => {
      if (!draggingSlug || draggingSlug === key) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const h = rect.height || 1;
      const ratio = Math.max(0, Math.min(1, y / h));

      const isHoveredTopLevel = effectiveParent(key) === "";
      // Don't allow dropping a parent INTO one of its own descendants —
      // that would create a cycle. We resolve to above/below in that case.
      const draggedAtom = atomMap.get(draggingSlug);
      const isDescendantOfDragged =
        draggedAtom &&
        draggedAtom.defaultParent === "" &&
        effectiveParent(key) === draggingSlug;

      let position: "above" | "into" | "below";
      if (isHoveredTopLevel && !isDescendantOfDragged) {
        if (ratio < 0.25) position = "above";
        else if (ratio > 0.75) position = "below";
        else position = "into";
      } else {
        position = ratio < 0.5 ? "above" : "below";
      }

      setDropTarget((prev) =>
        prev && prev.key === key && prev.position === position
          ? prev
          : { key, position },
      );
    },
    [draggingSlug, effectiveParent, atomMap],
  );

  const handleRowDragLeave = useCallback(() => {
    // Don't clear on every leave — sibling enter immediately overwrites.
    // We only clear on dragend / drop. This keeps the indicator stable.
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingSlug(null);
    setDropTarget(null);
  }, []);

  /**
   * The single drop handler — replaces the old reorder-only handler AND
   * the Move-to dropdown. Reorders within the same parent and reparents
   * across parents in one interaction (WordPress menus-style).
   */
  const handleRowDrop = useCallback(
    (targetKey: string, e: React.DragEvent) => {
      e.preventDefault();
      const src = draggingSlug;
      const drop = dropTarget;
      setDraggingSlug(null);
      setDropTarget(null);
      if (!src || src === targetKey || !drop || drop.key !== targetKey) return;

      const srcAtom = atomMap.get(src);
      const targetAtom = atomMap.get(targetKey);
      if (!srcAtom || !targetAtom) return;

      // Compute the destination parent based on drop position.
      let newParent: string;
      if (drop.position === "into") {
        // Only top-level rows accept "into" — guard handled in dragOver
        // but recheck here so a stale dropTarget can't sneak through.
        if (targetAtom.defaultParent !== "") return;
        newParent = targetKey;
      } else {
        newParent = effectiveParent(targetKey);
      }

      // Block one-level-deeper nesting (no grandchildren).
      const parentAtom = atomMap.get(newParent);
      if (newParent !== "" && parentAtom && parentAtom.defaultParent !== "") {
        return;
      }

      // Block making an atom its own ancestor.
      if (newParent === src) return;
      // Block making a top-level parent a child of one of its own
      // descendants (cycle prevention).
      const parentEffective = newParent === "" ? "" : effectiveParent(newParent);
      if (parentEffective === src) return;

      setForm((prev) => {
        const overrides: MenuOverrides = { ...(prev.menu_overrides ?? {}) };
        const orderMap = toOrderMap(prev.menu_order);

        // 1. Update src's parent override (clear if it matches default).
        {
          const ov: MenuItemOverride = { ...(overrides[src] ?? {}) };
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

        // Helper: with the just-updated overrides, what's an atom's parent?
        const effectiveWithNew = (key: string): string => {
          const ov = overrides[key];
          if (ov && typeof ov.parent === "string") {
            if (ov.parent === "") return "";
            if (atomMap.get(ov.parent)?.defaultParent === "") return ov.parent;
          }
          return atomMap.get(key)?.defaultParent ?? "";
        };

        // 2. Strip src from every group it might appear in.
        for (const [p, list] of Object.entries(orderMap)) {
          orderMap[p] = list.filter((k) => k !== src);
        }

        // 3. Build the destination group's current effective list, then
        //    insert src at the right index (above/below/into-append).
        const destGroup = atoms
          .filter((a) => a.key !== src && effectiveWithNew(a.key) === newParent)
          .map((a) => a.key);

        const existing = orderMap[newParent] ?? [];
        const seeded: string[] = [];
        const seen = new Set<string>();
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
            const insertIdx =
              drop.position === "above" ? targetIdx : targetIdx + 1;
            seeded.splice(insertIdx, 0, src);
          }
        }
        orderMap[newParent] = seeded;

        return {
          ...prev,
          menu_overrides: overrides,
          menu_order: orderMap,
        };
      });
    },
    [draggingSlug, dropTarget, atomMap, effectiveParent, atoms],
  );

  const toggleSubmenuExpanded = useCallback((slug: string) => {
    setExpandedSubmenus((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  /* ------------------------------- Renderers ------------------------------ */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAgency) {
    return (
      <div className="space-y-6">
        <PageHeader
          description={__("Rebrand Yatra as your own product.", "yatra")}
        />
        <UpgradeCard meta={meta} />
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const renderBrand = () => (
    <Card>
      <CardHeader>
        <CardTitle>{__("Brand identity", "yatra")}</CardTitle>
        <CardDescription>
          {__(
            "Shown in the admin menu, plugin list, and PDFs.",
            "yatra",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="plugin_name">{__("Plugin name", "yatra")}</Label>
          <Input
            id="plugin_name"
            value={form.plugin_name}
            placeholder="Yatra"
            onChange={(e) => updateField("plugin_name", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company_name">{__("Company / Author", "yatra")}</Label>
          <Input
            id="company_name"
            value={form.company_name}
            placeholder="MantraBrain"
            onChange={(e) => updateField("company_name", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website_url">{__("Website URL", "yatra")}</Label>
          <Input
            id="website_url"
            type="url"
            value={form.website_url}
            placeholder="https://your-agency.com"
            onChange={(e) => updateField("website_url", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="support_url">{__("Support URL", "yatra")}</Label>
          <Input
            id="support_url"
            type="url"
            value={form.support_url}
            placeholder="https://your-agency.com/support"
            onChange={(e) => updateField("support_url", e.target.value)}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="logo_url">{__("Logo", "yatra")}</Label>
          <div className="flex flex-wrap items-start gap-3">
            {form.logo_url ? (
              <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <img
                  src={form.logo_url}
                  alt={__("Brand logo preview", "yatra")}
                  className="max-h-full max-w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => updateField("logo_url", "")}
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-gray-600 shadow hover:text-red-600 dark:bg-gray-900/80 dark:text-gray-300"
                  aria-label={__("Remove logo", "yatra")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-900/40">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}
            <div className="flex flex-1 min-w-0 flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePickLogo}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {form.logo_url
                    ? __("Change logo", "yatra")
                    : __("Choose from media library", "yatra")}
                </Button>
                {form.logo_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => updateField("logo_url", "")}
                  >
                    {__("Remove", "yatra")}
                  </Button>
                )}
              </div>
              <Input
                id="logo_url"
                type="url"
                value={form.logo_url}
                placeholder="https://your-agency.com/logo.png"
                onChange={(e) => updateField("logo_url", e.target.value)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {__(
                  "Used for the admin menu icon and PDF header. Square PNG, 64×64 or larger recommended.",
                  "yatra",
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTheme = () => {
    const updateSurface = (
      key: keyof ThemeSurfaces,
      value: string,
    ) => {
      setForm((prev) => {
        const next = { ...(prev.theme_surfaces ?? {}) };
        if (value === "") {
          delete next[key];
        } else {
          next[key] = value;
        }
        return { ...prev, theme_surfaces: next };
      });
    };

    const applyPreset = (surfaces: Required<ThemeSurfaces>) => {
      setForm((prev) => ({ ...prev, theme_surfaces: { ...surfaces } }));
    };

    const surfaceFields: Array<{
      key: keyof ThemeSurfaces;
      label: string;
      fallback: string;
    }> = [
      { key: "sidebar_bg", label: __("Sidebar background", "yatra"), fallback: "#ffffff" },
      { key: "sidebar_text", label: __("Sidebar text", "yatra"), fallback: "#374151" },
      { key: "topbar_bg", label: __("Top bar background", "yatra"), fallback: "#ffffff" },
      { key: "topbar_text", label: __("Top bar text", "yatra"), fallback: "#111827" },
    ];

    const hasAnySurface = Object.values(form.theme_surfaces ?? {}).some(
      (v) => typeof v === "string" && v !== "",
    );

    return (
      <div className="space-y-4">
        {/* ------ Color Scheme (brand accent) ------------------------- */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-gray-500" />
              <CardTitle>{__("Color scheme", "yatra")}</CardTitle>
            </div>
            <CardDescription>
              {__(
                "Brand accent color used for buttons, active menu items, and badges across the admin.",
                "yatra",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={form.primary_color || "#2563eb"}
                onChange={(e) =>
                  updateField("primary_color", e.target.value)
                }
                className="h-10 w-12 cursor-pointer rounded border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800"
                aria-label={__("Pick brand accent color", "yatra")}
              />
              <Input
                value={form.primary_color}
                placeholder="#2563eb"
                onChange={(e) =>
                  updateField("primary_color", e.target.value)
                }
                className="max-w-[200px]"
              />
              {form.primary_color && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => updateField("primary_color", "")}
                >
                  {__("Reset to default", "yatra")}
                </Button>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: "Yatra Blue", color: "" },
                { label: "Emerald", color: "#10b981" },
                { label: "Indigo", color: "#6366f1" },
                { label: "Rose", color: "#f43f5e" },
                { label: "Slate", color: "#475569" },
                { label: "Amber", color: "#d97706" },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => updateField("primary_color", preset.color)}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <span
                    className="inline-block h-4 w-4 rounded-sm border border-gray-200 dark:border-gray-700"
                    style={{ background: preset.color || "#2563eb" }}
                  />
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {__("Leave blank to keep the default Yatra blue.", "yatra")}
            </p>
          </CardContent>
        </Card>

        {/* ------ Theme (sidebar + topbar surfaces) ------------------- */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gray-500" />
              <CardTitle>{__("Theme", "yatra")}</CardTitle>
            </div>
            <CardDescription>
              {__(
                "Like a custom light/dark mode — pick a preset to repaint the sidebar and top bar in one click, or fine-tune the four colors below.",
                "yatra",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Preset row */}
            <div className="mb-4 flex flex-wrap gap-2">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.surfaces)}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  {/* 4-dot swatch preview */}
                  <span className="inline-flex h-4 w-4 overflow-hidden rounded-sm border border-gray-200 dark:border-gray-700">
                    <span
                      className="block w-1/2"
                      style={{ background: preset.surfaces.sidebar_bg }}
                    />
                    <span
                      className="block w-1/2"
                      style={{ background: preset.surfaces.topbar_bg }}
                    />
                  </span>
                  {preset.label}
                </button>
              ))}
              {hasAnySurface && (
                <button
                  type="button"
                  onClick={() => updateField("theme_surfaces", {})}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {__("Reset theme", "yatra")}
                </button>
              )}
            </div>

            {/* Per-color editors */}
            <div className="grid gap-3 md:grid-cols-2">
              {surfaceFields.map(({ key, label, fallback }) => {
                const value = (form.theme_surfaces ?? {})[key] ?? "";
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 rounded-md border border-gray-200 p-2 dark:border-gray-700"
                  >
                    <input
                      type="color"
                      value={value || fallback}
                      onChange={(e) => updateSurface(key, e.target.value)}
                      className="h-9 w-10 cursor-pointer rounded border border-gray-300 bg-white p-1 dark:border-gray-600 dark:bg-gray-800"
                      aria-label={label}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-200">
                        {label}
                      </div>
                      <Input
                        value={value}
                        placeholder={fallback}
                        onChange={(e) => updateSurface(key, e.target.value)}
                        className="mt-1 max-w-full"
                      />
                    </div>
                    {value && (
                      <button
                        type="button"
                        onClick={() => updateSurface(key, "")}
                        className="text-xs text-gray-400 hover:text-red-600"
                        aria-label={__("Clear this color", "yatra")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {__(
                "Each color is independent — clear one to fall back to its Yatra default while keeping the others.",
                "yatra",
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderMenu = () => {
    const hasAnyOverrides =
      Object.keys(form.menu_order ?? {}).length > 0 ||
      Object.values(form.menu_overrides ?? {}).some(
        (ov) => ov && ov.parent !== undefined,
      );

    return (
      <Card>
        <CardHeader>
          <CardTitle>{__("Sidebar menu", "yatra")}</CardTitle>
          <CardDescription>
            {__(
              "Drag items to reorder, nest, or promote — like the WordPress Menus screen. Drop on the top or bottom edge of a row to place above or below; drop on the middle of a top-level row to nest the item underneath. Nesting is one level deep.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {renderRows.map((row) => {
              const ov = form.menu_overrides?.[row.atom.key] ?? {};
              const effectiveOwnParent = effectiveParent(row.atom.key);
              const isTopLevel = effectiveOwnParent === "";
              const showsChildren =
                isTopLevel && hasChildrenByParent.has(row.atom.key);
              const expanded = expandedSubmenus.has(row.atom.key);
              const isDropTarget =
                dropTarget !== null &&
                dropTarget.key === row.atom.key &&
                draggingSlug !== row.atom.key;
              return (
                <div
                  key={row.atom.key}
                  style={row.depth > 0 ? { marginLeft: 32 } : undefined}
                >
                  <div className="flex items-stretch gap-1">
                    <div className="flex-1">
                      <MenuRow
                        slug={row.atom.key}
                        defaultLabel={row.atom.defaultLabel}
                        defaultIconName={row.atom.defaultIconName}
                        override={ov}
                        isSubmenu={row.depth > 0}
                        draggable
                        isDragging={draggingSlug === row.atom.key}
                        dropPosition={isDropTarget ? dropTarget!.position : null}
                        onDragStart={(e) =>
                          handleDragStart(row.atom.key, e)
                        }
                        onDragOver={(e) =>
                          handleRowDragOver(row.atom.key, e)
                        }
                        onDragEnd={handleDragEnd}
                        onDragLeave={handleRowDragLeave}
                        onDrop={(e) => handleRowDrop(row.atom.key, e)}
                        onPatch={(patch) =>
                          updateMenuOverride(row.atom.key, patch)
                        }
                      />
                    </div>
                    {showsChildren && (
                      <button
                        type="button"
                        onClick={() => toggleSubmenuExpanded(row.atom.key)}
                        className="inline-flex items-center justify-center rounded-md border border-gray-200 px-2 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        aria-expanded={expanded}
                        aria-label={__("Toggle submenu", "yatra")}
                      >
                        {expanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {hasAnyOverrides && (
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  // Clear order + any parent overrides; keep label/icon/hidden.
                  updateField("menu_order", {});
                  setForm((prev) => {
                    const next = { ...(prev.menu_overrides ?? {}) };
                    for (const [key, ov] of Object.entries(next)) {
                      if (ov && ov.parent !== undefined) {
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
                }}
              >
                {__("Reset structure to default", "yatra")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderChrome = () => {
    const items: Array<{
      key: keyof UiChromeFlags;
      label: string;
      description: string;
    }> = [
      {
        key: "hideVersion",
        label: __("Hide version number", "yatra"),
        description: __(
          "Removes the small \"v3.0.4\" tag shown next to the brand name in the sidebar header.",
          "yatra",
        ),
      },
      {
        key: "hideBackToWp",
        label: __("Hide \"Back to WordPress\" link", "yatra"),
        description: __(
          "Removes the link from the top bar AND the sidebar footer so clients don't see the wp-admin escape hatch.",
          "yatra",
        ),
      },
      {
        key: "hideJoinCommunity",
        label: __("Hide \"Join Community\" link", "yatra"),
        description: __(
          "Removes the Facebook community button from the top bar.",
          "yatra",
        ),
      },
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle>{__("UI chrome", "yatra")}</CardTitle>
          <CardDescription>
            {__(
              "Hide or show specific pieces of admin chrome — useful when delivering the app to clients who shouldn't be reminded of the underlying platform.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => {
            const checked = !form.ui_chrome?.[item.key];
            return (
              <label
                key={item.key}
                className="flex items-start gap-3 rounded-md border border-gray-200 p-3 dark:border-gray-700"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={!checked}
                  onChange={() => toggleUiChrome(item.key)}
                  aria-label={item.label}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {item.description}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    checked
                      ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  }`}
                >
                  {checked ? (
                    <>
                      <Eye className="h-3 w-3" />
                      {__("Visible", "yatra")}
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3" />
                      {__("Hidden", "yatra")}
                    </>
                  )}
                </span>
              </label>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  const currentSection =
    SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];

  return (
    <div className="space-y-6">
      <PageHeader
        description={__(
          "Replace Yatra/MantraBrain branding shown in the admin and on PDFs.",
          "yatra",
        )}
      />

      {!isModuleEnabled && (
        <Card>
          <CardContent className="flex items-start gap-3 py-4">
            <Lock className="mt-0.5 h-5 w-5 text-amber-500" />
            <div className="text-sm">
              <p className="font-medium">{__("Module disabled", "yatra")}</p>
              <p className="text-gray-600 dark:text-gray-300">
                {__(
                  "Your Agency license is active, but the White Label module is not enabled yet. Enable it from the Modules page so branding overrides take effect.",
                  "yatra",
                )}
              </p>
              <a
                className="mt-1 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                href="admin.php?page=yatra&subpage=modules"
              >
                {__("Go to Modules →", "yatra")}
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={onSubmit}>
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Section sidebar */}
          <aside className="lg:sticky lg:top-4 lg:self-start">
            <Card>
              <CardContent className="p-2">
                <nav className="flex flex-col gap-1">
                  {SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const active = section.id === activeSection;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSection(section.id)}
                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          active
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate">{section.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
            <div className="mt-3 px-2 text-xs text-gray-500 dark:text-gray-400">
              {currentSection.description}
            </div>
          </aside>

          {/* Section content */}
          <div className="space-y-4">
            {activeSection === "brand" && renderBrand()}
            {activeSection === "theme" && renderTheme()}
            {activeSection === "menu" && renderMenu()}
            {activeSection === "chrome" && renderChrome()}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {__("Saving…", "yatra")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {__("Save White Label settings", "yatra")}
                  </>
                )}
              </Button>
              <span className="text-xs text-gray-400">
                <Sparkles className="-mt-0.5 mr-1 inline h-3 w-3" />
                {__("Saves all sections at once.", "yatra")}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default WhiteLabel;
