import {
  getBlockType,
  registerBlockType,
  unregisterBlockType,
  type BlockConfiguration,
} from "@wordpress/blocks";
import Edit from "./edit";
import blockMetadata from "./block.json";

const { $schema: _$schema, editorScript: _$editorScript, ...metadata } = blockMetadata;

if (getBlockType(metadata.name)) {
  unregisterBlockType(metadata.name);
}

registerBlockType(metadata.name, {
  ...metadata,
  edit: Edit,
  save: () => null,
} as BlockConfiguration);
