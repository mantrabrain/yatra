/**
 * Single place for Yatra storefront URL shapes (admin “View” / preview).
 * Plain taxonomy singles: `?{destination_base}={slug}` (same pattern as trip). Align with
 * {@see \Yatra\Core\Routing\PlainPageMatcher} and helpers.php.
 */

/** Public single-entity routes the plugin exposes on the frontend */
export type YatraPublicEntity =
  | "trip"
  | "destination"
  | "activity"
  | "category";

/** URL bases from Settings (REST) — defaults match {@see SettingsService} */
export type YatraPermalinkBases = {
  trip_base: string;
  destination_base: string;
  activity_base: string;
  trip_category_base: string;
};

/**
 * WordPress “Plain” permalink mode (?p=…); {@see AdminAssetsProvider::buildAdminLocalizedData}
 * sets `yatraAdmin.permalinkStructure` to `"plain"` when `permalink_structure` is empty.
 */
export function isWordPressPlainPermalink(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const ps = (window as { yatraAdmin?: { permalinkStructure?: string } })
    ?.yatraAdmin?.permalinkStructure;
  return ps === "plain";
}

export function getYatraSiteUrlFromWindow(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return (
    (window as { yatraAdmin?: { siteUrl?: string } }).yatraAdmin?.siteUrl || ""
  );
}

/**
 * Merge saved settings with `window.yatraAdmin.tripBase` when present.
 */
export function resolveYatraPermalinkBases(
  fromSettings?: Partial<YatraPermalinkBases> | Record<string, unknown> | null,
): YatraPermalinkBases {
  const ya =
    typeof window !== "undefined"
      ? (window as { yatraAdmin?: { tripBase?: string } }).yatraAdmin
      : undefined;
  const s = fromSettings as Partial<YatraPermalinkBases> | null | undefined;
  return {
    trip_base: s?.trip_base ?? ya?.tripBase ?? "trip",
    destination_base: s?.destination_base ?? "destination",
    activity_base: s?.activity_base ?? "activity",
    trip_category_base: s?.trip_category_base ?? "trip-category",
  };
}

/** Single trip plain: ?{tripBase}={slug} */
export function buildTripPlainUrl(
  baseSite: string,
  tripBase: string,
  slug: string,
): string {
  const base = baseSite.replace(/\/$/, "");
  const q = new URLSearchParams();
  q.set(tripBase, slug);
  return `${base}/?${q.toString()}`;
}

/** Taxonomy single plain: ?{archiveBase}={slug} (same pattern as trip; mirrors PHP PlainPageMatcher). */
export function buildTaxonomyPlainUrl(
  baseSite: string,
  archiveBase: string,
  slug: string,
): string {
  const base = baseSite.replace(/\/$/, "");
  const key = (archiveBase || "").trim() || "destination";
  const q = new URLSearchParams();
  q.set(key, slug);
  return `${base}/?${q.toString()}`;
}

export type YatraSinglePublicUrls = { plainUrl: string; prettyUrl: string };

/**
 * Build both plain-query and path-style URLs for a single trip or taxonomy term.
 * Callers pick based on {@link isWordPressPlainPermalink} or REST `permalink`.
 */
export function buildYatraSinglePublicUrls(params: {
  entity: YatraPublicEntity;
  slug: string;
  siteUrl?: string;
  bases?: Partial<YatraPermalinkBases> | null;
}): YatraSinglePublicUrls {
  const baseSite = (params.siteUrl ?? getYatraSiteUrlFromWindow()).replace(
    /\/$/,
    "",
  );
  const bases = resolveYatraPermalinkBases(params.bases);
  const slug = (params.slug || "").trim();

  switch (params.entity) {
    case "trip":
      return {
        plainUrl: buildTripPlainUrl(baseSite, bases.trip_base, slug),
        prettyUrl: `${baseSite}/${bases.trip_base}/${slug}`,
      };
    case "destination":
      return {
        plainUrl: buildTaxonomyPlainUrl(baseSite, bases.destination_base, slug),
        prettyUrl: `${baseSite}/${bases.destination_base}/${slug}`,
      };
    case "activity":
      return {
        plainUrl: buildTaxonomyPlainUrl(baseSite, bases.activity_base, slug),
        prettyUrl: `${baseSite}/${bases.activity_base}/${slug}`,
      };
    case "category":
      return {
        plainUrl: buildTaxonomyPlainUrl(
          baseSite,
          bases.trip_category_base,
          slug,
        ),
        prettyUrl: `${baseSite}/${bases.trip_category_base}/${slug}`,
      };
  }
}

/**
 * Simple preview (no REST canonical): path-style when WP uses pretty permalinks, else plain query.
 */
export function buildYatraSinglePreviewUrl(params: {
  entity: YatraPublicEntity;
  slug: string;
  siteUrl?: string;
  bases?: Partial<YatraPermalinkBases> | null;
}): string {
  const { plainUrl, prettyUrl } = buildYatraSinglePublicUrls(params);
  return isWordPressPlainPermalink() ? plainUrl : prettyUrl;
}

/**
 * Archive / listing / booking hub URL (no item slug) — e.g. Settings → Permalink “View”.
 */
export function buildYatraListingPublicUrl(
  baseSegment: string,
  siteUrl?: string,
): string {
  const seg = (baseSegment || "trip").trim();
  const raw = siteUrl !== undefined ? siteUrl : getYatraSiteUrlFromWindow();
  const siteBase = raw.replace(/\/$/, "");
  if (isWordPressPlainPermalink()) {
    if (!siteBase) {
      return `/?yatra_page=${encodeURIComponent(seg)}`;
    }
    return `${siteBase}/?yatra_page=${encodeURIComponent(seg)}`;
  }
  if (!siteBase) {
    return `/${seg}/`;
  }
  return `${siteBase}/${seg}/`;
}
