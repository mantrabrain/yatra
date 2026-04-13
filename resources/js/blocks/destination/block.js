(function () {
  var el = wp.element.createElement;
  var registerBlockType = wp.blocks.registerBlockType;
  var InspectorControls = wp.blockEditor.InspectorControls;
  var PanelBody = wp.components.PanelBody;
  var TextControl = wp.components.TextControl;
  var RangeControl = wp.components.RangeControl;
  var SelectControl = wp.components.SelectControl;
  var ToggleControl = wp.components.ToggleControl;
  var __ = wp.i18n.__;

  function DestinationEdit(props) {
    var attributes = props.attributes;
    var setAttributes = props.setAttributes;

    return el(
      wp.element.Fragment,
      null,
      el(
        InspectorControls,
        null,
        el(
          PanelBody,
          {
            title: __("Destination Settings", "yatra"),
            initialOpen: true,
          },
          el(TextControl, {
            label: __("Title", "yatra"),
            value: attributes.title,
            onChange: function (value) {
              setAttributes({ title: value });
            },
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true,
          }),
          el(SelectControl, {
            label: __("Order", "yatra"),
            value: attributes.order,
            options: [
              { label: __("Ascending", "yatra"), value: "asc" },
              { label: __("Descending", "yatra"), value: "desc" },
            ],
            onChange: function (value) {
              setAttributes({ order: value });
            },
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true,
          }),
          el(RangeControl, {
            label: __("Number of Destinations", "yatra"),
            value: attributes.per_page,
            onChange: function (value) {
              setAttributes({
                per_page:
                  value !== undefined && value !== null ? value : 10,
              });
            },
            min: 1,
            max: 50,
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true,
          }),
          el(RangeControl, {
            label: __("Columns", "yatra"),
            value: attributes.columns,
            onChange: function (value) {
              setAttributes({ columns: value || 3 });
            },
            min: 1,
            max: 6,
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true,
          }),
          el(ToggleControl, {
            label: __("Show pagination", "yatra"),
            checked: attributes.show_pagination,
            onChange: function (value) {
              setAttributes({ show_pagination: value });
            },
            __nextHasNoMarginBottom: true,
          }),
        ),
      ),
      el(wp.serverSideRender, {
        block: "yatra/destination",
        attributes: attributes,
        urlQueryArgs: {
          preview: true,
        },
      }),
    );
  }

  registerBlockType("yatra/destination", {
    apiVersion: 3,
    title: "Destination",
    icon: "location",
    category: "yatra",
    attributes: {
      order: {
        type: "string",
        default: "asc",
      },
      columns: {
        type: "number",
        default: 3,
      },
      per_page: {
        type: "number",
        default: 10,
      },
      title: {
        type: "string",
        default: "Destination Showcase",
      },
      show_pagination: {
        type: "boolean",
        default: true,
      },
    },
    edit: DestinationEdit,
    save: function () {
      return null; // Server-side rendered
    },
  });
})();
