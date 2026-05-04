(function(element, blocks, blockEditor, components, i18n, ServerSideRender) {
  "use strict";
  function Edit({ attributes: attributes2, setAttributes }) {
    const {
      order,
      columns,
      per_page,
      title: title2,
      show_pagination,
      category: category2,
      show_trip_count,
      show_description,
      show_image,
      hide_empty,
      featured_only
    } = attributes2;
    return /* @__PURE__ */ element.createElement(element.Fragment, null, /* @__PURE__ */ element.createElement(blockEditor.InspectorControls, null, /* @__PURE__ */ element.createElement(
      components.PanelBody,
      {
        title: i18n.__("Trip category settings", "yatra"),
        initialOpen: true
      },
      /* @__PURE__ */ element.createElement(
        components.TextControl,
        {
          label: i18n.__("Title", "yatra"),
          value: title2,
          onChange: (value) => setAttributes({ title: value })
        }
      ),
      /* @__PURE__ */ element.createElement(
        components.TextControl,
        {
          label: i18n.__("Categories (slugs)", "yatra"),
          help: i18n.__(
            "Optional. One slug or comma-separated slugs (same as the [yatra_trip_category] category attribute). Leave empty to list all categories.",
            "yatra"
          ),
          value: category2,
          onChange: (value) => setAttributes({ category: value })
        }
      ),
      /* @__PURE__ */ element.createElement(
        components.SelectControl,
        {
          label: i18n.__("Order", "yatra"),
          value: order,
          options: [
            { label: i18n.__("Ascending", "yatra"), value: "asc" },
            { label: i18n.__("Descending", "yatra"), value: "desc" }
          ],
          onChange: (value) => setAttributes({ order: value })
        }
      ),
      /* @__PURE__ */ element.createElement(
        components.RangeControl,
        {
          label: i18n.__("Number of categories", "yatra"),
          value: per_page,
          onChange: (value) => setAttributes({
            per_page: value !== void 0 && value !== null ? value : 10
          }),
          min: 1,
          max: 50
        }
      ),
      /* @__PURE__ */ element.createElement(
        components.RangeControl,
        {
          label: i18n.__("Columns", "yatra"),
          value: columns,
          onChange: (value) => setAttributes({
            columns: value !== void 0 && value !== null ? value : 3
          }),
          min: 1,
          max: 6
        }
      ),
      /* @__PURE__ */ element.createElement(
        components.ToggleControl,
        {
          label: i18n.__("Show pagination", "yatra"),
          checked: show_pagination,
          onChange: (value) => setAttributes({ show_pagination: value })
        }
      )
    ), /* @__PURE__ */ element.createElement(components.PanelBody, { title: i18n.__("Display options", "yatra"), initialOpen: false }, /* @__PURE__ */ element.createElement(
      components.ToggleControl,
      {
        label: i18n.__("Show trip count", "yatra"),
        checked: show_trip_count,
        onChange: (value) => setAttributes({ show_trip_count: value })
      }
    ), /* @__PURE__ */ element.createElement(
      components.ToggleControl,
      {
        label: i18n.__("Show description", "yatra"),
        checked: show_description,
        onChange: (value) => setAttributes({ show_description: value })
      }
    ), /* @__PURE__ */ element.createElement(
      components.ToggleControl,
      {
        label: i18n.__("Show image", "yatra"),
        checked: show_image,
        onChange: (value) => setAttributes({ show_image: value })
      }
    ), /* @__PURE__ */ element.createElement(
      components.ToggleControl,
      {
        label: i18n.__("Hide empty categories", "yatra"),
        checked: hide_empty,
        onChange: (value) => setAttributes({ hide_empty: value })
      }
    ), /* @__PURE__ */ element.createElement(
      components.ToggleControl,
      {
        label: i18n.__("Featured only (filter list)", "yatra"),
        help: i18n.__(
          "When on, only categories with “Featured category” enabled in Yatra → Trips → Categories are listed. The red “Featured” badge on each card is controlled per category there—not by this toggle.",
          "yatra"
        ),
        checked: featured_only,
        onChange: (value) => setAttributes({ featured_only: value })
      }
    ))), /* @__PURE__ */ element.createElement("div", { className: "yatra-block-editor-preview" }, /* @__PURE__ */ element.createElement(
      ServerSideRender,
      {
        block: "yatra/trip-category",
        attributes: attributes2,
        key: JSON.stringify(attributes2)
      }
    )));
  }
  const $schema = "https://schemas.wp.org/trunk/block.json";
  const apiVersion = 3;
  const name = "yatra/trip-category";
  const title = "Trip categories";
  const category = "yatra";
  const icon = "category";
  const description = "Display trip category cards with trip counts and pricing (same layout as destinations).";
  const keywords = [
    "category",
    "trip",
    "taxonomy",
    "yatra"
  ];
  const textdomain = "yatra";
  const attributes = {
    align: {
      type: "string",
      "default": ""
    },
    order: {
      type: "string",
      "default": "desc"
    },
    columns: {
      type: "number",
      "default": 3
    },
    per_page: {
      type: "number",
      "default": 10
    },
    title: {
      type: "string",
      "default": "Trip Categories"
    },
    show_pagination: {
      type: "boolean",
      "default": true
    },
    category: {
      type: "string",
      "default": ""
    },
    show_trip_count: {
      type: "boolean",
      "default": true
    },
    show_description: {
      type: "boolean",
      "default": true
    },
    show_image: {
      type: "boolean",
      "default": true
    },
    hide_empty: {
      type: "boolean",
      "default": true
    },
    featured_only: {
      type: "boolean",
      "default": false
    }
  };
  const supports = {
    html: false,
    inserter: true,
    align: [
      "wide",
      "full"
    ]
  };
  const editorScript = "yatra-trip-category-block-editor";
  const blockMetadata = {
    $schema,
    apiVersion,
    name,
    title,
    category,
    icon,
    description,
    keywords,
    textdomain,
    attributes,
    supports,
    editorScript
  };
  const {
    $schema: _$schema,
    editorScript: _$editorScript,
    ...metadata
  } = blockMetadata;
  if (blocks.getBlockType(metadata.name)) {
    blocks.unregisterBlockType(metadata.name);
  }
  blocks.registerBlockType(metadata.name, {
    ...metadata,
    edit: Edit,
    save: () => null
  });
})(wp.element, wp.blocks, wp.blockEditor, wp.components, wp.i18n, wp.serverSideRender);
//# sourceMappingURL=tripcategory.js.map
