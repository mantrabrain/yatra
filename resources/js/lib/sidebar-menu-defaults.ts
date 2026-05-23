/**
 * Shared sidebar menu definitions for the Yatra React admin.
 *
 * The single source of truth for menu slugs, default labels, and default
 * icon names. Layout.tsx renders from this list (plus per-item overrides
 * from window.yatraAdmin.brandMenuOverrides); the White Label settings
 * page reads the same list to generate the customization form.
 *
 * Icons are referenced by Lucide name as strings so they can round-trip
 * through saved settings; the runtime icon map lives in ./icon-map.ts.
 */

export interface SubmenuItemDefault {
  /** Combined "parent.tab" key — unique across the whole menu tree. */
  key: string;
  /** Owning top-level slug. */
  parentSlug: string;
  /** Tab segment used by Layout.tsx for URL routing. */
  tab: string;
  label: string;
  iconName: string;
}

export interface MenuItemDefault {
  slug: string;
  label: string;
  iconName: string;
  submenu?: SubmenuItemDefault[];
}

/**
 * Icon override may be either:
 *   - a Lucide name string (legacy / curated Lucide dropdown)
 *   - an IconPickerValue (Yatra-library icon, FontAwesome, or image upload)
 *
 * The sidebar renderer (MenuIcon) handles all three shapes; existing
 * stored data keeps working without migration.
 */
import type { IconPickerValue } from "./icon-picker-types";

export type MenuIconValue = string | IconPickerValue;

/**
 * Per-item override. `parent` reparents the item under a different
 * top-level slug ("" / undefined = keep at top-level). Cross-parent
 * moves preserve the original click URL — the sidebar tree is purely
 * visual; routes still resolve via the original subpage/tab pair.
 */
export interface MenuItemOverride {
  label?: string;
  icon?: MenuIconValue;
  hidden?: boolean;
  parent?: string;
}

/**
 * Ordered children list per parent. The empty-string key holds the
 * top-level order; each top-level slug key holds that parent's ordered
 * children. Anything not listed falls back to its default position.
 */
export type MenuOrderMap = Record<string, string[]>;

/**
 * Submenu overrides are keyed by `{parentSlug}.{tab}` and currently
 * support label/icon/hidden — cross-parent moves are not supported yet
 * because the React App.tsx routing pins each submenu to its parent.
 */
export type MenuOverrides = Record<string, MenuItemOverride>;

/**
 * All known top-level sidebar items. Includes Pro-gated entries (their
 * visibility is still gated by isProPluginActive/isModuleActive at render
 * time) so customers can pre-configure them before enabling those modules.
 */
export const DEFAULT_MENU_ITEMS: MenuItemDefault[] = [
  { slug: "dashboard", label: "Dashboard", iconName: "LayoutDashboard" },
  {
    slug: "trips",
    label: "Trips",
    iconName: "MapPin",
    submenu: [
      { key: "trips.all", parentSlug: "trips", tab: "all", label: "All Trips", iconName: "List" },
      { key: "trips.activities", parentSlug: "trips", tab: "activities", label: "Activities", iconName: "Activity" },
      { key: "trips.destinations", parentSlug: "trips", tab: "destinations", label: "Destinations", iconName: "Route" },
      { key: "trips.categories", parentSlug: "trips", tab: "categories", label: "Categories", iconName: "FolderTree" },
      { key: "trips.difficulty-levels", parentSlug: "trips", tab: "difficulty-levels", label: "Difficulty Levels", iconName: "TrendingUp" },
      { key: "trips.availability", parentSlug: "trips", tab: "availability", label: "Availability", iconName: "CalendarDays" },
      { key: "trips.attributes", parentSlug: "trips", tab: "attributes", label: "Attributes", iconName: "Tag" },
      { key: "trips.additional-services", parentSlug: "trips", tab: "additional-services", label: "Additional Services", iconName: "Package" },
      { key: "trips.trip-consent", parentSlug: "trips", tab: "trip-consent", label: "Trip Consent", iconName: "FileSignature" },
    ],
  },
  { slug: "traveler-categories", label: "Traveler Categories", iconName: "Users" },
  {
    slug: "itinerary",
    label: "Itinerary",
    iconName: "Route",
    submenu: [
      { key: "itinerary.item-types", parentSlug: "itinerary", tab: "item-types", label: "Item Types", iconName: "Tag" },
      { key: "itinerary.items", parentSlug: "itinerary", tab: "items", label: "Items", iconName: "Route" },
      { key: "itinerary.itinerary", parentSlug: "itinerary", tab: "itinerary", label: "Itinerary", iconName: "FileText" },
    ],
  },
  { slug: "departures", label: "Departures", iconName: "Calendar" },
  { slug: "discounts", label: "Discounts", iconName: "BadgePercent" },
  { slug: "payments", label: "Payments", iconName: "CreditCard" },
  { slug: "bookings", label: "Bookings", iconName: "Calendar" },
  { slug: "customers", label: "Customers", iconName: "UserCircle" },
  { slug: "travelers", label: "Travelers", iconName: "Plane" },
  { slug: "enquiries", label: "Enquiries", iconName: "MessageSquare" },
  { slug: "reviews", label: "Reviews", iconName: "Star" },
  { slug: "reports", label: "Reports", iconName: "BarChart3" },
  { slug: "email-automation", label: "Email", iconName: "Mail" },
  { slug: "abandoned-recovery", label: "Abandoned Recovery", iconName: "RotateCcw" },
  { slug: "dynamic-pricing", label: "Dynamic Pricing", iconName: "TrendingUp" },
  { slug: "modules", label: "Modules", iconName: "Puzzle" },
  { slug: "white-label", label: "White Label", iconName: "Crown" },
  { slug: "ai-assistant", label: "AI Assistant", iconName: "Sparkles" },
  { slug: "whatsapp", label: "WhatsApp", iconName: "MessageCircle" },
  { slug: "channel-manager", label: "Channel Manager", iconName: "Network" },
  { slug: "webhooks", label: "Webhooks", iconName: "Webhook" },
  { slug: "license", label: "License", iconName: "Key" },
  { slug: "settings", label: "Settings", iconName: "Settings" },
];

