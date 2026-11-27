(function(element, i18n, blockEditor, components, ServerSideRender, blocks, apiFetch) {
  "use strict";
  let cache = null;
  function loadTrips() {
    if (!cache) {
      cache = apiFetch({
        path: "/yatra/v1/trips/public?per_page=100"
      }).then((response) => {
        const data = response == null ? void 0 : response.data;
        if (Array.isArray(data)) {
          return data;
        }
        return Array.isArray(data == null ? void 0 : data.data) ? data.data : [];
      }).catch(() => {
        cache = null;
        return [];
      });
    }
    return cache;
  }
  function TripPicker({ value, onChange, help }) {
    const [trips, setTrips] = element.useState(null);
    element.useEffect(() => {
      let cancelled = false;
      loadTrips().then((rows) => {
        if (!cancelled) {
          setTrips(rows);
        }
      });
      return () => {
        cancelled = true;
      };
    }, []);
    if (trips === null) {
      return /* @__PURE__ */ element.createElement(components.Spinner, null);
    }
    const options = [
      { label: i18n.__("Current trip (trip pages)", "yatra"), value: "0" },
      ...trips.map((trip) => ({
        label: String(trip.title || `#${trip.id}`),
        value: String(trip.id)
      }))
    ];
    if (value > 0 && !options.some((o) => o.value === String(value))) {
      options.push({ label: `#${value}`, value: String(value) });
    }
    return /* @__PURE__ */ element.createElement(
      components.SelectControl,
      {
        label: i18n.__("Trip", "yatra"),
        help,
        value: String(value || 0),
        options,
        onChange: (next) => onChange(parseInt(next, 10) || 0),
        __nextHasNoMarginBottom: true
      }
    );
  }
  function renderControl(def, attributes2, setAttributes) {
    switch (def.type) {
      case "trip":
        return /* @__PURE__ */ element.createElement(
          TripPicker,
          {
            key: def.name,
            value: Number(attributes2[def.name] || 0),
            help: def.help,
            onChange: (id) => setAttributes({ [def.name]: id })
          }
        );
      case "toggle":
        return /* @__PURE__ */ element.createElement(
          components.ToggleControl,
          {
            key: def.name,
            label: def.label,
            checked: Boolean(attributes2[def.name]),
            onChange: (value) => setAttributes({ [def.name]: value }),
            __nextHasNoMarginBottom: true
          }
        );
      case "range":
        return /* @__PURE__ */ element.createElement(
          components.RangeControl,
          {
            key: def.name,
            label: def.label,
            value: Number(attributes2[def.name]),
            min: def.min,
            max: def.max,
            onChange: (value) => setAttributes({ [def.name]: value ?? def.min }),
            __nextHasNoMarginBottom: true
          }
        );
      case "select":
        return /* @__PURE__ */ element.createElement(
          components.SelectControl,
          {
            key: def.name,
            label: def.label,
            value: String(attributes2[def.name] ?? ""),
            options: def.options,
            onChange: (value) => setAttributes({ [def.name]: value }),
            __nextHasNoMarginBottom: true
          }
        );
      default:
        return /* @__PURE__ */ element.createElement(
          components.TextControl,
          {
            key: def.name,
            label: def.label,
            help: def.help,
            value: String(attributes2[def.name] ?? ""),
            onChange: (value) => setAttributes({ [def.name]: value }),
            __nextHasNoMarginBottom: true
          }
        );
    }
  }
  function registerServerBlock(blockMetadata2, options) {
    const {
      $schema: _$schema,
      editorScript: _$editorScript,
      ...metadata
    } = blockMetadata2;
    function Edit({ attributes: attributes2, setAttributes }) {
      const blockProps = blockEditor.useBlockProps();
      const tripDef = options.controls.find((c) => c.type === "trip");
      const needsTrip = !Number(attributes2.tripId || 0) && tripDef;
      let preview;
      if (options.staticPreview) {
        preview = /* @__PURE__ */ element.createElement(
          components.Placeholder,
          {
            icon: options.icon,
            label: metadata.title,
            instructions: options.staticPreview
          }
        );
      } else if (needsTrip) {
        preview = /* @__PURE__ */ element.createElement(
          components.Placeholder,
          {
            icon: options.icon,
            label: metadata.title,
            instructions: tripDef.type === "trip" ? tripDef.help : void 0
          },
          renderControl(tripDef, attributes2, setAttributes)
        );
      } else {
        preview = /* @__PURE__ */ element.createElement(
          ServerSideRender,
          {
            block: metadata.name,
            attributes: attributes2,
            key: JSON.stringify(attributes2)
          }
        );
      }
      return /* @__PURE__ */ element.createElement("div", { ...blockProps }, options.controls.length > 0 && /* @__PURE__ */ element.createElement(blockEditor.InspectorControls, null, /* @__PURE__ */ element.createElement(components.PanelBody, { title: options.panelTitle, initialOpen: true }, options.controls.map(
        (def) => renderControl(def, attributes2, setAttributes)
      ))), /* @__PURE__ */ element.createElement("div", { className: "yatra-block-editor-preview" }, preview));
    }
    if (blocks.getBlockType(metadata.name)) {
      blocks.unregisterBlockType(metadata.name);
    }
    blocks.registerBlockType(metadata.name, {
      ...metadata,
      edit: Edit,
      save: () => null
    });
  }
  const $schema = "https://schemas.wp.org/trunk/block.json";
  const apiVersion = 3;
  const name = "yatra/trip-booking";
  const title = "Trip Booking Card";
  const category = "yatra";
  const icon = "cart";
  const description = "Price, departure date, travellers and the Check availability button.";
  const keywords = [
    "booking",
    "price",
    "availability",
    "book",
    "yatra"
  ];
  const textdomain = "yatra";
  const attributes = {
    tripId: {
      type: "number",
      "default": 0
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
  const editorScript = "yatra-trip-booking-block-editor";
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
  const controls = [
    {
      name: "tripId",
      type: "trip",
      help: i18n.__(
        'Leave on "Current trip" to show the trip whose page this is.',
        "yatra"
      )
    }
  ];
  registerServerBlock(blockMetadata, {
    panelTitle: i18n.__("Trip", "yatra"),
    controls,
    icon: "cart"
  });
})(wp.element, wp.i18n, wp.blockEditor, wp.components, wp.serverSideRender, wp.blocks, wp.apiFetch);
//# sourceMappingURL=tripbooking.js.map
