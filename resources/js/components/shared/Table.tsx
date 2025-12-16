import React, { useState } from 'react';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { MoreVertical, ChevronRight, ChevronDown } from 'lucide-react';
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
  // Hierarchical support
  isHierarchical?: boolean;
  expandedIds?: Set<string | number>;
  onToggleExpand?: (id: string | number) => void;
  getChildren?: (item: any) => any[];
  renderRowContent?: (item: any, index: number, isChild?: boolean) => React.ReactNode[];
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
  // Hierarchical props
  isHierarchical = false,
  expandedIds = new Set(),
  onToggleExpand,
  getChildren,
  renderRowContent,
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<string | number | null>(null);
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
          {isHierarchical && (
            <TableHead className="w-12"></TableHead>
          )}
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
            {isHierarchical && (
              <TableCell>
                <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              </TableCell>
            )}
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
    <div className="relative flex flex-col items-center justify-center text-center py-16 px-6 my-6 min-h-[400px]">
      {/* Background decoration */}
      <div className="absolute inset-8 bg-gradient-to-br from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700"></div>
      
      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto space-y-6">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 ring-8 ring-blue-50/50 dark:ring-blue-900/20">
          <svg 
            className="w-10 h-10 text-blue-600 dark:text-blue-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            strokeWidth="1.5"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        {/* Text content */}
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {emptyText}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {emptyDescription}
          </p>
        </div>

        {/* Action button */}
        {onCreateClick && (
          <div className="pt-2">
            <Button 
              onClick={onCreateClick} 
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {__('Create New', 'Create New')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // Render hierarchical row with children
  const renderHierarchicalRow = (item: any, index: number, isChild = false): React.ReactNode => {
    const itemId = getItemId(item);
    const itemStatus = getItemStatus(item);
    const isTrash = itemStatus === 'trash' || statusFilter === 'trash';
    const children = getChildren ? getChildren(item) : [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(itemId);

    return (
      <React.Fragment key={itemId}>
        <TableRow 
          className={`${isTrash ? 'bg-red-50/30 dark:bg-red-900/10 opacity-75 hover:bg-red-50/50 dark:hover:bg-red-900/20' : ''} ${isChild ? 'bg-gray-50 dark:bg-gray-900/50' : ''}`}
        >
          {/* Expand/collapse column */}
          <TableCell className="w-12">
            {hasChildren && onToggleExpand && (
              <button
                onClick={() => onToggleExpand(itemId)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
          </TableCell>

          {/* Selection checkbox */}
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

          {/* Custom row content or default columns */}
          {renderRowContent ? (
            renderRowContent(item, index, isChild).map((cellContent, cellIndex) => (
              <TableCell 
                key={`cell-${itemId}-${cellIndex}`}
                className={isTrash ? 'text-gray-400 dark:text-gray-600' : ''}
              >
                {cellContent}
              </TableCell>
            ))
          ) : (
            columns.filter(col => col.visible !== false).map((column) => (
              <TableCell 
                key={`${column.key}-${itemId}`} 
                className={isTrash ? 'text-gray-400 dark:text-gray-600' : ''}
              >
                {column.render ? column.render(item, index) : item[column.key]}
              </TableCell>
            ))
          )}

          {/* Actions */}
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

        {/* Render children if expanded */}
        {hasChildren && isExpanded && children.map((child, childIndex) => 
          renderHierarchicalRow(child, childIndex, true)
        )}
      </React.Fragment>
    );
  };

  // Render flat row (original behavior)
  const renderFlatRow = (item: any, index: number): React.ReactNode => {
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
  };

  // Render table data
  const renderTable = () => {
    if (isLoading) return renderSkeleton();
    if (isError) return renderError();
    if (data.length === 0) return renderEmpty();

    return (
      <UITable>
        <TableHeader>
          <TableRow>
            {/* Expand/collapse column for hierarchical tables */}
            {isHierarchical && (
              <TableHead className="w-12"></TableHead>
            )}
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
          {data.map((item, index) => 
            isHierarchical 
              ? renderHierarchicalRow(item, index)
              : renderFlatRow(item, index)
          )}
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
