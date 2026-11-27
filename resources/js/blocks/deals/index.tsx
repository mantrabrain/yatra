import { __ } from "@wordpress/i18n";
import {
  registerServerBlock,
  type ControlDef,
} from "../components/ServerBlockEdit";
import blockMetadata from "./block.json";

const controls: ControlDef[] = [
  {
    name: "per_page",
    type: "range",
    label: __("Number of Trips", "yatra"),
    min: 1,
    max: 50,
  },
  {
    name: "columns",
    type: "range",
    label: __("Columns", "yatra"),
    min: 1,
    max: 6,
  },
  {
    name: "order",
    type: "select",
    label: __("Order", "yatra"),
    options: [
      { label: __("Oldest first", "yatra"), value: "asc" },
      { label: __("Newest first", "yatra"), value: "desc" },
    ],
  },
  {
    name: "card_layout",
    type: "select",
    label: __("Card layout", "yatra"),
    options: [
      { label: __("Use site default", "yatra"), value: "inherit" },
      { label: __("Standard", "yatra"), value: "standard" },
      { label: __("Compact (mobile only)", "yatra"), value: "compact_mobile" },
      { label: __("Compact (everywhere)", "yatra"), value: "compact_all" },
    ],
  },
];

registerServerBlock(blockMetadata, {
  panelTitle: __("Deals Settings", "yatra"),
  controls,
  icon: "tag",
});
