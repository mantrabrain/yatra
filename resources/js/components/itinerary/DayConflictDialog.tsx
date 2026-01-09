/**
 * Day Conflict Dialog Component
 * Shows a confirmation dialog when a day number conflict is detected
 */

import React from 'react';
import { ConfirmationDialog } from '../ui/confirmation-dialog';
import { __ } from '../../lib/i18n';

interface DayConflictDialogProps {
  isOpen: boolean;
  conflictDayNumber: number | null;
  suggestedDayNumber: number | null;
  existingDayNumbers: number[];
  isUpdateMode?: boolean; // true when updating an existing day, false when creating new
  onClose: () => void;
  onConfirm: () => void;
}

export const DayConflictDialog: React.FC<DayConflictDialogProps> = ({
  isOpen,
  conflictDayNumber,
  suggestedDayNumber,
  existingDayNumbers,
  isUpdateMode = false,
  onClose,
  onConfirm,
}) => {
  let message = '';
  let title = '';
  let confirmText = '';

  if (isUpdateMode && conflictDayNumber !== null) {
    // Update mode: User is trying to change number to an existing day
    title = __('Replace Existing Day?', 'yatra');
    message = __('Day', 'yatra') + ` ${conflictDayNumber} ` + __('already exists for this trip. Do you want to replace it with the current day\'s data?', 'yatra');
    confirmText = __('Yes, Replace Day', 'yatra') + ` ${conflictDayNumber}`;
  } else if (!isUpdateMode && conflictDayNumber !== null && suggestedDayNumber !== null && existingDayNumbers.length > 0) {
    // Add mode: User is trying to create a day that already exists
    title = __('Day Number Already Exists', 'yatra');
    const existingDaysList = existingDayNumbers.join(', ');
    message = __('Day', 'yatra') + ` ${existingDaysList} ` + __('already exists for this trip. Do you want to use day', 'yatra') + ` ${suggestedDayNumber} ` + __('instead?', 'yatra');
    confirmText = __('Use Day', 'yatra') + ` ${suggestedDayNumber}`;
  } else {
    // Fallback
    title = __('Day Number Already Exists', 'yatra');
    message = __('This day number already exists.', 'yatra');
    confirmText = __('OK', 'yatra');
  }

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={__('Cancel', 'yatra')}
      variant="warning"
    />
  );
};

