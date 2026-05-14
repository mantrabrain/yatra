import React, { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ICON_MAP } from "./icon-map";
import { IconSelector } from "../components/ui/icon-selector";
import type { IconPickerValue } from "./icon-picker-types";
import type { MenuIconValue } from "./sidebar-menu-defaults";

interface MenuIconProps {
  /** Stored override — Lucide name string OR IconPickerValue object. */
  icon: MenuIconValue | undefined;
  /** Lucide component used when no override / nothing renders. */
  fallback: LucideIcon;
  className?: string;
}

function isPickerValue(value: unknown): value is IconPickerValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in (value as Record<string, unknown>) &&
    "value" in (value as Record<string, unknown>)
  );
}

/**
 * Module-level cache + in-flight dedupe. The IconPicker stores image picks
 * as raw attachment IDs (e.g. "9") rather than URLs, so every consumer
 * needs to resolve them. Caching here avoids one fetch per render *and*
 * one fetch per consumer for the same attachment.
 */
const attachmentUrlCache = new Map<string, string>();
const attachmentUrlInFlight = new Map<string, Promise<string>>();

function resolveAttachmentUrl(id: string): Promise<string> {
  const cached = attachmentUrlCache.get(id);
  if (cached !== undefined) return Promise.resolve(cached);
  const pending = attachmentUrlInFlight.get(id);
  if (pending) return pending;

  const apiUrl =
    (window as any).yatraAdmin?.apiUrl?.replace("/yatra/v1", "") ?? "";
  if (!apiUrl) return Promise.resolve("");

  const promise = fetch(`${apiUrl}/wp/v2/media/${id}`)
    .then((r) => r.json())
    .then((data) => {
      const url: string = data?.source_url ?? "";
      if (url) attachmentUrlCache.set(id, url);
      return url;
    })
    .catch(() => "")
    .finally(() => {
      attachmentUrlInFlight.delete(id);
    });

  attachmentUrlInFlight.set(id, promise);
  return promise;
}

/**
 * Renders an image override, resolving attachment IDs to source URLs on
 * first paint. Returns null while the URL is in flight so we don't show
 * a broken `<img src="9">` flash.
 */
const ImageOverride: React.FC<{ value: string; className: string }> = ({
  value,
  className,
}) => {
  const initial =
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/")
      ? value
      : attachmentUrlCache.get(value) ?? "";

  const [resolved, setResolved] = useState<string>(initial);

  useEffect(() => {
    if (resolved) return;
    if (!/^\d+$/.test(value)) return;

    let cancelled = false;
    resolveAttachmentUrl(value).then((url) => {
      if (!cancelled && url) setResolved(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, resolved]);

  if (!resolved) return null;
  return (
    <img
      src={resolved}
      alt=""
      className={`${className} object-contain`}
      aria-hidden="true"
    />
  );
};

/**
 * Unified renderer for sidebar / menu-customization icon previews.
 *
 * Resolution order:
 *   1. IconPickerValue with type='image' → <img> (attachment ID resolved
 *      via the WP REST media endpoint)
 *   2. IconPickerValue with type='icon' → IconSelector (Yatra SVG or FA)
 *   3. string matching a known Lucide name → Lucide component
 *   4. otherwise → fallback Lucide
 */
export const MenuIcon: React.FC<MenuIconProps> = ({
  icon,
  fallback: Fallback,
  className = "h-4 w-4",
}) => {
  if (isPickerValue(icon)) {
    if (icon.type === "image" && icon.value) {
      return <ImageOverride value={icon.value} className={className} />;
    }
    if (icon.type === "icon" && icon.value) {
      return (
        <IconSelector
          iconName={icon.value}
          provider={
            (icon.provider as "yatra" | "fa-solid" | "fa-regular") ?? "yatra"
          }
          className={className}
        />
      );
    }
  }

  if (typeof icon === "string" && icon !== "" && ICON_MAP[icon]) {
    const Lucide = ICON_MAP[icon];
    return <Lucide className={className} />;
  }

  return <Fallback className={className} />;
};

export default MenuIcon;
