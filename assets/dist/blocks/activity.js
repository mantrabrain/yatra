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
        /* @__PURE__ */ element.createElement(
          "legend",
          {
            className: "components-base-control__label",
            style: { padding: 0 }
          },
          label
        ),
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
      ), value.length > 0 && /* @__PURE__ */ element.createElement(
        "p",
        {
          className: "components-base-control__help",
          style: { marginTop: 4 }
        },
        i18n.sprintf(
          /* translators: %d = number of selected taxonomy items */
          i18n.__("%d selected", "yatra"),
          value.length
        )
      ), items.length === 0 && !loadError ? /* @__PURE__ */ element.createElement("p", { className: "components-base-control__help" }, i18n.__("No published items of this type yet.", "yatra")) : /* @__PURE__ */ element.createElement("div", { role: "group", "aria-label": label, style: listWrapStyle }, filteredItems.length === 0 ? /* @__PURE__ */ element.createElement("p", { style: { padding: "8px 12px", margin: 0, fontSize: 12 } }, i18n.__("No matching items.", "yatra")) : filteredItems.map((item) => {
        const cid = Number(item.id);
        return /* @__PURE__ */ element.createElement("div", { key: cid, style: { padding: "2px 8px" } }, /* @__PURE__ */ element.createElement(
          components.CheckboxControl,
          {
            label: `${item.name} (${cid})`,
            checked: selectedSet.has(cid),
            onChange: (checked) => toggleId(cid, checked === true),
            __nextHasNoMarginBottom: true
          }
        ));
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
      let ids = normalizeIds(attributes2.activityIds);
      if (ids.length === 0) {
        ids = migrateNumericCsvPairToIds(
          attributes2.activity_ids,
          attributes2.activity
        );
      }
      if (ids.length === 0) {
        return;
      }
      setAttributes({
        activityIds: ids,
        activity: "",
        activity_ids: ""
      });
    }, [setAttributes]);
    const activityIds = normalizeIds(attributes2.activityIds);
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
    ), /* @__PURE__ */ element.createElement(
      ClassificationMultiSelect,
      {
        taxonomy: "activity",
        label: i18n.__("Activities to show", "yatra"),
        help: i18n.__(
          'Use "All published" or narrow with search and checkboxes.',
          "yatra"
        ),
        value: activityIds,
        onChange: (ids) => setAttributes({ activityIds: ids })
      }
    )), /* @__PURE__ */ element.createElement(components.PanelBody, { title: i18n.__("Display options", "yatra"), initialOpen: false }, /* @__PURE__ */ element.createElement(
      components.ToggleControl,
      {
        label: i18n.__("Show trip count", "yatra"),
        checked: attributes2.show_trip_count,
        onChange: (value) => setAttributes({ show_trip_count: value })
      }
    ), /* @__PURE__ */ element.createElement(
      components.ToggleControl,
      {
        label: i18n.__("Show description", "yatra"),
        checked: attributes2.show_description,
        onChange: (value) => setAttributes({ show_description: value })
      }
    ), /* @__PURE__ */ element.createElement(
      components.ToggleControl,
      {
        label: i18n.__("Show image", "yatra"),
        checked: attributes2.show_image,
        onChange: (value) => setAttributes({ show_image: value })
      }
    ), /* @__PURE__ */ element.createElement(
      components.ToggleControl,
      {
        label: i18n.__("Hide empty activities", "yatra"),
        help: i18n.__(
          "Skip activities that have no published trips assigned. Off by default — turn on for a tighter live catalog, leave off for editorial / onboarding views.",
          "yatra"
        ),
        checked: attributes2.hide_empty,
        onChange: (value) => setAttributes({ hide_empty: value })
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
  const icon = "universal-access";
  const description = "Display activity listings with customizable options";
  const keywords = [
    "activity",
    "adventure",
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
    },
    activityIds: {
      type: "array",
      "default": []
    },
    hide_empty: {
      type: "boolean",
      "default": false,
      description: "When on, activities with zero published trips are skipped. Off by default to preserve the historical 'show everything' behavior."
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
})(wp.element, wp.blocks, wp.blockEditor, wp.components, wp.i18n, wp.serverSideRender, wp.apiFetch);
//# sourceMappingURL=activity.js.map