export function getDefaultTopLevelSlugs(): string[] {
  return DEFAULT_MENU_ITEMS.map((item) => item.slug);
}

/**
 * Read the saved menu order. Supports two stored shapes for backwards
 * compatibility:
 *   - flat array of slugs → wrapped into { "": [...] } (top-level only)
 *   - object map keyed by parent → returned as-is
 */
export function readMenuOrder(): MenuOrderMap {
  const raw = (window as any).yatraAdmin?.brandMenuOrder;
  if (Array.isArray(raw)) {
    return { "": raw.filter((s): s is string => typeof s === "string") };
  }
  if (raw && typeof raw === "object") {
    const out: MenuOrderMap = {};
    for (const [key, list] of Object.entries(raw)) {
      if (typeof key === "string" && Array.isArray(list)) {
        out[key] = list.filter((s): s is string => typeof s === "string");
      }
    }
    return out;
  }
  return {};
}

export interface UiChromeFlags {
  hideVersion?: boolean;
  hideBackToWp?: boolean;
  hideJoinCommunity?: boolean;
}

export function readUiChrome(): UiChromeFlags {
  const raw = (window as any).yatraAdmin?.brandUiChrome;
  if (!raw || typeof raw !== "object") return {};
  return raw as UiChromeFlags;
}

/**
 * Icons offered in the White Label menu-customization dropdown. Curated
 * to match icons we already import in Layout.tsx — keeps the runtime
 * map small and predictable.
 */
export const SELECTABLE_ICON_NAMES = [
  "LayoutDashboard",
  "MapPin",
  "Calendar",
  "CalendarDays",
  "Star",
  "BarChart3",
  "Settings",
  "Wrench",
  "FileText",
  "CreditCard",
  "Package",
  "UserCircle",
  "Users",
  "FolderTree",
  "Tag",
  "TrendingUp",
  "List",
  "Activity",
  "Crown",
  "Mail",
  "Key",
  "FileSignature",
  "Route",
  "BadgePercent",
  "Plane",
  "MessageSquare",
  "Puzzle",
  "RotateCcw",
  "Tools",
  "Sparkles",
  "MessageCircle",
  "Network",
];

export function readMenuOverrides(): MenuOverrides {
  const raw = (window as any).yatraAdmin?.brandMenuOverrides;
  if (!raw || typeof raw !== "object") return {};
  return raw as MenuOverrides;
}

export function effectiveLabel(
  item: MenuItemDefault,
  overrides: MenuOverrides,
): string {
  const override = overrides[item.slug]?.label;
  return override && override.trim() !== "" ? override : item.label;
}

export function effectiveIconName(
  item: MenuItemDefault,
  overrides: MenuOverrides,
): string {
  const override = overrides[item.slug]?.icon;
  return override && override.trim() !== "" ? override : item.iconName;
}

export function isHidden(slug: string, overrides: MenuOverrides): boolean {
  return Boolean(overrides[slug]?.hidden);
}
