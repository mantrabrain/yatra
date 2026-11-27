import { __ } from "@wordpress/i18n";
import {
  registerServerBlock,
  type ControlDef,
} from "../components/ServerBlockEdit";
import blockMetadata from "./block.json";

const visibility = [
  { label: __("Use site setting", "yatra"), value: "" },
  { label: __("Show", "yatra"), value: "yes" },
  { label: __("Hide", "yatra"), value: "no" },
];

const controls: ControlDef[] = [
  {
    name: "keyword",
    type: "select",
    label: __("Keyword field", "yatra"),
    options: visibility,
  },
  {
    name: "destination",
    type: "select",
    label: __("Destination field", "yatra"),
    options: visibility,
  },
  {
    name: "activities",
    type: "select",
    label: __("Activities field", "yatra"),
    options: visibility,
  },
  {
    name: "duration",
    type: "select",
    label: __("Duration field", "yatra"),
    options: visibility,
  },
  {
    name: "budget",
    type: "select",
    label: __("Budget field", "yatra"),
    options: visibility,
  },
  {
    name: "date",
    type: "select",
    label: __("Date field", "yatra"),
    options: visibility,
  },
];

registerServerBlock(blockMetadata, {
  panelTitle: __("Search fields", "yatra"),
  controls,
  icon: "search",
});
