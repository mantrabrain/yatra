import { __ } from "@wordpress/i18n";
import {
  registerServerBlock,
  type ControlDef,
} from "../components/ServerBlockEdit";
import blockMetadata from "./block.json";

const controls: ControlDef[] = [
  {
    name: "tripId",
    type: "trip",
    help: __(
      'Leave on "Current trip" to show the trip whose page this is.',
      "yatra",
    ),
  },
  {
    name: "showAttributes",
    type: "toggle",
    label: __("Show trip attributes", "yatra"),
  },
];

registerServerBlock(blockMetadata, {
  panelTitle: __("Trip", "yatra"),
  controls,
  requiresTrip: true,
  icon: "list-view",
});
