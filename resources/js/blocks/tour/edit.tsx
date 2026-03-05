import { InspectorControls } from "@wordpress/block-editor";
import {
  PanelBody,
  TextControl,
  RangeControl,
  SelectControl,
  ToggleControl,
} from "@wordpress/components";
import { __ } from "@wordpress/i18n";

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
            onChange={(value) => setAttributes({ columns: value || 3 })}
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

      <div
        className="yatra-block-placeholder"
        style={{
          padding: "20px",
          border: "2px dashed #0073aa",
          borderRadius: "4px",
          textAlign: "center",
          backgroundColor: "#f8f9f9",
        }}
      >
        <div>
          <h3
            style={{
              margin: "0 0 10px 0",
              color: "#0073aa",
              fontSize: "16px",
            }}
          >
            {attributes.title || __("Tour Block", "yatra")}
          </h3>
          <p
            style={{
              margin: "0 0 10px 0",
              color: "#666",
            }}
          >
            {__("This block will display ", "yatra")}
            {attributes.featured && __("featured ", "yatra")}
            {__("tour listings on the frontend", "yatra")}
          </p>
          <div
            style={{
              fontSize: "12px",
              color: "#999",
              marginTop: "10px",
            }}
          >
            {__("Showing ", "yatra")}
            {attributes.per_page}
            {__(" tours in ", "yatra")}
            {attributes.columns}
            {__(" columns", "yatra")}
          </div>
        </div>
      </div>
    </>
  );
}
