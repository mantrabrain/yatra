import { InspectorControls } from "@wordpress/block-editor";
import {
  PanelBody,
  TextControl,
  RangeControl,
  SelectControl,
  ToggleControl,
} from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import { useEffect, useRef } from "@wordpress/element";
import ServerSideRender from "@wordpress/server-side-render";
import { ClassificationMultiSelect } from "../components/ClassificationMultiSelect";
import { migrateNumericCsvPairToIds } from "../utils/migrateTaxonomyIds";

interface TourBlockAttributes {
  order: "desc" | "asc";
  featured: boolean;
  featured_priority: "" | "featured" | "new" | "limited";
  per_page: number;
  columns: number;
  title: string;
  show_pagination: boolean;
  destinationIds: number[];
  activityIds: number[];
  categoryIds: number[];
  difficultyIds: number[];
  destination_ids?: string;
  destination?: string;
  activity_ids?: string;
  activity?: string;
  category_ids?: string;
  category?: string;
  difficulty?: string;
  price_min: string;
  price_max: string;
  duration_min: string;
  duration_max: string;
  search: string;
}

interface EditProps {
  attributes: TourBlockAttributes;
  setAttributes: (attrs: Partial<TourBlockAttributes>) => void;
}

function normalizeIds(arr: number[] | undefined): number[] {
  return Array.isArray(arr)
    ? [...new Set(arr.map((n) => parseInt(String(n), 10)).filter((n) => n > 0))]
    : [];
}

