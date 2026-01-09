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
      options.push({ value: 'trash', label: __('Move to Trash', 'yatra') });
      options.push({ value: 'draft', label: __('Make Draft', 'yatra') });
      break;
    case 'draft':
      options.push({ value: 'publish', label: __('Make Published', 'yatra') });
      options.push({ value: 'trash', label: __('Move to Trash', 'yatra') });
      break;
    case 'trash':
      options.push({ value: 'publish', label: __('Make Published', 'yatra') });
      options.push({ value: 'draft', label: __('Make Draft', 'yatra') });
      options.push({ value: 'delete', label: __('Delete Permanently', 'yatra') });
      break;
    case 'all':
    default:
      options.push({ value: 'publish', label: __('Make Published', 'yatra') });
      options.push({ value: 'draft', label: __('Make Draft', 'yatra') });
      options.push({ value: 'trash', label: __('Move to Trash', 'yatra') });
      break;
  }

  return options;
};
