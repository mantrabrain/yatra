import { registerBlockType } from "@wordpress/blocks";
import Edit from "./edit";

registerBlockType("yatra/activity", {
  title: "Activity",
  icon: "buddicons-pm",
  category: "yatra",
  attributes: {
    order: {
      type: "string",
      default: "asc",
    },
    columns: {
      type: "number",
      default: 3,
    },
    per_page: {
      type: "number",
      default: 10,
    },
    title: {
      type: "string",
      default: "Activity Listings",
    },
    show_pagination: {
      type: "boolean",
      default: true,
    },
  },
  edit: Edit,
  save: () => null,
});
