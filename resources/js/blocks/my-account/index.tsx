import { __ } from "@wordpress/i18n";
import {
  registerServerBlock,
  type ControlDef,
} from "../components/ServerBlockEdit";
import blockMetadata from "./block.json";

const controls: ControlDef[] = [];

registerServerBlock(blockMetadata, {
  panelTitle: __("My Account", "yatra"),
  controls,
  staticPreview: __(
    "The customer account dashboard (bookings, profile, wishlist) appears here on the live site. Guests see a login prompt.",
    "yatra",
  ),
  icon: "admin-users",
});
