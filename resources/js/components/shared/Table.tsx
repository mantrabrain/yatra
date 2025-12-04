import React, { useState } from 'react';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { MoreVertical } from 'lucide-react';
import { __ } from '../../lib/i18n';
import { ConditionalRender } from '../ui/conditional-render';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  visible?: boolean;
  width?: string;
  render?: (item: any, index: number) => React.ReactNode;
}

interface TableAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: (item: any) => void;
  condition?: (item: any) => boolean;
  variant?: 'default' | 'destructive' | 'outline';
}

interface TableProps {
  data: any[];
  columns: TableColumn[];
  actions?: TableAction[];
  isLoading?: boolean;
  isError?: boolean;
  errorText?: string;
  emptyText?: string;
  emptyDescription?: string;
  onCreateClick?: () => void;
  onSort?: (field: string) => void;
  getSortIcon?: (field: string) => React.ReactNode;
  selectedItemIds?: (string | number)[];
  onSelectItem?: (id: string | number, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  isAllSelected?: boolean;
  getItemId?: (item: any) => string | number;
  getItemStatus?: (item: any) => string;
  statusFilter?: string;
  capability?: string;
  skeletonRows?: number;
}

export const Table: React.FC<TableProps> = ({
  data,
  columns,
  actions = [],
  isLoading = false,
  isError = false,
  errorText = __('Error loading data', 'Error loading data'),
  emptyText = __('No items found', 'No items found'),
  emptyDescription = __('Get started by creating your first item.', 'Get started by creating your first item'),
  onCreateClick,
  onSort,
  getSortIcon,
  selectedItemIds = [],
  onSelectItem,
  onSelectAll,
  isAllSelected = false,
  getItemId = (item) => item.id,
  getItemStatus = (item) => item.status,
  statusFilter = '',
  capability = 'yatra_view_trips',
  skeletonRows = 5,
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-dropdown-trigger]') || target.closest('[data-dropdown-content]')) {
        return;
      }
      setOpenDropdownId(null);
    };
    
    if (openDropdownId !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId]);

  // Render skeleton loading state
  const renderSkeleton = () => (
    <UITable>
      <TableHeader>
        <TableRow>
          {onSelectItem && onSelectAll && (
            <TableHead className="w-12"></TableHead>
          )}
          {columns.filter(col => col.visible !== false).map((column) => (
            <TableHead key={column.key} className={column.width}>{column.label}</TableHead>
          ))}
          {actions.length > 0 && (
            <TableHead className="text-right w-[100px]">{__('Actions', 'Actions')}</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(skeletonRows)].map((_, index) => (
          <TableRow key={`skeleton-${index}`}>
            {onSelectItem && onSelectAll && (
              <TableCell>
                <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              </TableCell>
            )}
            {columns.filter(col => col.visible !== false).map((column) => (
              <TableCell key={`${column.key}-${index}`}>
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              </TableCell>
            ))}
            {actions.length > 0 && (
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="h-4 w-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </UITable>
  );

  // Render error state
  const renderError = () => (
    <div className="p-8 text-center text-red-500">
      {errorText}
    </div>
  );

  // Render empty state
  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <div className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {emptyText}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
        {emptyDescription}
      </p>
      {onCreateClick && (
        <Button onClick={onCreateClick} className="flex items-center gap-2">
          {__('Create', 'Create')}
        </Button>
      )}
    </div>
  );

  // Render table data
  const renderTable = () => {
    if (isLoading) return renderSkeleton();
    if (isError) return renderError();
    if (data.length === 0) return renderEmpty();

    return (
      <UITable>
        <TableHeader>
          <TableRow>
            {onSelectItem && onSelectAll && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  aria-label={__('Select all items', 'Select all items')}
                />
              </TableHead>
            )}
            {columns.filter(col => col.visible !== false).map((column) => (
              <TableHead 
                key={column.key} 
                className={column.width}
              >
                {column.sortable && onSort ? (
                  <button
                    onClick={() => onSort(column.key)}
                    className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {column.label}
                    {getSortIcon && getSortIcon(column.key)}
                  </button>
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
            {actions.length > 0 && (
              <TableHead className="text-right w-[100px]">{__('Actions', 'Actions')}</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => {
            const itemId = getItemId(item);
            const itemStatus = getItemStatus(item);
            const isTrash = itemStatus === 'trash' || statusFilter === 'trash';
            
            return (
              <TableRow 
                key={itemId} 
                className={isTrash ? 'bg-red-50/30 dark:bg-red-900/10 opacity-75 hover:bg-red-50/50 dark:hover:bg-red-900/20' : ''}
              >
                {onSelectItem && (
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 dark:border-gray-600"
                      checked={selectedItemIds.includes(itemId)}
                      onChange={(e) => onSelectItem(itemId, e.target.checked)}
                      aria-label={__('Select item', 'Select item')}
                    />
                  </TableCell>
                )}
                {columns.filter(col => col.visible !== false).map((column) => (
                  <TableCell 
                    key={`${column.key}-${itemId}`} 
                    className={isTrash ? 'text-gray-400 dark:text-gray-600' : ''}
                  >
                    {column.render ? column.render(item, index) : item[column.key]}
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell className="text-right">
                    <div className="relative inline-block">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const button = e.currentTarget;
                          const rect = button.getBoundingClientRect();
                          setDropdownPosition({
                            top: rect.bottom + window.scrollY,
                            right: window.innerWidth - rect.right + window.scrollX
                          });
                          setOpenDropdownId(openDropdownId === itemId ? null : itemId);
                        }}
                        className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label={__('More actions', 'More actions')}
                        data-dropdown-trigger
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      
                      {openDropdownId === itemId && dropdownPosition && (
                        <div 
                          className="fixed min-w-[180px] w-max bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-2xl py-1"
                          style={{
                            top: `${dropdownPosition.top}px`,
                            right: `${dropdownPosition.right}px`,
                            zIndex: 999999
                          }}
                          data-dropdown-content
                          onClick={(e) => e.stopPropagation()}
                        >
                          {actions
                            .filter(action => !action.condition || action.condition(item))
                            .map(action => (
                              <button
                                key={action.key}
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  action.onClick(item);
                                  setOpenDropdownId(null);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors cursor-pointer whitespace-nowrap ${
                                  action.variant === 'destructive' 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : action.variant === 'outline' 
                                      ? 'text-blue-600 dark:text-blue-400' 
                                      : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {action.icon}
                                {action.label}
                              </button>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </UITable>
    );
  };

  return (
    <ConditionalRender capability={capability}>
      {renderTable()}
    </ConditionalRender>
  );
};
