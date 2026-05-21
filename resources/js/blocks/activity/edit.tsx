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

interface ActivityBlockAttributes {
  order: "asc" | "desc";
  columns: number;
  per_page: number;
  title: string;
  show_pagination: boolean;
  activityIds: number[];
  activity_ids?: string;
  activity?: string;
  show_trip_count: boolean;
  show_description: boolean;
  show_image: boolean;
  hide_empty: boolean;
}

interface EditProps {
  attributes: ActivityBlockAttributes;
  setAttributes: (attrs: Partial<ActivityBlockAttributes>) => void;
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

    let ids = normalizeIds(attributes.activityIds);
    if (ids.length === 0) {
      ids = migrateNumericCsvPairToIds(attributes.activity_ids, attributes.activity);
    }
    if (ids.length === 0) {
      return;
    }
    setAttributes({
      activityIds: ids,
      activity: "",
      activity_ids: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAttributes]);

  const activityIds = normalizeIds(attributes.activityIds);

  return (
    <>
      <InspectorControls>
        <PanelBody title={__("Activity Settings", "yatra")} initialOpen={true}>
          <TextControl
            label={__("Title", "yatra")}
            value={attributes.title}
            onChange={(value: string) => setAttributes({ title: value })}
          />
          <SelectControl
            label={__("Order", "yatra")}
            value={attributes.order}
            options={[
              { label: __("Ascending", "yatra"), value: "asc" },
              { label: __("Descending", "yatra"), value: "desc" },
            ]}
            onChange={(value: string) =>
              setAttributes({ order: value as "asc" | "desc" })
            }
          />
          <RangeControl
            label={__("Number of Activities", "yatra")}
            value={attributes.per_page}
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
            value={attributes.columns}
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
            checked={attributes.show_pagination}
            onChange={(value: boolean) =>
              setAttributes({ show_pagination: value })
            }
          />
          <ClassificationMultiSelect
            taxonomy="activity"
            label={__("Activities to show", "yatra")}
            help={__(
              "Use \"All published\" or narrow with search and checkboxes.",
              "yatra",
            )}
            value={activityIds}
            onChange={(ids) => setAttributes({ activityIds: ids })}
          />
        </PanelBody>

        <PanelBody title={__("Display options", "yatra")} initialOpen={false}>
          <ToggleControl
            label={__("Show trip count", "yatra")}
            checked={attributes.show_trip_count}
            onChange={(value: boolean) =>
              setAttributes({ show_trip_count: value })
            }
          />
          <ToggleControl
            label={__("Show description", "yatra")}
            checked={attributes.show_description}
            onChange={(value: boolean) =>
              setAttributes({ show_description: value })
            }
          />
          <ToggleControl
            label={__("Show image", "yatra")}
            checked={attributes.show_image}
            onChange={(value: boolean) =>
              setAttributes({ show_image: value })
            }
          />
          <ToggleControl
            label={__("Hide empty activities", "yatra")}
            help={__(
              "Skip activities that have no published trips assigned. Off by default — turn on for a tighter live catalog, leave off for editorial / onboarding views.",
              "yatra",
            )}
            checked={attributes.hide_empty}
            onChange={(value: boolean) =>
              setAttributes({ hide_empty: value })
            }
          />
        </PanelBody>
      </InspectorControls>

      <div className="yatra-block-editor-preview">
        <ServerSideRender
          block="yatra/activity"
          attributes={attributes}
          key={JSON.stringify(attributes)}
        />
      </div>
    </>
  );
}
