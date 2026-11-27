import { __ } from "@wordpress/i18n";
import {
  registerServerBlock,
  type ControlDef,
} from "../components/ServerBlockEdit";
import blockMetadata from "./block.json";

const controls: ControlDef[] = [
  {
    name: "title",
    type: "text",
    label: __("Title", "yatra"),
    help: __('Leave empty for "Customer Login".', "yatra"),
  },
  { name: "subtitle", type: "text", label: __("Subtitle", "yatra") },
  {
    name: "show_register",
    type: "toggle",
    label: __("Show registration tab", "yatra"),
  },
  {
    name: "show_forgot_password",
    type: "toggle",
    label: __('Show "Forgot password"', "yatra"),
  },
  {
    name: "remember_me",
    type: "toggle",
    label: __('Show "Remember me"', "yatra"),
  },
  {
    name: "redirect_url",
    type: "text",
    label: __("Redirect after login (this site only)", "yatra"),
  },
];

registerServerBlock(blockMetadata, {
  panelTitle: __("Login Settings", "yatra"),
  controls,
  icon: "lock",
});
