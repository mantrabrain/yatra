/**
 * String → Lucide icon component map.
 *
 * White Label menu overrides persist icon choices as strings (so they
 * survive JSON serialization in wp_options); this map turns them back
 * into React components. Only icons listed in SELECTABLE_ICON_NAMES need
 * an entry here — anything missing falls back to the default icon at
 * render time.
 */

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  CalendarDays,
  Star,
  BarChart3,
  Settings,
  Wrench,
  FileText,
  CreditCard,
  Package,
  UserCircle,
  Users,
  FolderTree,
  Tag,
  TrendingUp,
  List,
  Activity,
  Crown,
  Mail,
  Key,
  FileSignature,
  Route,
  BadgePercent,
  Plane,
  MessageSquare,
  Puzzle,
  RotateCcw,
  Sparkles,
  MessageCircle,
  Network,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  MapPin,
  Calendar,
  CalendarDays,
  Star,
  BarChart3,
  Settings,
  Wrench,
  FileText,
  CreditCard,
  Package,
  UserCircle,
  Users,
  FolderTree,
  Tag,
  TrendingUp,
  List,
  Activity,
  Crown,
  Mail,
  Key,
  FileSignature,
  Route,
  BadgePercent,
  Plane,
  MessageSquare,
  Puzzle,
  RotateCcw,
  Sparkles,
  MessageCircle,
  Network,
  Tools: Wrench,
};

export function resolveIcon(name: string, fallback: LucideIcon): LucideIcon {
  return ICON_MAP[name] ?? fallback;
}
