(function(element, blocks, blockEditor, components, i18n, ServerSideRender) {
  "use strict";
  function Edit({ attributes: attributes2, setAttributes }) {
    return /* @__PURE__ */ element.createElement(element.Fragment, null, /* @__PURE__ */ element.createElement(blockEditor.InspectorControls, null, /* @__PURE__ */ element.createElement(components.PanelBody, { title: i18n.__("Activity Settings", "yatra"), initialOpen: true }, /* @__PURE__ */ element.createElement(
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
          { label: i18n.__("Ascending", "yatra"), value: "asc" },
          { label: i18n.__("Descending", "yatra"), value: "desc" }
        ],
        onChange: (value) => setAttributes({ order: value })
      }
    ), /* @__PURE__ */ element.createElement(
      components.RangeControl,
      {
        label: i18n.__("Number of Activities", "yatra"),
        value: attributes2.per_page,
        onChange: (value) => setAttributes({
          per_page: value !== void 0 && value !== null ? value : 10
        }),
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
        label: i18n.__("Show pagination", "yatra"),
        checked: attributes2.show_pagination,
        onChange: (value) => setAttributes({ show_pagination: value })
      }
    ))), /* @__PURE__ */ element.createElement("div", { className: "yatra-block-editor-preview" }, /* @__PURE__ */ element.createElement(
      ServerSideRender,
      {
        block: "yatra/activity",
        attributes: attributes2,
        key: JSON.stringify(attributes2)
      }
    )));
  }
  const $schema = "https://schemas.wp.org/trunk/block.json";
  const apiVersion = 3;
  const name = "yatra/activity";
  const title = "Activity";
  const category = "yatra";
  const icon = "buddicons-pm";
  const description = "Display activity listings with customizable options";
  const keywords = [
    "activity",
    "things to do",
    "yatra"
  ];
  const textdomain = "yatra";
  const attributes = {
    order: {
      type: "string",
      "default": "asc"
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
      "default": "Activity Listings"
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
  const editorScript = "yatra-activity-block-editor";
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
//# sourceMappingURL=activity.js.map