export default function Edit({ attributes, setAttributes }: EditProps) {
  const migratedOnce = useRef(false);

  useEffect(() => {
    if (migratedOnce.current) {
      return;
    }
    migratedOnce.current = true;

    const clears: Partial<TourBlockAttributes> = {};

    let destIds = normalizeIds(attributes.destinationIds);
    if (destIds.length === 0) {
      destIds = migrateNumericCsvPairToIds(
        attributes.destination_ids,
        attributes.destination,
      );
      if (destIds.length) {
        clears.destination = "";
        clears.destination_ids = "";
      }
    }

    let actIds = normalizeIds(attributes.activityIds);
    if (actIds.length === 0) {
      actIds = migrateNumericCsvPairToIds(
        attributes.activity_ids,
        attributes.activity,
      );
      if (actIds.length) {
        clears.activity = "";
        clears.activity_ids = "";
      }
    }

    let catIds = normalizeIds(attributes.categoryIds);
    if (catIds.length === 0) {
      catIds = migrateNumericCsvPairToIds(
        attributes.category_ids,
        attributes.category,
      );
      if (catIds.length) {
        clears.category = "";
        clears.category_ids = "";
      }
    }

    let diffIds = normalizeIds(attributes.difficultyIds);
    if (diffIds.length === 0) {
      const fromDiff = migrateNumericCsvPairToIds(attributes.difficulty, "");
      diffIds = fromDiff;
      if (fromDiff.length) {
        clears.difficulty = "";
      }
    }

    // Back-compat: migrate legacy `featured: true` to featured_priority="featured"
    // so existing block instances reflect the value in the new dropdown.
    if (attributes.featured && !attributes.featured_priority) {
      clears.featured_priority = "featured";
      clears.featured = false;
    }

    const next: Partial<TourBlockAttributes> = { ...clears };
    if (destIds.length) {
      next.destinationIds = destIds;
    }
    if (actIds.length) {
      next.activityIds = actIds;
    }
    if (catIds.length) {
      next.categoryIds = catIds;
    }
    if (diffIds.length) {
      next.difficultyIds = diffIds;
    }

    const touched =
      Object.keys(next).filter(
        (key) => next[key as keyof typeof next] !== undefined,
      ).length > 0;
    if (touched) {
      setAttributes(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time migrate from legacy serialized attributes
  }, [setAttributes]);

  const destinationIds = normalizeIds(attributes.destinationIds);
  const activityIds = normalizeIds(attributes.activityIds);
  const categoryIds = normalizeIds(attributes.categoryIds);
  const difficultyIds = normalizeIds(attributes.difficultyIds);

  return (
    <>
      <InspectorControls>
        <PanelBody title={__("Trip Settings", "yatra")} initialOpen={true}>
          <TextControl
            label={__("Title", "yatra")}
            value={attributes.title}
            onChange={(value) => setAttributes({ title: value })}
          />
          <SelectControl
            label={__("Order", "yatra")}
            value={attributes.order}
            options={[
              { label: __("Descending", "yatra"), value: "desc" },
              { label: __("Ascending", "yatra"), value: "asc" },
            ]}
            onChange={(value: string) =>
              setAttributes({ order: value as "asc" | "desc" })
            }
          />
          <RangeControl
            label={__("Number of Trips", "yatra")}
            value={attributes.per_page}
            onChange={(value) => setAttributes({ per_page: value || 10 })}
            min={1}
            max={50}
          />
          <RangeControl
            label={__("Columns", "yatra")}
            value={attributes.columns}
            onChange={(value) =>
              setAttributes({
                columns: value !== undefined && value !== null ? value : 3,
              })
            }
            min={1}
            max={6}
          />
          <SelectControl
            label={__("Featured Priority", "yatra")}
            help={__(
              "Restrict to trips marked with a specific priority on the trip form (Categorization → Featured Priority). Choose Any to show all trips.",
              "yatra",
            )}
            value={attributes.featured_priority || ""}
            options={[
              { label: __("Any", "yatra"), value: "" },
              { label: __("Featured", "yatra"), value: "featured" },
              { label: __("New", "yatra"), value: "new" },
              { label: __("Limited Time", "yatra"), value: "limited" },
            ]}
            onChange={(value: string) =>
              setAttributes({
                featured_priority:
                  value as TourBlockAttributes["featured_priority"],
                // Keep legacy `featured` boolean in sync for back-compat
                // (existing block instances saved with featured=true).
                featured: value === "featured",
              })
            }
          />
          <ToggleControl
            label={__("Show pagination", "yatra")}
            checked={attributes.show_pagination}
            onChange={(value) => setAttributes({ show_pagination: value })}
          />
        </PanelBody>
        <PanelBody title={__("Filters", "yatra")} initialOpen={false}>
          <ClassificationMultiSelect
            taxonomy="destination"
            label={__("Destinations", "yatra")}
            help={__(
              'Choose "All published" or restrict the grid to destinations you tick. Other filters narrow results further.',
              "yatra",
            )}
            value={destinationIds}
            onChange={(ids) => setAttributes({ destinationIds: ids })}
          />
          <ClassificationMultiSelect
            taxonomy="activity"
            label={__("Activities", "yatra")}
            help={__(
              "Optional. When restricting, trips must match every classification filter that has selections.",
              "yatra",
            )}
            value={activityIds}
            onChange={(ids) => setAttributes({ activityIds: ids })}
          />
          <ClassificationMultiSelect
            taxonomy="trip_category"
            label={__("Trip categories", "yatra")}
            help={__(
              "Yatra trip types (not WooCommerce categories). Combine with destinations/activities if needed.",
              "yatra",
            )}
            value={categoryIds}
            onChange={(ids) => setAttributes({ categoryIds: ids })}
          />
          <ClassificationMultiSelect
            taxonomy="difficulty"
            label={__("Difficulty levels", "yatra")}
            help={__(
              "Optional. When restricting, trips must use one of the selected difficulty classifications.",
              "yatra",
            )}
            value={difficultyIds}
            onChange={(ids) => setAttributes({ difficultyIds: ids })}
          />
          <TextControl
            label={__("Search", "yatra")}
            value={attributes.search}
            onChange={(v) => setAttributes({ search: v })}
          />
          <TextControl
            label={__("Price min", "yatra")}
            type="number"
            value={attributes.price_min}
            onChange={(v) => setAttributes({ price_min: v })}
          />
          <TextControl
            label={__("Price max", "yatra")}
            type="number"
            value={attributes.price_max}
            onChange={(v) => setAttributes({ price_max: v })}
          />
          <TextControl
            label={__("Duration min (days)", "yatra")}
            type="number"
            value={attributes.duration_min}
            onChange={(v) => setAttributes({ duration_min: v })}
          />
          <TextControl
            label={__("Duration max (days)", "yatra")}
            type="number"
            value={attributes.duration_max}
            onChange={(v) => setAttributes({ duration_max: v })}
          />
        </PanelBody>
      </InspectorControls>

      <div className="yatra-block-editor-preview">
        <ServerSideRender
          block="yatra/tour"
          attributes={attributes}
          key={JSON.stringify(attributes)}
        />
      </div>
    </>
  );
}
