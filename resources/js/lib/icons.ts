/**
 * Centralized Icon System
 *
 * This file provides a centralized way to manage icons across both React and PHP.
 * Icons are defined in /includes/icons.json and loaded dynamically.
 */

import { createElement } from "react";

// Import all Lucide icons we use
import {
  Activity,
  UtensilsCrossed,
  Building2,
  Bus,
  Moon,
  Package,
  Target,
  Camera,
  Mountain,
  Waves,
  Palette,
  Plane,
  Car,
  Hotel,
  Coffee,
  Bed,
  MapPin,
  Footprints,
  Eye,
  Clock,
  Calendar,
  Image as ImageIcon,
  Music,
  Gamepad2,
  BookOpen,
  ShoppingBag,
  Heart,
  Star,
  Zap,
  Flame,
} from "lucide-react";

// Map icon names to Lucide components
const lucideIconMap: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  activity: Activity,
  footprints: Footprints,
  mountain: Mountain,
  waves: Waves,
  camera: Camera,
  eye: Eye,
  target: Target,
  zap: Zap,
  flame: Flame,
  utensils: UtensilsCrossed,
  coffee: Coffee,
  hotel: Hotel,
  bed: Bed,
  building: Building2,
  bus: Bus,
  plane: Plane,
  car: Car,
  "map-pin": MapPin,
  calendar: Calendar,
  clock: Clock,
  moon: Moon,
  package: Package,
  palette: Palette,
  image: ImageIcon,
  music: Music,
  gamepad: Gamepad2,
  book: BookOpen,
  shopping: ShoppingBag,
  heart: Heart,
  star: Star,
};

export type IconName = keyof typeof lucideIconMap;

export interface IconData {
  label: string;
  category:
    | "activity"
    | "travel"
    | "food"
    | "accommodation"
    | "transport"
    | "general";
  svg: string;
}

export interface IconOption {
  name: IconName;
  label: string;
  component: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  category:
    | "activity"
    | "travel"
    | "food"
    | "accommodation"
    | "transport"
    | "general";
}

// Cache for loaded icons
let iconsCache: Record<string, IconData> | null = null;

/**
 * Load icons from the centralized JSON file
 */
export async function loadIcons(): Promise<Record<string, IconData>> {
  if (iconsCache !== null) {
    return iconsCache;
  }

  try {
    // Load from the same JSON file that PHP uses
    const response = await fetch(
      "/wp-content/plugins/yatra/includes/icons.json",
    );
    if (!response.ok) {
      throw new Error("Failed to load icons");
    }

    const loadedIcons = await response.json();
    iconsCache = loadedIcons || {};
    return iconsCache as Record<string, IconData>;
  } catch (error) {
    console.warn("Failed to load centralized icons, using fallback:", error);
    iconsCache = {};
    return iconsCache;
  }
}

/**
 * Get all available icon options for the icon picker
 */
export function getIconOptions(): IconOption[] {
  return Object.entries(lucideIconMap).map(([name, component]) => ({
    name: name as IconName,
    label: name.charAt(0).toUpperCase() + name.slice(1).replace("-", " "),
    component,
    category: getCategoryForIcon(name as IconName),
  }));
}

/**
 * Get category for an icon (fallback when JSON is not loaded)
 */
function getCategoryForIcon(iconName: IconName): IconOption["category"] {
  const categoryMap: Record<string, IconOption["category"]> = {
    activity: "activity",
    footprints: "activity",
    mountain: "activity",
    waves: "activity",
    camera: "activity",
    eye: "activity",
    target: "activity",
    zap: "activity",
    flame: "activity",
    utensils: "food",
    coffee: "food",
    hotel: "accommodation",
    bed: "accommodation",
    building: "accommodation",
    bus: "transport",
    plane: "transport",
    car: "transport",
    "map-pin": "travel",
    calendar: "travel",
    clock: "travel",
    moon: "general",
    package: "general",
    palette: "general",
    image: "general",
    music: "general",
    gamepad: "general",
    book: "general",
    shopping: "general",
    heart: "general",
    star: "general",
  };

  return categoryMap[iconName] || "general";
}

/**
 * Get React component for an icon name
 */
export function getIconComponent(
  iconName: string,
): React.ComponentType<React.SVGProps<SVGSVGElement>> | null {
  return lucideIconMap[iconName] || null;
}

/**
 * Render an icon by name
 */
export function renderIcon(
  iconName: string,
  props: React.SVGProps<SVGSVGElement> = {},
): React.ReactElement | null {
  const IconComponent = getIconComponent(iconName);
  if (!IconComponent) {
    return null;
  }

  return createElement(IconComponent, props);
}

export default {
  loadIcons,
  getIconOptions,
  getIconComponent,
  renderIcon,
};
