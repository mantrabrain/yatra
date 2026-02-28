import React, { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-6xl",
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  maxWidthClassName?: string;
  panelClassName?: string;
  bodyClassName?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  loading?: boolean;
  loadingSkeleton?: ReactNode;
  error?: string | null;
  errorComponent?: ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
  customZIndex?: number;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "xl",
  maxWidthClassName,
  panelClassName = "",
  bodyClassName,
  showCloseButton = true,
  closeOnOverlayClick = true,
  loading = false,
  loadingSkeleton,
  error,
  errorComponent,
  hideHeader = false,
  hideFooter = false,
  customZIndex,
}) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const panelWidthClass = maxWidthClassName || sizeClasses[size];
  const bodyClasses = bodyClassName ?? "px-6 py-5";
  const zIndex = customZIndex || 999999;

  // Default loading skeleton
  const defaultLoadingSkeleton = (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      <div className="space-y-2 pt-4">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
      </div>
    </div>
  );

  // Default error component
  const defaultErrorComponent = error ? (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
        <svg
          className="w-6 h-6 text-red-600 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p className="text-red-600 dark:text-red-400 font-medium mb-2">Error</p>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
    </div>
  ) : null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (closeOnOverlayClick && !loading) {
            onClose();
          }
        }}
      />
      <div
        className={`relative w-full ${panelWidthClass} bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-150 yatra-model-ui ${panelClassName}`}
        style={{ zIndex: zIndex + 1 }}
      >
        {!hideHeader && (title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              {title && (
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div
          className={`${bodyClasses} max-h-[70vh] overflow-y-auto custom-scrollbar`}
        >
          <div className="w-full">
            {loading
              ? loadingSkeleton || defaultLoadingSkeleton
              : error
                ? errorComponent || defaultErrorComponent
                : children}
          </div>
        </div>

        {!hideFooter && footer && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
