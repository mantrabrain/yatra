/**
 * Confirmation Dialog Component
 * Displays a modal confirmation dialog for destructive actions
 */

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { __ } from "../../lib/i18n";
import { Button } from "./button";
import { Modal } from "./modal";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  icon?: React.ReactNode;
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost" | "destructive";
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
  variant = "danger",
  isLoading = false,
  icon,
  secondaryAction,
}) => {
  // Use description if provided, otherwise fall back to message
  const displayMessage = description || message || "";

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "info":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case "danger":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 mt-0.5 ${getVariantStyles()}`}>
            {icon || <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>{title || __("Confirm Action", "yatra")}</div>
        </div>
      }
      hideHeader={false}
      hideFooter={false}
      size="sm"
      panelClassName="yatra-confirmation-ui yatra-model-ui"
      bodyClassName="px-6 py-5"
      footer={
        <div className="flex gap-2 justify-end pt-2 flex-wrap">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText || __("Cancel", "yatra")}
          </Button>
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || "outline"}
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
                {__("Deleting...", "yatra")}
              </>
            ) : (
              confirmText || __("Confirm", "yatra")
            )}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {displayMessage}
      </p>
    </Modal>
  );
};
