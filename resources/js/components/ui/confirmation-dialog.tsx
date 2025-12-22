/**
 * Confirmation Dialog Component
 * Displays a modal confirmation dialog for destructive actions
 */

import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { __ } from '../../lib/i18n';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  icon?: React.ReactNode;
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  };
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmText,
  cancelText,
  variant = 'danger',
  isLoading = false,
  icon,
  secondaryAction,
}) => {
  // Use description if provided, otherwise fall back to message
  const displayMessage = description || message || '';
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-md mx-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 mt-0.5 ${getVariantStyles()}`}>
                {icon || <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <CardTitle className="text-lg">
                  {title || __('Confirm Action', 'Confirm Action')}
                </CardTitle>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              disabled={isLoading}
              aria-label={__('Close', 'Close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {displayMessage}
          </p>
          <div className="flex gap-2 justify-end pt-2 flex-wrap">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText || __('Cancel', 'Cancel')}
            </Button>
            {secondaryAction && (
              <Button
                variant={secondaryAction.variant || 'outline'}
                onClick={secondaryAction.onClick}
                disabled={isLoading}
              >
                {secondaryAction.label}
              </Button>
            )}
            <Button
              variant={getButtonVariant()}
              onClick={onConfirm}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {__('Deleting...', 'Deleting...')}
                </>
              ) : (
                confirmText || __('Confirm', 'Confirm')
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

