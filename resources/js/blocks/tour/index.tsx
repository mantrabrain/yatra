import { registerBlockType } from "@wordpress/blocks";
import Edit from "./edit";

registerBlockType("yatra/tour", {
  title: "Trip",
  icon: "palmtree",
  category: "yatra",
  attributes: {
    order: {
      type: "string",
      default: "desc",
    },
    featured: {
      type: "boolean",
      default: false,
    },
    per_page: {
      type: "number",
      default: 10,
    },
    columns: {
      type: "number",
      default: 3,
    },
    title: {
      type: "string",
      default: "Our Trips",
    },
    show_pagination: {
      type: "boolean",
      default: true,
    },
  },
  edit: Edit,
  save: () => null,
});
