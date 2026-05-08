import apiFetch from "@wordpress/api-fetch";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "@wordpress/element";
import {
  Button,
  CheckboxControl,
  RadioControl,
  SearchControl,
  Spinner,
} from "@wordpress/components";
import { sprintf, __ } from "@wordpress/i18n";

export type ClassificationTaxonomy =
  | "destination"
  | "activity"
  | "trip_category"
  | "difficulty";

interface ChoiceItem {
  id: number;
  name: string;
}

type Scope = "all" | "narrow";

interface ClassificationMultiSelectProps {
  taxonomy: ClassificationTaxonomy;
  label: string;
  help: string;
  value: number[];
  onChange: (ids: number[]) => void;
}

const listWrapStyle: CSSProperties = {
  maxHeight: 220,
  overflowY: "auto",
  marginTop: 8,
  padding: "4px 0",
  border: "1px solid #94949451",
  borderRadius: 2,
};

export function ClassificationMultiSelect({
  taxonomy,
  label,
  help,
  value,
  onChange,
}: ClassificationMultiSelectProps) {
  const [items, setItems] = useState<ChoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<Scope>(() =>
    value.length > 0 ? "narrow" : "all",
  );

  useEffect(() => {
    if (value.length > 0) {
      setScope("narrow");
    }
  }, [value.length]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    apiFetch<{ items?: ChoiceItem[] }>({
      path: `/yatra/v1/block-editor/taxonomy-choices?taxonomy=${encodeURIComponent(
        taxonomy,
      )}`,
    })
      .then((response) => {
        if (!cancelled) {
          setItems(response.items ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [taxonomy]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q === "") {
      return items;
    }
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, search]);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const toggleId = (id: number, checked: boolean) => {
    const next = new Set(selectedSet);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    onChange([...next].sort((a, b) => a - b));
  };

  const onScopeChange = (next: string) => {
    if (next === "all") {
      setScope("all");
      onChange([]);
      setSearch("");
    } else {
      setScope("narrow");
    }
  };

  if (loading) {
    return (
      <fieldset
        className="yatra-block-taxonomy-field"
        style={{ margin: "0 0 16px", border: "none", padding: 0 }}
      >
        <legend className="components-base-control__label" style={{ padding: 0 }}>
          {label}
        </legend>
        <Spinner />
      </fieldset>
    );
  }

  return (
    <fieldset
      className="yatra-block-taxonomy-field"
      style={{ margin: "0 0 16px", border: "none", padding: 0 }}
    >
      <legend className="components-base-control__label" style={{ padding: 0 }}>
        {label}
      </legend>
      <p
        className="components-base-control__help"
        style={{ marginTop: 4, marginBottom: 10 }}
      >
        {help}
      </p>
      {loadError && (
        <p style={{ color: "#b32d2e", fontSize: 12, marginBottom: 8 }}>
          {__(
            "Could not load options. Confirm you can edit posts and Yatra REST is available.",
            "yatra",
          )}
        </p>
      )}
      <RadioControl
        label={__("Listing scope", "yatra")}
        selected={scope}
        options={[
          {
            label: __("All published (no restriction)", "yatra"),
            value: "all",
          },
          {
            label: __("Only selected (search below)", "yatra"),
            value: "narrow",
          },
        ]}
        onChange={onScopeChange}
      />
      {scope === "all" && (
        <p className="components-base-control__help" style={{ marginTop: 4 }}>
          {__(
            "The frontend will include every matching published item.",
            "yatra",
          )}
        </p>
      )}
      {scope === "narrow" && (
        <>
          <SearchControl
            label={sprintf(
              /* translators: %d = number of loaded taxonomy items */
              __("Filter items (%d loaded)", "yatra"),
              items.length,
            )}
            hideLabelFromVision
            placeholder={__("Type to filter the list…", "yatra")}
            value={search}
            onChange={(s) => setSearch(s)}
            __nextHasNoMarginBottom
          />
          {value.length > 0 && (
            <p className="components-base-control__help" style={{ marginTop: 4 }}>
              {sprintf(
                /* translators: %d = number of selected taxonomy items */
                __("%d selected", "yatra"),
                value.length,
              )}
            </p>
          )}
          {items.length === 0 && !loadError ? (
            <p className="components-base-control__help">
              {__("No published items of this type yet.", "yatra")}
            </p>
          ) : (
            <div role="group" aria-label={label} style={listWrapStyle}>
              {filteredItems.length === 0 ? (
                <p style={{ padding: "8px 12px", margin: 0, fontSize: 12 }}>
                  {__("No matching items.", "yatra")}
                </p>
              ) : (
                filteredItems.map((item) => {
                  const cid = Number(item.id);
                  return (
                    <div
                      key={cid}
                      style={{ padding: "2px 8px" }}
                    >
                      <CheckboxControl
                        label={`${item.name} (${cid})`}
                        checked={selectedSet.has(cid)}
                        onChange={(checked) =>
                          toggleId(cid, checked === true)
                        }
                        __nextHasNoMarginBottom
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}
          {value.length > 0 && (
            <Button
              variant="link"
              style={{ paddingLeft: 0, marginTop: 6 }}
              onClick={() => onChange([])}
            >
              {__("Clear selected", "yatra")}
            </Button>
          )}
          <p className="components-base-control__help" style={{ marginTop: 6 }}>
            {__(
              "If none are checked, the block behaves like “All” (no taxonomy filter).",
              "yatra",
            )}
          </p>
        </>
      )}
    </fieldset>
  );
}
