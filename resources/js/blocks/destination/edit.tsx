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

interface DestinationBlockAttributes {
  order: "asc" | "desc";
  columns: number;
  per_page: number;
  title: string;
  show_pagination: boolean;
  destinationIds: number[];
  destination_ids?: string;
  destination?: string;
}

interface EditProps {
  attributes: DestinationBlockAttributes;
  setAttributes: (attrs: Partial<DestinationBlockAttributes>) => void;
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

    let ids = normalizeIds(attributes.destinationIds);
    if (ids.length === 0) {
      ids = migrateNumericCsvPairToIds(
        attributes.destination_ids,
        attributes.destination,
      );
    }
    if (ids.length === 0) {
      return;
    }
    setAttributes({
      destinationIds: ids,
      destination: "",
      destination_ids: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAttributes]);

  const destinationIds = normalizeIds(attributes.destinationIds);

  return (
    <>
      <InspectorControls>
        <PanelBody
          title={__("Destination Settings", "yatra")}
          initialOpen={true}
        >
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
            label={__("Number of Destinations", "yatra")}
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
            taxonomy="destination"
            label={__("Destinations to show", "yatra")}
            help={__(
              "Pick \"All published\" for the full catalog; otherwise search and tick specific destinations.",
              "yatra",
            )}
            value={destinationIds}
            onChange={(ids) => setAttributes({ destinationIds: ids })}
          />
        </PanelBody>
      </InspectorControls>

      <div className="yatra-block-editor-preview">
        <ServerSideRender
          block="yatra/destination"
          attributes={attributes}
          key={JSON.stringify(attributes)}
        />
      </div>
    </>
  );
}
