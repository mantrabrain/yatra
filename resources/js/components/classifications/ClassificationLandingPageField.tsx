/**
 * Landing page picker for classifications (metadata.landing_page_id).
 * Shown only when Custom Landing Pages module is enabled. Public URL logic is in Yatra Pro.
 */

import React, { useEffect, useMemo, useState } from "react";
import { __, sprintf } from "../../lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select } from "../ui/select";
import { Loader2 } from "lucide-react";

type WpPageSearchItem = {
  id: number;
  title?: { rendered?: string };
};

function restRoot(): string {
  const raw = window.yatraAdmin?.restUrl || "/wp-json/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

function parsePageTitle(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }
  const p = payload as WpPageSearchItem;
  if (typeof p.title?.rendered === "string") {
    return p.title.rendered.replace(/<[^>]+>/g, "").trim();
  }
  return "";
}

export function parseLandingPageIdFromMetadata(
  metadata?: { landing_page_id?: unknown } | null,
): number | null {
  const raw = metadata?.landing_page_id;
  if (raw == null || raw === "") {
    return null;
  }
  const n =
    typeof raw === "number" ? raw : parseInt(String(raw).trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function fetchPublishedPagePermalink(pageId: number): Promise<
  string | null
> {
  if (!pageId) {
    return null;
  }
  const nonce = window.yatraAdmin?.nonce || "";
  const url = `${restRoot()}wp/v2/pages/${pageId}?context=embed`;
  const res = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "X-WP-Nonce": nonce,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  if (typeof data?.link !== "string" || data.link === "") {
    return null;
  }

  return data.link;
}

async function fetchPublishedPagesFirstPage(): Promise<{
  items: WpPageSearchItem[];
  total: number | null;
}> {
  const nonce = window.yatraAdmin?.nonce || "";
  const params = new URLSearchParams({
    per_page: "100",
    orderby: "title",
    order: "asc",
    status: "publish",
    context: "embed",
  });
  const res = await fetch(`${restRoot()}wp/v2/pages?${params}`, {
    credentials: "same-origin",
    headers: {
      "X-WP-Nonce": nonce,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    return { items: [], total: null };
  }
  const data = await res.json();
  const items = Array.isArray(data) ? data : [];
  const totalRaw = res.headers.get("X-WP-Total");
  const total =
    totalRaw !== null && totalRaw !== ""
      ? parseInt(totalRaw, 10)
      : null;

  return { items, total: Number.isFinite(total) ? total : null };
}

async function fetchSinglePublishedPage(
  pageId: number,
): Promise<WpPageSearchItem | null> {
  const nonce = window.yatraAdmin?.nonce || "";
  const res = await fetch(
    `${restRoot()}wp/v2/pages/${pageId}?context=embed`,
    {
      credentials: "same-origin",
      headers: {
        "X-WP-Nonce": nonce,
        Accept: "application/json",
      },
    },
  );
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  if (!data || typeof data.id !== "number") {
    return null;
  }

  return data as WpPageSearchItem;
}

function sortPagesByTitle(list: WpPageSearchItem[]): WpPageSearchItem[] {
  return [...list].sort((a, b) => {
    const ta = parsePageTitle(a).toLowerCase();
    const tb = parsePageTitle(b).toLowerCase();
    return ta.localeCompare(tb);
  });
}

function mergePageUnique(
  list: WpPageSearchItem[],
  extra: WpPageSearchItem,
): WpPageSearchItem[] {
  const id = Number(extra.id);
  if (!Number.isFinite(id) || id <= 0) {
    return list;
  }
  if (list.some((p) => Number(p.id) === id)) {
    return list;
  }

  return sortPagesByTitle([...list, extra]);
}

interface ClassificationLandingPageFieldProps {
  value: number | null;
  onChange: (id: number | null) => void;
  /** Unique HTML id prefix for the select (per form). */
  selectId?: string;
}

export function ClassificationLandingPageField({
  value,
  onChange,
  selectId = "yatra-classification-landing-page",
}: ClassificationLandingPageFieldProps) {
  const moduleOn = Boolean(
    typeof window !== "undefined" &&
      window.yatraAdmin?.customLandingPagesModuleEnabled,
  );

  const [pages, setPages] = useState<WpPageSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [totalPublished, setTotalPublished] = useState<number | null>(null);

  useEffect(() => {
    if (!moduleOn) {
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const { items, total } = await fetchPublishedPagesFirstPage();
        if (cancelled) {
          return;
        }
        setPages(sortPagesByTitle(items));
        setTotalPublished(total);
      } catch {
        if (!cancelled) {
          setLoadError(true);
          setPages([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [moduleOn]);

  useEffect(() => {
    if (!moduleOn || !value) {
      return;
    }
    if (pages.some((p) => Number(p.id) === value)) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const one = await fetchSinglePublishedPage(value);
      if (cancelled || !one) {
        return;
      }
      setPages((prev) => mergePageUnique(prev, one));
    })();

    return () => {
      cancelled = true;
    };
  }, [moduleOn, value, pages]);

  const selectValue = useMemo(
    () => (value && value > 0 ? String(value) : ""),
    [value],
  );

  if (!moduleOn) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {__("Custom landing page", "yatra")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {__(
            "Public catalog links and redirects use this WordPress page URL instead of the default Yatra taxonomy path.",
            "yatra",
          )}
        </p>

        <div className="space-y-1">
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {__("WordPress page", "yatra")}
          </label>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {__("Loading pages…", "yatra")}
            </div>
          ) : loadError ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {__(
                "Could not load pages. Check that you are logged in and try again.",
                "yatra",
              )}
            </p>
          ) : (
            <Select
              id={selectId}
              className="w-full h-10"
              value={selectValue}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  onChange(null);
                  return;
                }
                const n = parseInt(v, 10);
                onChange(Number.isFinite(n) && n > 0 ? n : null);
              }}
            >
              <option value="">
                {__("— Default Yatra URL (no custom page) —", "yatra")}
              </option>
              {pages.map((p) => {
                const id = Number(p.id);
                const label =
                  parsePageTitle(p) || __("(no title)", "yatra");

                return (
                  <option key={id} value={String(id)}>
                    {label}
                  </option>
                );
              })}
            </Select>
          )}
          {totalPublished !== null && totalPublished > 100 && !loading && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {sprintf(
                __(
                  "Showing the first 100 published pages (of %d). Change the selection in WordPress → Pages if yours is not listed.",
                  "yatra",
                ),
                totalPublished,
              )}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
