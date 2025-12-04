export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export type SortOrder = 'asc' | 'desc';

export interface FilterOption {
  value: string;
  label: string;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface SearchFilterToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusChange: (filter: string) => void;
  statusOptions: FilterOption[];
  sortBy: string;
  onSortByChange: (field: string) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  sortOptions: SortOption[];
  onResetFilters: () => void;
  hasFilters: boolean;
  placeholder?: string;
}

export interface BulkActionOption {
  value: string;
  label: string;
}

export interface StatusFilterOption {
  key: string;
  label: string;
  count: number;
}

export interface ColumnVisibilityOption {
  key: string;
  label: string;
  visible: boolean;
}

export interface BulkActionToolbarProps {
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

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  visible?: boolean;
  width?: string;
  render?: (item: any, index: number) => React.ReactNode;
}

export interface TableAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: (item: any) => void;
  condition?: (item: any) => boolean;
  variant?: 'default' | 'destructive' | 'outline';
}

export interface TableProps {
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
