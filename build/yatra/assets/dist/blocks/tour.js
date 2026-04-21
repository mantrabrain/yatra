(function(element, blocks, blockEditor, components, i18n, ServerSideRender) {
  "use strict";
  function Edit({ attributes: attributes2, setAttributes }) {
    return /* @__PURE__ */ element.createElement(element.Fragment, null, /* @__PURE__ */ element.createElement(blockEditor.InspectorControls, null, /* @__PURE__ */ element.createElement(components.PanelBody, { title: i18n.__("Trip Settings", "yatra"), initialOpen: true }, /* @__PURE__ */ element.createElement(
      components.TextControl,
      {
        label: i18n.__("Title", "yatra"),
        value: attributes2.title,
        onChange: (value) => setAttributes({ title: value })
      }
    ), /* @__PURE__ */ element.createElement(
      components.SelectControl,
      {
        label: i18n.__("Order", "yatra"),
        value: attributes2.order,
        options: [
          { label: i18n.__("Descending", "yatra"), value: "desc" },
          { label: i18n.__("Ascending", "yatra"), value: "asc" }
        ],
        onChange: (value) => setAttributes({ order: value })
      }
    ), /* @__PURE__ */ element.createElement(
      components.RangeControl,
      {
        label: i18n.__("Number of Tours", "yatra"),
        value: attributes2.per_page,
        onChange: (value) => setAttributes({ per_page: value || 10 }),
        min: 1,
        max: 50
      }
    ), /* @__PURE__ */ element.createElement(
      components.RangeControl,
      {
        label: i18n.__("Columns", "yatra"),
        value: attributes2.columns,
        onChange: (value) => setAttributes({
          columns: value !== void 0 && value !== null ? value : 3
        }),
        min: 1,
        max: 6
      }
    ), /* @__PURE__ */ element.createElement(
      components.ToggleControl,
      {
        label: i18n.__("Show only featured tours", "yatra"),
        checked: attributes2.featured,
        onChange: (value) => setAttributes({ featured: value })
      }
    ), /* @__PURE__ */ element.createElement(
      components.ToggleControl,
      {
        label: i18n.__("Show pagination", "yatra"),
        checked: attributes2.show_pagination,
        onChange: (value) => setAttributes({ show_pagination: value })
      }
    ))), /* @__PURE__ */ element.createElement("div", { className: "yatra-block-editor-preview" }, /* @__PURE__ */ element.createElement(
      ServerSideRender,
      {
        block: "yatra/tour",
        attributes: attributes2,
        key: JSON.stringify(attributes2)
      }
    )));
  }
  const $schema = "https://schemas.wp.org/trunk/block.json";
  const apiVersion = 3;
  const name = "yatra/tour";
  const title = "Trip";
  const category = "yatra";
  const icon = "palmtree";
  const description = "Display trip listings with customizable options";
  const keywords = [
    "tour",
    "trip",
    "trips",
    "tours",
    "travel",
    "yatra"
  ];
  const textdomain = "yatra";
  const attributes = {
    order: {
      type: "string",
      "default": "desc"
    },
    featured: {
      type: "boolean",
      "default": false
    },
    per_page: {
      type: "number",
      "default": 10
    },
    columns: {
      type: "number",
      "default": 3
    },
    title: {
      type: "string",
      "default": "Our Trips"
    },
    show_pagination: {
      type: "boolean",
      "default": true
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
  const editorScript = "yatra-tour-block-editor";
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
//# sourceMappingURL=tour.js.map
