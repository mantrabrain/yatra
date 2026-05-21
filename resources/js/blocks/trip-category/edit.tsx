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

export interface TripCategoryBlockAttributes {
  order: "asc" | "desc";
  columns: number;
  per_page: number;
  title: string;
  show_pagination: boolean;
  categoryIds: number[];
  category?: string;
  category_ids?: string;
  show_trip_count: boolean;
  show_description: boolean;
  show_image: boolean;
  hide_empty: boolean;
  featured_only: boolean;
}

interface EditProps {
  attributes: TripCategoryBlockAttributes;
  setAttributes: (attrs: Partial<TripCategoryBlockAttributes>) => void;
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

    let ids = normalizeIds(attributes.categoryIds);
    if (ids.length === 0) {
      ids = migrateNumericCsvPairToIds(attributes.category_ids, attributes.category);
    }
    if (ids.length === 0) {
      return;
    }
    setAttributes({
      categoryIds: ids,
      category: "",
      category_ids: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAttributes]);

  const {
    order,
    columns,
    per_page,
    title,
    show_pagination,
    show_trip_count,
    show_description,
    show_image,
    hide_empty,
    featured_only,
  } = attributes;

  const categoryIds = normalizeIds(attributes.categoryIds);

  return (
    <>
      <InspectorControls>
        <PanelBody
          title={__("Trip category settings", "yatra")}
          initialOpen={true}
        >
          <TextControl
            label={__("Title", "yatra")}
            value={title}
            onChange={(value: string) => setAttributes({ title: value })}
          />
          <ClassificationMultiSelect
            taxonomy="trip_category"
            label={__("Trip categories to show", "yatra")}
            help={__(
              "All published lists every category; narrow with search and checkboxes. Yatra trip types only.",
              "yatra",
            )}
            value={categoryIds}
            onChange={(ids) => setAttributes({ categoryIds: ids })}
          />
          <SelectControl
            label={__("Order", "yatra")}
            value={order}
            options={[
              { label: __("Ascending", "yatra"), value: "asc" },
              { label: __("Descending", "yatra"), value: "desc" },
            ]}
            onChange={(value: string) =>
              setAttributes({ order: value as "asc" | "desc" })
            }
          />
          <RangeControl
            label={__("Number of categories", "yatra")}
            value={per_page}
            onChange={(value: number | undefined) =>
              setAttributes({
                per_page: value !== undefined && value !== null ? value : 10,
              })
            }
            min={1}
            max={50}
          />
          <RangeControl
            label={__("Columns", "yatra")}
            value={columns}
            onChange={(value: number | undefined) =>
              setAttributes({
                columns: value !== undefined && value !== null ? value : 3,
              })
            }
            min={1}
            max={6}
          />
          <ToggleControl
            label={__("Show pagination", "yatra")}
            checked={show_pagination}
            onChange={(value: boolean) =>
              setAttributes({ show_pagination: value })
            }
          />
        </PanelBody>

        <PanelBody title={__("Display options", "yatra")} initialOpen={false}>
          <ToggleControl
            label={__("Show trip count", "yatra")}
            checked={show_trip_count}
            onChange={(value: boolean) =>
              setAttributes({ show_trip_count: value })
            }
          />
          <ToggleControl
            label={__("Show description", "yatra")}
            checked={show_description}
            onChange={(value: boolean) =>
              setAttributes({ show_description: value })
            }
          />
          <ToggleControl
            label={__("Show image", "yatra")}
            checked={show_image}
            onChange={(value: boolean) => setAttributes({ show_image: value })}
          />
          <ToggleControl
            label={__("Hide empty categories", "yatra")}
            help={__(
              "Skip categories that have no published trips assigned. Off by default — turn on for a tighter live catalog, leave off for editorial / onboarding views.",
              "yatra",
            )}
            checked={hide_empty}
            onChange={(value: boolean) => setAttributes({ hide_empty: value })}
          />
          <ToggleControl
            label={__("Featured only (filter list)", "yatra")}
            help={__(
              "When on, only categories with “Featured category” enabled in Yatra → Trips → Categories are listed. The red “Featured” badge on each card is controlled per category there—not by this toggle.",
              "yatra",
            )}
            checked={featured_only}
            onChange={(value: boolean) =>
              setAttributes({ featured_only: value })
            }
          />
        </PanelBody>
      </InspectorControls>

      <div className="yatra-block-editor-preview">
        <ServerSideRender
          block="yatra/trip-category"
          attributes={attributes}
          key={JSON.stringify(attributes)}
        />
      </div>
    </>
  );
}
