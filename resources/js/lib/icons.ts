/**
 * Yatra icon library (includes/icons.json, expanded via scripts/sync-lucide-icons-json.mjs)
 * + helpers for admin UI. Public PHP rendering uses yatra_svg_icon() / yatra_stored_picker_icon_markup().
 */

import { createElement } from "react";
import type { SVGProps } from "react";
import yatraIconsManifest from "@yatra/icons";

export interface YatraManifestEntry {
  label: string;
  category: string;
  svg: string;
}

export type IconOption = {
  name: string;
  label: string;
  category: string;
  svg: string;
};

/** @deprecated All string slugs from manifest are valid */
export type IconName = string;

export function getYatraIconManifest(): Record<string, YatraManifestEntry> {
  return yatraIconsManifest as Record<string, YatraManifestEntry>;
}

export function getIconOptions(): IconOption[] {
  const m = yatraIconsManifest as Record<string, YatraManifestEntry>;
  // Some manifest entries only carry `svg` (sync script left them without
  // label/category). Without defensive defaults, IconPicker's search filter
  // calls `.toLowerCase()` on undefined and crashes the whole panel.
  // Derive a readable label from the slug ("hot-air-balloon" → "Hot Air
  // Balloon") and fall back to a "general" bucket for the category so the
  // search and category-filter UI still works.
  const slugToLabel = (slug: string): string =>
    slug
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  return Object.entries(m).map(([name, meta]) => {
    const safeMeta = (meta || {}) as Partial<YatraManifestEntry>;
    return {
      name,
      label:
        typeof safeMeta.label === "string" && safeMeta.label.length > 0
          ? safeMeta.label
          : slugToLabel(name),
      category:
        typeof safeMeta.category === "string" && safeMeta.category.length > 0
          ? safeMeta.category
          : "general",
      svg: safeMeta.svg || "",
    };
  });
}

export function getYatraIconSvg(slug: string): string | null {
  const m = yatraIconsManifest as Record<string, YatraManifestEntry>;
  return m[slug]?.svg ?? null;
}

/** @deprecated Prefer getYatraIconSvg + inline SVG; kept for narrow compatibility */
export function getIconComponent(): null {
  return null;
}

export function renderIcon(
  iconName: string,
  props: SVGProps<HTMLSpanElement> = {},
): ReturnType<typeof createElement> | null {
  const svg = getYatraIconSvg(iconName);
  if (!svg) {
    return null;
  }
  return createElement("span", {
    ...props,
    dangerouslySetInnerHTML: { __html: svg },
  });
}

export async function loadIcons(): Promise<Record<string, YatraManifestEntry>> {
  return getYatraIconManifest();
}

export default {
  loadIcons,
  getIconOptions,
  getIconComponent,
  renderIcon,
  getYatraIconSvg,
  getYatraIconManifest,
};
