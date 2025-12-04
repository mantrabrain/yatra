import { __ } from '../../lib/i18n';
import type { BulkActionOption } from './types';

/**
 * Returns a default set of bulk status action options based on current statusFilter.
 * This is shared across Activities, Destinations, Difficulty Levels, etc.
 */
export const getDefaultBulkStatusOptions = (statusFilter: string): BulkActionOption[] => {
  const options: BulkActionOption[] = [];

  switch (statusFilter) {
    case 'publish':
      options.push({ value: 'trash', label: __('Move to Trash', 'Move to Trash') });
      options.push({ value: 'draft', label: __('Make Draft', 'Make Draft') });
      break;
    case 'draft':
      options.push({ value: 'publish', label: __('Make Published', 'Make Published') });
      options.push({ value: 'trash', label: __('Move to Trash', 'Move to Trash') });
      break;
    case 'trash':
      options.push({ value: 'publish', label: __('Make Published', 'Make Published') });
      options.push({ value: 'draft', label: __('Make Draft', 'Make Draft') });
      options.push({ value: 'delete', label: __('Delete Permanently', 'Delete Permanently') });
      break;
    case 'all':
    default:
      options.push({ value: 'publish', label: __('Make Published', 'Make Published') });
      options.push({ value: 'draft', label: __('Make Draft', 'Make Draft') });
      options.push({ value: 'trash', label: __('Move to Trash', 'Move to Trash') });
      break;
  }

  return options;
};
