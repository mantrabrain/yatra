import {
  getBlockType,
  registerBlockType,
  unregisterBlockType,
  type BlockConfiguration,
} from "@wordpress/blocks";
import Edit from "./edit";
import blockMetadata from "./block.json";

// Merge full block.json so keywords, supports.inserter, and description stay in sync for the inserter/search.
const {
  $schema: _$schema,
  editorScript: _$editorScript,
  ...metadata
} = blockMetadata;

// If a stale registration exists (no edit / partial merge), replace it so the inserter works.
if (getBlockType(metadata.name)) {
  unregisterBlockType(metadata.name);
}

registerBlockType(metadata.name, {
  ...metadata,
  edit: Edit,
  save: () => null,
} as BlockConfiguration);
