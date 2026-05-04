/**
 * Font Awesome 6 Free — full solid + regular icon lists for the admin picker.
 * Names come from includes/fa-free-icon-names.json (regenerate: npm run sync-fa).
 * Rendering uses webfont CSS (fa-solid / fa-regular + fa-{name}), not bundled SVG defs.
 */
import faManifest from "@yatra/fa-icon-names";

export type FaPickerStyle = "fa-solid" | "fa-regular";

export type FaPickerItem = {
  /** Icon name without fa- prefix (Font Awesome iconName) */
  name: string;
  label: string;
  style: FaPickerStyle;
};

const manifest = faManifest as { solid: string[]; regular: string[] };

function humanizeIconName(iconName: string): string {
  return iconName
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function toPickerItems(
  names: readonly string[],
  style: FaPickerStyle,
): FaPickerItem[] {
  return names.map((name) => ({
    name,
    label: humanizeIconName(name),
    style,
  }));
}

/** Font Awesome Free — Solid (full pack) */
export const FA_FREE_SOLID_PICKER: FaPickerItem[] = toPickerItems(
  manifest.solid,
  "fa-solid",
);

/** Font Awesome Free — Regular (full pack) */
export const FA_FREE_REGULAR_PICKER: FaPickerItem[] = toPickerItems(
  manifest.regular,
  "fa-regular",
);

export const FA_FREE_ALL_PICKER: FaPickerItem[] = [
  ...FA_FREE_SOLID_PICKER,
  ...FA_FREE_REGULAR_PICKER,
];

export const FA_SOLID_NAME_SET = new Set(manifest.solid);
export const FA_REGULAR_NAME_SET = new Set(manifest.regular);
