/**
 * Renders a stored icon in admin lists: Yatra SVG library (icons.json) or Font Awesome Free (webfont).
 */

import React from "react";
import { Package } from "lucide-react";
import { getYatraIconSvg } from "../../lib/icons";
import {
  FA_REGULAR_NAME_SET,
  FA_SOLID_NAME_SET,
} from "../../lib/fa-free-picker-icons";
import type { IconPickerValue } from "../../lib/icon-picker-types";

export type IconSelectorProvider = "yatra" | "fa-solid" | "fa-regular";

interface IconSelectorProps {
  /** Legacy: slug only (Yatra library) */
  iconName: string;
  provider?: IconSelectorProvider;
  className?: string;
  size?: number;
}

export const IconSelector: React.FC<IconSelectorProps> = ({
  iconName,
  provider = "yatra",
  className = "w-5 h-5",
  size,
}: IconSelectorProps) => {
  const sizeStyle =
    size !== undefined
      ? {
          fontSize: size,
          width: size,
          height: size,
          lineHeight: 1,
          display: "inline-flex" as const,
          alignItems: "center" as const,
          justifyContent: "center" as const,
        }
      : undefined;

  if (provider === "fa-solid" || provider === "fa-regular") {
    const ok =
      provider === "fa-regular"
        ? FA_REGULAR_NAME_SET.has(iconName)
        : FA_SOLID_NAME_SET.has(iconName);
    if (ok) {
      const prefix = provider === "fa-regular" ? "fa-regular" : "fa-solid";
      return (
        <i
          className={`${prefix} fa-${iconName} ${className}`}
          style={sizeStyle}
          aria-hidden="true"
        />
      );
    }
    return <Package className={className} style={sizeStyle} />;
  }

  const svg = getYatraIconSvg(iconName);
  if (svg) {
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        dangerouslySetInnerHTML={{ __html: svg }}
        style={sizeStyle}
      />
    );
  }

  return <Package className={className} style={sizeStyle} />;
};

/** @deprecated Use getIconOptions() from lib/icons for the full Yatra set */
export const availableIcons: Array<{
  name: string;
  label: string;
}> = [];

export function iconPickerValueToSelectorProps(
  val: IconPickerValue | null | undefined,
): { iconName: string; provider: IconSelectorProvider } {
  if (!val || val.type !== "icon" || !val.value) {
    return { iconName: "package", provider: "yatra" };
  }
  const p = val.provider ?? "yatra";
  if (p === "fa-solid" || p === "fa-regular") {
    return { iconName: val.value, provider: p };
  }

  return { iconName: val.value, provider: "yatra" };
}

export default IconSelector;
