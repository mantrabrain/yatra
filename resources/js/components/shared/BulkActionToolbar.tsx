import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { Columns } from 'lucide-react';
import { __ } from '../../lib/i18n';
import { ConfirmationDialog } from '../ui/confirmation-dialog';

interface BulkActionOption {
  value: string;
  label: string;
}

interface StatusFilterOption {
  key: string;
  label: string;
  count: number;
}

interface ColumnVisibilityOption {
  key: string;
  label: string;
  visible: boolean;
}

interface BulkActionToolbarProps {
  selectedIds: (string | number)[];
  bulkAction: string;
  setBulkAction: (action: string) => void;
  onApply: () => void;
  onClearSelection: () => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  statusOptions: StatusFilterOption[];
  showColumnsDropdown: boolean;
  setShowColumnsDropdown: (show: boolean) => void;
  columnOptions: ColumnVisibilityOption[];
  onToggleColumn: (columnKey: string) => void;
  bulkMutationPending: boolean;
  totalItems: number;
  bulkActionOptions: BulkActionOption[];
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedIds,
  bulkAction,
  setBulkAction,
  onApply,
  onClearSelection,
  statusFilter,
  setStatusFilter,
  statusOptions,
  showColumnsDropdown,
  setShowColumnsDropdown,
  columnOptions,
  onToggleColumn,
  bulkMutationPending,
  totalItems,
  bulkActionOptions
}) => {
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; action: string; count: number }>({
    isOpen: false,
    action: '',
    count: 0,
  });

  const handleApplyClick = () => {
    if (!bulkAction || selectedIds.length === 0) {
      onApply(); // Let parent handle validation messages
      return;
    }

    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      action: bulkAction,
      count: selectedIds.length,
    });
  };

  const handleConfirm = () => {
    setConfirmDialog({ isOpen: false, action: '', count: 0 });
    onApply(); // Execute the actual bulk action
    setBulkAction(''); // Reset bulk action selection
  };

  const handleCancel = () => {
    setConfirmDialog({ isOpen: false, action: '', count: 0 });
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-columns-trigger]') || target.closest('[data-columns-content]')) {
        return;
      }
      setShowColumnsDropdown(false);
    };
    
    if (showColumnsDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showColumnsDropdown, setShowColumnsDropdown]);

  return (
    <>
      {/* Bulk actions toolbar - Always above the table */}
      <div className="py-3 space-y-3">
        {/* Top row: Bulk actions and status tabs */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Bulk actions - all in one line */}
          <div className="flex items-center gap-3 flex-nowrap">
            <Select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="min-w-[140px]"
              disabled={totalItems === 0}
            >
              <option value="">{__('Bulk actions', 'yatra')}</option>
              {bulkActionOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Button
              variant="outline"
              onClick={handleApplyClick}
              disabled={bulkMutationPending || selectedIds.length === 0}
              className="h-11 px-4 flex-shrink-0"
            >
              {__('Apply', 'yatra')}
            </Button>
            
            {/* Selection info right after Apply button */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border border-blue-200 dark:border-blue-800 whitespace-nowrap">
                <span className="font-medium text-xs">{`${__('Selected:', 'yatra')} ${selectedIds.length}`}</span>
                <button
                  type="button"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  onClick={onClearSelection}
                >
                  {__('Clear', 'yatra')}
                </button>
              </div>
            )}
          </div>

          {/* Right: Status filter tabs */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {statusOptions.map((filter) => {
              const isActive = statusFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  className={`px-3 py-2.5 text-sm font-medium rounded border transition-all duration-200 ${
                    isActive
                      ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:border-gray-500'
                  }`}
                  onClick={() => {
                    setStatusFilter(filter.key);
                    onClearSelection();
                    setBulkAction('');
                  }}
                >
                  <span className="flex items-center gap-2">
                    {filter.label}
                    <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${
                      isActive 
                        ? 'bg-white text-gray-900' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {filter.count ?? 0}
                    </span>
                  </span>
                </button>
              );
            })}

            {/* Columns visibility toggle - only when there are column options */}
            {columnOptions.length > 0 && (
              <div className="relative ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowColumnsDropdown(!showColumnsDropdown);
                  }}
                  className="h-10 px-3 flex items-center gap-2"
                  data-columns-trigger
                >
                  <Columns className="w-4 h-4" />
                  {__('Columns', 'yatra')}
                </Button>
                
                {/* Columns dropdown */}
                {showColumnsDropdown && (
                  <div 
                    className="absolute right-0 top-11 z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-2"
                    style={{ width: '240px', minWidth: '240px' }}
                    data-columns-content
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                      {__('Show Columns', 'yatra')}
                    </div>
                    
                    <div className="py-1">
                      {columnOptions.map(option => (
                        <label key={option.key} className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={option.visible}
                            onChange={() => onToggleColumn(option.key)}
                            className="rounded border-gray-300 dark:border-gray-600 h-4 w-4 mr-3 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Action Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={(() => {
          switch (confirmDialog.action) {
            case 'delete':
              return __('Delete Permanently', 'yatra');
            case 'trash':
              return __('Move to Trash', 'yatra');
            case 'publish':
              return __('Publish Items', 'yatra');
            case 'draft':
              return __('Make Draft', 'yatra');
            case 'restore':
              return __('Restore Items', 'yatra');
            default:
              return __('Confirm Bulk Action', 'yatra');
          }
        })()}
        message={(() => {
          const count = confirmDialog.count;
          switch (confirmDialog.action) {
            case 'delete':
              return __('Are you sure you want to permanently delete {count} item(s)? This action cannot be undone.', 'yatra').replace('{count}', count.toString());
            case 'trash':
              return __('Are you sure you want to move {count} item(s) to trash?', 'yatra').replace('{count}', count.toString());
            case 'publish':
              return __('Are you sure you want to publish {count} item(s)?', 'yatra').replace('{count}', count.toString());
            case 'draft':
              return __('Are you sure you want to make {count} item(s) draft?', 'yatra').replace('{count}', count.toString());
            case 'restore':
              return __('Are you sure you want to restore {count} item(s)?', 'yatra').replace('{count}', count.toString());
            default:
              return __('Are you sure you want to perform this action on {count} item(s)?', 'yatra').replace('{count}', count.toString());
          }
        })()}
        confirmText={(() => {
          switch (confirmDialog.action) {
            case 'delete':
              return __('Delete Permanently', 'yatra');
            case 'trash':
              return __('Move to Trash', 'yatra');
            case 'publish':
              return __('Publish', 'yatra');
            case 'draft':
              return __('Make Draft', 'yatra');
            case 'restore':
              return __('Restore', 'yatra');
            default:
              return __('Confirm', 'yatra');
          }
        })()}
        cancelText={__('Cancel', 'yatra')}
        variant={confirmDialog.action === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkMutationPending}
      />
    </>
  );
};
