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
  return Object.entries(m).map(([name, meta]) => ({
    name,
    label: meta.label,
    category: meta.category,
    svg: meta.svg,
  }));
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
