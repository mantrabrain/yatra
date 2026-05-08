(function(element, blocks, blockEditor, components, i18n, ServerSideRender, apiFetch) {
  "use strict";
  const listWrapStyle = {
    maxHeight: 220,
    overflowY: "auto",
    marginTop: 8,
    padding: "4px 0",
    border: "1px solid #94949451",
    borderRadius: 2
  };
  function ClassificationMultiSelect({
    taxonomy,
    label,
    help,
    value,
    onChange
  }) {
    const [items, setItems] = element.useState([]);
    const [loading, setLoading] = element.useState(true);
    const [loadError, setLoadError] = element.useState(false);
    const [search, setSearch] = element.useState("");
    const [scope, setScope] = element.useState(
      () => value.length > 0 ? "narrow" : "all"
    );
    element.useEffect(() => {
      if (value.length > 0) {
        setScope("narrow");
      }
    }, [value.length]);
    element.useEffect(() => {
      let cancelled = false;
      setLoading(true);
      setLoadError(false);
      apiFetch({
        path: `/yatra/v1/block-editor/taxonomy-choices?taxonomy=${encodeURIComponent(
          taxonomy
        )}`
      }).then((response) => {
        if (!cancelled) {
          setItems(response.items ?? []);
        }
      }).catch(() => {
        if (!cancelled) {
          setItems([]);
          setLoadError(true);
        }
      }).finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [taxonomy]);
    const filteredItems = element.useMemo(() => {
      const q = search.trim().toLowerCase();
      if (q === "") {
        return items;
      }
      return items.filter((i) => i.name.toLowerCase().includes(q));
    }, [items, search]);
    const selectedSet = element.useMemo(() => new Set(value), [value]);
    const toggleId = (id, checked) => {
      const next = new Set(selectedSet);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      onChange([...next].sort((a, b) => a - b));
    };
    const onScopeChange = (next) => {
      if (next === "all") {
        setScope("all");
        onChange([]);
        setSearch("");
      } else {
        setScope("narrow");
      }
    };
    if (loading) {
      return /* @__PURE__ */ element.createElement(
        "fieldset",
        {
          className: "yatra-block-taxonomy-field",
          style: { margin: "0 0 16px", border: "none", padding: 0 }
        },
        /* @__PURE__ */ element.createElement("legend", { className: "components-base-control__label", style: { padding: 0 } }, label),
        /* @__PURE__ */ element.createElement(components.Spinner, null)
      );
    }
    return /* @__PURE__ */ element.createElement(
      "fieldset",
      {
        className: "yatra-block-taxonomy-field",
        style: { margin: "0 0 16px", border: "none", padding: 0 }
      },
      /* @__PURE__ */ element.createElement("legend", { className: "components-base-control__label", style: { padding: 0 } }, label),
      /* @__PURE__ */ element.createElement(
        "p",
        {
          className: "components-base-control__help",
          style: { marginTop: 4, marginBottom: 10 }
        },
        help
      ),
      loadError && /* @__PURE__ */ element.createElement("p", { style: { color: "#b32d2e", fontSize: 12, marginBottom: 8 } }, i18n.__(
        "Could not load options. Confirm you can edit posts and Yatra REST is available.",
        "yatra"
      )),
      /* @__PURE__ */ element.createElement(
        components.RadioControl,
        {
          label: i18n.__("Listing scope", "yatra"),
          selected: scope,
          options: [
            {
              label: i18n.__("All published (no restriction)", "yatra"),
              value: "all"
            },
            {
              label: i18n.__("Only selected (search below)", "yatra"),
              value: "narrow"
            }
          ],
          onChange: onScopeChange
        }
      ),
      scope === "all" && /* @__PURE__ */ element.createElement("p", { className: "components-base-control__help", style: { marginTop: 4 } }, i18n.__(
        "The frontend will include every matching published item.",
        "yatra"
      )),
      scope === "narrow" && /* @__PURE__ */ element.createElement(element.Fragment, null, /* @__PURE__ */ element.createElement(
        components.SearchControl,
        {
          label: i18n.sprintf(
            /* translators: %d = number of loaded taxonomy items */
            i18n.__("Filter items (%d loaded)", "yatra"),
            items.length
          ),
          hideLabelFromVision: true,
          placeholder: i18n.__("Type to filter the list…", "yatra"),
          value: search,
          onChange: (s) => setSearch(s),
          __nextHasNoMarginBottom: true
        }
      ), value.length > 0 && /* @__PURE__ */ element.createElement("p", { className: "components-base-control__help", style: { marginTop: 4 } }, i18n.sprintf(
        /* translators: %d = number of selected taxonomy items */
        i18n.__("%d selected", "yatra"),
        value.length
      )), items.length === 0 && !loadError ? /* @__PURE__ */ element.createElement("p", { className: "components-base-control__help" }, i18n.__("No published items of this type yet.", "yatra")) : /* @__PURE__ */ element.createElement("div", { role: "group", "aria-label": label, style: listWrapStyle }, filteredItems.length === 0 ? /* @__PURE__ */ element.createElement("p", { style: { padding: "8px 12px", margin: 0, fontSize: 12 } }, i18n.__("No matching items.", "yatra")) : filteredItems.map((item) => {
        const cid = Number(item.id);
        return /* @__PURE__ */ element.createElement(
          "div",
          {
            key: cid,
            style: { padding: "2px 8px" }
          },
          /* @__PURE__ */ element.createElement(
            components.CheckboxControl,
            {
              label: `${item.name} (${cid})`,
              checked: selectedSet.has(cid),
              onChange: (checked) => toggleId(cid, checked === true),
              __nextHasNoMarginBottom: true
            }
          )
        );
      })), value.length > 0 && /* @__PURE__ */ element.createElement(
        components.Button,
        {
          variant: "link",
          style: { paddingLeft: 0, marginTop: 6 },
          onClick: () => onChange([])
        },
        i18n.__("Clear selected", "yatra")
      ), /* @__PURE__ */ element.createElement("p", { className: "components-base-control__help", style: { marginTop: 6 } }, i18n.__(
        "If none are checked, the block behaves like “All” (no taxonomy filter).",
        "yatra"
      )))
    );
  }
  function migrateNumericCsvPairToIds(legacyA, legacyB) {
    const raw = [legacyA ?? "", legacyB ?? ""].find(
      (s) => String(s).trim() !== ""
    );
    if (raw === void 0) {
      return [];
    }
    const parts = String(raw).split(",").map((s) => s.trim()).filter(Boolean);
    const ids = [];
    for (const p of parts) {
      if (!/^\d+$/.test(p)) {
        return [];
      }
      const n = parseInt(p, 10);
      if (n > 0) {
        ids.push(n);
      }
    }
    return [...new Set(ids)];
  }
  function normalizeIds(arr) {
    return Array.isArray(arr) ? [...new Set(arr.map((n) => parseInt(String(n), 10)).filter((n) => n > 0))] : [];
  }
  function Edit({ attributes: attributes2, setAttributes }) {
    const migratedOnce = element.useRef(false);
    element.useEffect(() => {
      if (migratedOnce.current) {
        return;
      }
      migratedOnce.current = true;
      const clears = {};
      let destIds = normalizeIds(attributes2.destinationIds);
      if (destIds.length === 0) {
        destIds = migrateNumericCsvPairToIds(
          attributes2.destination_ids,
          attributes2.destination
        );
        if (destIds.length) {
          clears.destination = "";
          clears.destination_ids = "";
        }
      }
      let actIds = normalizeIds(attributes2.activityIds);
      if (actIds.length === 0) {
        actIds = migrateNumericCsvPairToIds(attributes2.activity_ids, attributes2.activity);
        if (actIds.length) {
          clears.activity = "";
          clears.activity_ids = "";
        }
      }
      let catIds = normalizeIds(attributes2.categoryIds);
      if (catIds.length === 0) {
        catIds = migrateNumericCsvPairToIds(
          attributes2.category_ids,
          attributes2.category
        );
        if (catIds.length) {
          clears.category = "";
          clears.category_ids = "";
        }
      }
      let diffIds = normalizeIds(attributes2.difficultyIds);
      if (diffIds.length === 0) {
        const fromDiff = migrateNumericCsvPairToIds(attributes2.difficulty, "");
        diffIds = fromDiff;
        if (fromDiff.length) {
          clears.difficulty = "";
        }
      }
      if (attributes2.featured && !attributes2.featured_priority) {
        clears.featured_priority = "featured";
        clears.featured = false;
      }
      const next = { ...clears };
      if (destIds.length) {
        next.destinationIds = destIds;
      }
      if (actIds.length) {
        next.activityIds = actIds;
      }
      if (catIds.length) {
        next.categoryIds = catIds;
      }
      if (diffIds.length) {
        next.difficultyIds = diffIds;
      }
      const touched = Object.keys(next).filter((key) => next[key] !== void 0).length > 0;
      if (touched) {
        setAttributes(next);
      }
    }, [setAttributes]);
    const destinationIds = normalizeIds(attributes2.destinationIds);
    const activityIds = normalizeIds(attributes2.activityIds);
    const categoryIds = normalizeIds(attributes2.categoryIds);
    const difficultyIds = normalizeIds(attributes2.difficultyIds);
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
        label: i18n.__("Number of Trips", "yatra"),
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
      components.SelectControl,
      {
        label: i18n.__("Featured Priority", "yatra"),
        help: i18n.__(
          "Restrict to trips marked with a specific priority on the trip form (Categorization → Featured Priority). Choose Any to show all trips.",
          "yatra"
        ),
        value: attributes2.featured_priority || "",
        options: [
          { label: i18n.__("Any", "yatra"), value: "" },
          { label: i18n.__("Featured", "yatra"), value: "featured" },
          { label: i18n.__("New", "yatra"), value: "new" },
          { label: i18n.__("Limited Time", "yatra"), value: "limited" }
        ],
        onChange: (value) => setAttributes({
          featured_priority: value,
          // Keep legacy `featured` boolean in sync for back-compat
          // (existing block instances saved with featured=true).
          featured: value === "featured"
        })
      }
    ), /* @__PURE__ */ element.createElement(
      components.ToggleControl,
      {
        label: i18n.__("Show pagination", "yatra"),
        checked: attributes2.show_pagination,
        onChange: (value) => setAttributes({ show_pagination: value })
      }
    )), /* @__PURE__ */ element.createElement(components.PanelBody, { title: i18n.__("Filters", "yatra"), initialOpen: false }, /* @__PURE__ */ element.createElement(
      ClassificationMultiSelect,
      {
        taxonomy: "destination",
        label: i18n.__("Destinations", "yatra"),
        help: i18n.__(
          'Choose "All published" or restrict the grid to destinations you tick. Other filters narrow results further.',
          "yatra"
        ),
        value: destinationIds,
        onChange: (ids) => setAttributes({ destinationIds: ids })
      }
    ), /* @__PURE__ */ element.createElement(
      ClassificationMultiSelect,
      {
        taxonomy: "activity",
        label: i18n.__("Activities", "yatra"),
        help: i18n.__(
          "Optional. When restricting, trips must match every classification filter that has selections.",
          "yatra"
        ),
        value: activityIds,
        onChange: (ids) => setAttributes({ activityIds: ids })
      }
    ), /* @__PURE__ */ element.createElement(
      ClassificationMultiSelect,
      {
        taxonomy: "trip_category",
        label: i18n.__("Trip categories", "yatra"),
        help: i18n.__(
          "Yatra trip types (not WooCommerce categories). Combine with destinations/activities if needed.",
          "yatra"
        ),
        value: categoryIds,
        onChange: (ids) => setAttributes({ categoryIds: ids })
      }
    ), /* @__PURE__ */ element.createElement(
      ClassificationMultiSelect,
      {
        taxonomy: "difficulty",
        label: i18n.__("Difficulty levels", "yatra"),
        help: i18n.__(
          "Optional. When restricting, trips must use one of the selected difficulty classifications.",
          "yatra"
        ),
        value: difficultyIds,
        onChange: (ids) => setAttributes({ difficultyIds: ids })
      }
    ), /* @__PURE__ */ element.createElement(
      components.TextControl,
      {
        label: i18n.__("Search", "yatra"),
        value: attributes2.search,
        onChange: (v) => setAttributes({ search: v })
      }
    ), /* @__PURE__ */ element.createElement(
      components.TextControl,
      {
        label: i18n.__("Price min", "yatra"),
        type: "number",
        value: attributes2.price_min,
        onChange: (v) => setAttributes({ price_min: v })
      }
    ), /* @__PURE__ */ element.createElement(
      components.TextControl,
      {
        label: i18n.__("Price max", "yatra"),
        type: "number",
        value: attributes2.price_max,
        onChange: (v) => setAttributes({ price_max: v })
      }
    ), /* @__PURE__ */ element.createElement(
      components.TextControl,
      {
        label: i18n.__("Duration min (days)", "yatra"),
        type: "number",
        value: attributes2.duration_min,
        onChange: (v) => setAttributes({ duration_min: v })
      }
    ), /* @__PURE__ */ element.createElement(
      components.TextControl,
      {
        label: i18n.__("Duration max (days)", "yatra"),
        type: "number",
        value: attributes2.duration_max,
        onChange: (v) => setAttributes({ duration_max: v })
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
    featured_priority: {
      type: "string",
      "default": "",
      "enum": [
        "",
        "featured",
        "new",
        "limited"
      ]
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
    },
    destinationIds: {
      type: "array",
      "default": []
    },
    activityIds: {
      type: "array",
      "default": []
    },
    categoryIds: {
      type: "array",
      "default": []
    },
    difficultyIds: {
      type: "array",
      "default": []
    },
    price_min: {
      type: "string",
      "default": ""
    },
    price_max: {
      type: "string",
      "default": ""
    },
    duration_min: {
      type: "string",
      "default": ""
    },
    duration_max: {
      type: "string",
      "default": ""
    },
    search: {
      type: "string",
      "default": ""
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
})(wp.element, wp.blocks, wp.blockEditor, wp.components, wp.i18n, wp.serverSideRender, wp.apiFetch);
//# sourceMappingURL=tour.js.map
