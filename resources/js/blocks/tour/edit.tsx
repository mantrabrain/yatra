import { InspectorControls } from "@wordpress/block-editor";
import {
  PanelBody,
  TextControl,
  RangeControl,
  SelectControl,
  ToggleControl,
} from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import ServerSideRender from "@wordpress/server-side-render";

interface TourBlockAttributes {
  order: "desc" | "asc";
  featured: boolean;
  per_page: number;
  columns: number;
  title: string;
  show_pagination: boolean;
}

interface EditProps {
  attributes: TourBlockAttributes;
  setAttributes: (attrs: Partial<TourBlockAttributes>) => void;
}

export default function Edit({ attributes, setAttributes }: EditProps) {
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
            label={__("Number of Tours", "yatra")}
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
                columns:
                  value !== undefined && value !== null ? value : 3,
              })
            }
            min={1}
            max={6}
          />
          <ToggleControl
            label={__("Show only featured tours", "yatra")}
            checked={attributes.featured}
            onChange={(value) => setAttributes({ featured: value })}
          />
          <ToggleControl
            label={__("Show pagination", "yatra")}
            checked={attributes.show_pagination}
            onChange={(value) => setAttributes({ show_pagination: value })}
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
