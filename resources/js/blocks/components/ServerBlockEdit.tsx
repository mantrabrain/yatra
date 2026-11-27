import { InspectorControls, useBlockProps } from "@wordpress/block-editor";
import {
  PanelBody,
  Placeholder,
  RangeControl,
  SelectControl,
  TextControl,
  ToggleControl,
} from "@wordpress/components";
import type { ComponentProps } from "react";
import ServerSideRender from "@wordpress/server-side-render";
import {
  getBlockType,
  registerBlockType,
  unregisterBlockType,
  type BlockConfiguration,
} from "@wordpress/blocks";
import { TripPicker } from "./TripPicker";

/**
 * Inspector control definition. Mirrors AbstractServerBlock::controls() in PHP
 * (the Elementor widgets build their controls from that list).
 */
export type ControlDef =
  | { name: string; type: "text"; label: string; help?: string }
  | { name: string; type: "range"; label: string; min: number; max: number }
  | { name: string; type: "toggle"; label: string }
  | {
      name: string;
      type: "select";
      label: string;
      options: { label: string; value: string }[];
    }
  | { name: string; type: "trip"; help?: string };

interface ServerBlockOptions {
  /** Panel title in the block sidebar. */
  panelTitle: string;
  controls: ControlDef[];
  /** Single-trip section block: needs a trip before the preview can render. */
  requiresTrip?: boolean;
  /** Shown instead of the live preview (e.g. the React account app). */
  staticPreview?: string;
  icon?: ComponentProps<typeof Placeholder>["icon"];
}

type Attributes = Record<string, unknown>;

interface EditProps {
  attributes: Attributes;
  setAttributes: (attrs: Attributes) => void;
}

function renderControl(
  def: ControlDef,
  attributes: Attributes,
  setAttributes: (attrs: Attributes) => void,
) {
  switch (def.type) {
    case "trip":
      return (
        <TripPicker
          key={def.name}
          value={Number(attributes[def.name] || 0)}
          help={def.help}
          onChange={(id) => setAttributes({ [def.name]: id })}
        />
      );
    case "toggle":
      return (
        <ToggleControl
          key={def.name}
          label={def.label}
          checked={Boolean(attributes[def.name])}
          onChange={(value: boolean) => setAttributes({ [def.name]: value })}
          __nextHasNoMarginBottom
        />
      );
    case "range":
      return (
        <RangeControl
          key={def.name}
          label={def.label}
          value={Number(attributes[def.name])}
          min={def.min}
          max={def.max}
          onChange={(value?: number) =>
            setAttributes({ [def.name]: value ?? def.min })
          }
          __nextHasNoMarginBottom
        />
      );
    case "select":
      return (
        <SelectControl
          key={def.name}
          label={def.label}
          value={String(attributes[def.name] ?? "")}
          options={def.options}
          onChange={(value: string) => setAttributes({ [def.name]: value })}
          __nextHasNoMarginBottom
        />
      );
    default:
      return (
        <TextControl
          key={def.name}
          label={def.label}
          help={def.help}
          value={String(attributes[def.name] ?? "")}
          onChange={(value: string) => setAttributes({ [def.name]: value })}
          __nextHasNoMarginBottom
        />
      );
  }
}

/**
 * Register a server-rendered Yatra block from its block.json plus an inspector
 * definition. Preview = ServerSideRender (same PHP render as the front end).
 */
export function registerServerBlock(
  blockMetadata: Record<string, unknown> & { name: string; title: string },
  options: ServerBlockOptions,
) {
  const {
    $schema: _$schema,
    editorScript: _$editorScript,
    ...metadata
  } = blockMetadata;

  function Edit({ attributes, setAttributes }: EditProps) {
    const blockProps = useBlockProps();
    const tripDef = options.controls.find((c) => c.type === "trip");
    const needsTrip =
      options.requiresTrip && !Number(attributes.tripId || 0) && tripDef;

    let preview;
    if (options.staticPreview) {
      preview = (
        <Placeholder
          icon={options.icon}
          label={metadata.title as string}
          instructions={options.staticPreview}
        />
      );
    } else if (needsTrip) {
      preview = (
        <Placeholder
          icon={options.icon}
          label={metadata.title as string}
          instructions={tripDef.type === "trip" ? tripDef.help : undefined}
        >
          {renderControl(tripDef, attributes, setAttributes)}
        </Placeholder>
      );
    } else {
      preview = (
        <ServerSideRender
          block={metadata.name}
          attributes={attributes}
          key={JSON.stringify(attributes)}
        />
      );
    }

    return (
      <div {...blockProps}>
        {options.controls.length > 0 && (
          <InspectorControls>
            <PanelBody title={options.panelTitle} initialOpen={true}>
              {options.controls.map((def) =>
                renderControl(def, attributes, setAttributes),
              )}
            </PanelBody>
          </InspectorControls>
        )}
        <div className="yatra-block-editor-preview">{preview}</div>
      </div>
    );
  }

  // Replace a stale registration (no edit / partial merge) so the inserter works.
  if (getBlockType(metadata.name)) {
    unregisterBlockType(metadata.name);
  }

  registerBlockType(metadata.name, {
    ...metadata,
    edit: Edit,
    save: () => null,
  } as unknown as BlockConfiguration);
}
