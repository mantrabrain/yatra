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

  function TourEdit(props) {
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
            title: __("Tour Settings", "yatra"),
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
              { label: __("Descending", "yatra"), value: "desc" },
              { label: __("Ascending", "yatra"), value: "asc" },
            ],
            onChange: function (value) {
              setAttributes({ order: value });
            },
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true,
          }),
          el(RangeControl, {
            label: __("Number of Tours", "yatra"),
            value: attributes.per_page,
            onChange: function (value) {
              setAttributes({ per_page: value || 10 });
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
            label: __("Show only featured tours", "yatra"),
            checked: attributes.featured,
            onChange: function (value) {
              setAttributes({ featured: value });
            },
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
        block: "yatra/tour",
        attributes: attributes,
        urlQueryArgs: {
          preview: true,
        },
      }),
    );
  }

  registerBlockType("yatra/tour", {
    title: "Trip",
    icon: "palmtree",
    category: "yatra",
    attributes: {
      order: {
        type: "string",
        default: "desc",
      },
      featured: {
        type: "boolean",
        default: false,
      },
      per_page: {
        type: "number",
        default: 10,
      },
      columns: {
        type: "number",
        default: 3,
      },
      title: {
        type: "string",
        default: "Our Trips",
      },
      show_pagination: {
        type: "boolean",
        default: true,
      },
    },
    edit: TourEdit,
    save: function () {
      return null; // Server-side rendered
    },
  });

  // Initialize tour functionality when block is rendered in editor
  function initializeTourBlock() {
    // Prevent trip.js errors by checking if we're in block editor
    if (window.jQuery) {
      // Remove trip.js error handlers that look for non-existent elements
      window.jQuery(document).off("ready", function () {
        // Prevent trip.js from running in block editor context
      });
    }

    // Re-initialize tour shortcode JavaScript for dynamically loaded content
    if (window.jQuery && window.jQuery.fn.yatraTourShortcode) {
      window.jQuery(".yatra-tour-shortcode").each(function () {
        if (!window.jQuery(this).data("yatra-initialized")) {
          window.jQuery(this).yatraTourShortcode();
          window.jQuery(this).data("yatra-initialized", true);
        }
      });
    }

    // Re-bind pagination events
    if (window.jQuery) {
      window
        .jQuery(document)
        .off("click", ".yatra-tour-shortcode .yatra-pagination a")
        .on("click", ".yatra-tour-shortcode .yatra-pagination a", function (e) {
          e.preventDefault();
          var $this = window.jQuery(this);
          var page = $this.data("page");
          var $container = $this.closest(".yatra-tour-shortcode");

          if (page && $container.length) {
            // Show loading
            $container.addClass("yatra-loading");

            // Load new page
            window.jQuery.ajax({
              url: yatra_ajax.ajax_url,
              type: "POST",
              data: {
                action: "yatra_load_tours",
                page: page,
                attributes: $container.data("attributes") || {},
              },
              success: function (response) {
                $container.html(response);
                $container.removeClass("yatra-loading");
                initializeTourBlock(); // Re-initialize for new content
              },
              error: function () {
                $container.removeClass("yatra-loading");
              },
            });
          }
        });
    }
  }

  // Initialize when DOM is ready and when ServerSideRender updates
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeTourBlock);
  } else {
    initializeTourBlock();
  }

  // Also initialize when block content changes
  if (window.wp && window.wp.data && window.wp.data.subscribe) {
    window.wp.data.subscribe(function () {
      setTimeout(initializeTourBlock, 100);
    });
  }
})();
