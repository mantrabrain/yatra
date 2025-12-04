/**
 * Categories Page
 * Clean, minimal SaaS-style categories management page with subcategory support
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { SearchFilterToolbar, Table as SharedTable, BulkActionToolbar, Pagination } from '../components/shared';
import { getDefaultBulkStatusOptions } from '../components/shared/bulkStatusOptions';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { IconSelector } from '../components/ui/icon-selector';
import type { IconPickerValue } from '../components/ui/icon-picker';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: IconPickerValue | null;
  parent_id?: number | null;
  parent_name?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  created_by_name?: string;
  updated_by_name?: string;
  subcategories?: Category[];
  __subOnly?: boolean;
}

const Categories: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [parentFilter, setParentFilter] = useState<'all' | 'top-level' | 'subcategories'>('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; category: Category | null }>({
    isOpen: false,
    category: null,
  });
  // Bulk action state
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('yatra_categories_columns');
    return saved ? JSON.parse(saved) : {
      name: true,
      slug: true,
      description: true,
      status: true,
      created_at: true,
    };
  });
  
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: 50, // Get more items to handle hierarchical display
      orderby: sortBy,
      order: sortOrder,
      hierarchical: true, // Request hierarchical data
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    if (parentFilter === 'top-level') {
      params.parent_id = null;
    } else if (parentFilter === 'subcategories') {
      // We'll filter client-side for subcategories
    }

    return params;
  }, [searchTerm, statusFilter, parentFilter, sortBy, sortOrder, page]);

  // Fetch categories from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['trip-categories', queryParams],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/trip-categories', { params: queryParams });
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load categories', 'Failed to load categories'), 'error');
        throw error;
      }
    },
    enabled: can('yatra_view_trips'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/trip-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-categories'] });
      showToast(__('Category deleted successfully', 'Category deleted successfully'), 'success');
      setDeleteConfirm({ isOpen: false, category: null });
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete category', 'Failed to delete category'), 'error');
    },
  });

  const categories = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 50);

  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newVisibleColumns);
    localStorage.setItem('yatra_categories_columns', JSON.stringify(newVisibleColumns));
  };

  // Status counts for bulk toolbar - count both parents and children
  const statusCounts = useMemo(() => {
    const counts = {
      all: 0,
      publish: 0,
      draft: 0,
      trash: 0,
    };
    
    const countCategory = (cat: Category) => {
      counts.all++;
      if (cat.status === 'publish') counts.publish++;
      else if (cat.status === 'draft') counts.draft++;
      else if (cat.status === 'trash') counts.trash++;
    };
    
    categories.forEach((cat: Category) => {
      // Count parent category
      countCategory(cat);
      
      // Count subcategories
      if (cat.subcategories && Array.isArray(cat.subcategories)) {
        cat.subcategories.forEach((sub: Category) => {
          countCategory(sub);
        });
      }
    });
    
    return counts;
  }, [categories]);

  // Bulk mutation for status changes and deletes
  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: (string | number)[] }) => {
      if (action === 'delete') {
        await Promise.all(ids.map(id => apiClient.delete(`/trip-categories/${id}`)));
      } else {
        // Status change - fetch each category and update with full payload
        await Promise.all(
          ids.map(async (id) => {
            try {
              const categoryResponse = await apiClient.get(`/trip-categories/${id}`);
              const category = categoryResponse;
              if (!category || !category.name) {
                return;
              }

              await apiClient.put(`/trip-categories/${id}`, {
                name: category.name,
                slug: category.slug,
                description: category.description,
                icon: category.icon,
                parent_id: category.parent_id,
                status: action,
              });
            } catch {
              throw new Error('bulk_item_failed');
            }
          })
        );
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trip-categories'] });
      const msgMap: Record<string, string> = {
        delete: __('Selected categories deleted successfully', 'Selected categories deleted successfully'),
        trash: __('Selected categories moved to trash', 'Selected categories moved to trash'),
        draft: __('Selected categories marked as draft', 'Selected categories marked as draft'),
        publish: __('Selected categories published', 'Selected categories published'),
      };
      showToast(msgMap[variables.action] || __('Bulk action completed', 'Bulk action completed'), 'success');
      setSelectedIds([]);
      setBulkAction('');
    },
    onError: (error: any, variables) => {
      const msgMapError: Record<string, string> = {
        delete: __('Failed to delete selected categories', 'Failed to delete selected categories'),
        trash: __('Failed to move categories to trash', 'Failed to move categories to trash'),
        draft: __('Failed to mark categories as draft', 'Failed to mark categories as draft'),
        publish: __('Failed to publish categories', 'Failed to publish categories'),
      };
      showToast(
        error?.message || msgMapError[variables.action] || __('Bulk action failed', 'Bulk action failed'),
        'error'
      );
    },
  });

  const handleBulkApply = () => {
    if (!bulkAction) {
      showToast(__('Select a bulk action first.', 'Select a bulk action first.'), 'warning');
      return;
    }

    if (selectedIds.length === 0) {
      showToast(__('Select at least one category.', 'Select at least one category.'), 'warning');
      return;
    }

    bulkMutation.mutate({ action: bulkAction, ids: selectedIds });
  };

  // Process categories for hierarchical display
  const processedCategories = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return [];
    }

    const normalized = categories.map((cat: Category) => ({
      ...cat,
      subcategories: Array.isArray(cat.subcategories) ? cat.subcategories : [],
    }));

    // Apply status filtering to both parents and children
    const filterByStatus = (items: Category[]): Category[] => {
      return items.map((cat: Category) => {
        // Filter subcategories by status
        const filteredSubcategories = cat.subcategories ? 
          cat.subcategories.filter((sub: Category) => 
            statusFilter === 'all' || sub.status === statusFilter
          ) : [];

        return {
          ...cat,
          subcategories: filteredSubcategories,
        };
      }).filter((cat: Category) => {
        // Filter parent categories by status
        if (statusFilter === 'all') return true;
        
        // Show parent if it matches status OR if it has children that match status
        const parentMatches = cat.status === statusFilter;
        const hasMatchingChildren = cat.subcategories && cat.subcategories.length > 0;
        
        return parentMatches || hasMatchingChildren;
      });
    };

    const statusFiltered = filterByStatus(normalized);

    if (parentFilter === 'subcategories') {
      const onlySubs: Category[] = statusFiltered.flatMap((cat: Category) =>
        (cat.subcategories || []).map(sub => ({
          ...sub,
          parent_name: cat.name,
          __subOnly: true,
          subcategories: [],
        }))
      );
      return onlySubs;
    }

    if (parentFilter === 'top-level') {
      return statusFiltered.map(cat => ({
        ...cat,
        subcategories: [], // Don't show subcategories when filtering for top-level only
      }));
    }

    return statusFiltered;
  }, [categories, parentFilter, statusFilter]);

  // Expand all parent categories that have subcategories by default
  useEffect(() => {
    if (expandedCategories.size > 0) return;

    const initialExpanded = new Set<number>();
    processedCategories.forEach((cat: Category) => {
      if (!cat.__subOnly && cat.subcategories && cat.subcategories.length > 0) {
        initialExpanded.add(cat.id);
      }
    });

    if (initialExpanded.size > 0) {
      setExpandedCategories(initialExpanded);
    }
  }, [processedCategories, expandedCategories.size]);

  const formatDate = (dateString: string) => {
    if (!dateString) return __('N/A', 'N/A');
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'publish': {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Publish', 'Publish'),
      },
      'draft': {
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
        label: __('Draft', 'Draft'),
      },
      'trash': {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        label: __('Trash', 'Trash'),
      },
    };

    const statusInfo = statusMap[status] || {
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
      label: status,
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const renderIcon = (icon: IconPickerValue | null | undefined) => {
    if (!icon) {
      return (
        <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
        </div>
      );
    }

    if (icon.type === 'image') {
      return (
        <img
          src={icon.value}
          alt=""
          className="w-8 h-8 rounded object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.innerHTML = '<div class="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><span class="text-xs text-gray-400 dark:text-gray-500">—</span></div>';
            }
          }}
        />
      );
    }

    return (
      <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <IconSelector iconName={icon.value} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </div>
    );
  };

  const toggleExpand = (categoryId: string | number) => {
    const id = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleEdit = (category: Category) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=categories&action=edit&id=${category.id}`;
  };


  const confirmDelete = () => {
    if (deleteConfirm.category) {
      deleteMutation.mutate(deleteConfirm.category.id);
    }
  };

  const handleCreateCategory = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=categories&action=create`;
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setParentFilter('all');
    setSortBy('name');
    setSortOrder('asc');
    setPage(1);
  };

  const hasFilters = searchTerm || statusFilter !== 'all' || parentFilter !== 'all' || sortBy !== 'name' || sortOrder !== 'asc';

  // Define columns for the shared table
  const columns = [
    {
      key: 'name',
      label: __('Name', 'Name'),
      sortable: true,
      visible: visibleColumns.name,
    },
    {
      key: 'slug',
      label: __('Slug', 'Slug'),
      visible: visibleColumns.slug,
    },
    {
      key: 'description',
      label: __('Description', 'Description'),
      visible: visibleColumns.description,
    },
    {
      key: 'status',
      label: __('Status', 'Status'),
      sortable: true,
      visible: visibleColumns.status,
    },
    {
      key: 'created_at',
      label: __('Created', 'Created'),
      sortable: true,
      visible: visibleColumns.created_at,
    },
  ];

  // Status mutation for individual actions
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const categoryResponse = await apiClient.get(`/trip-categories/${id}`);
      const category = categoryResponse as Category;

      return apiClient.put(`/trip-categories/${id}`, {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        parent_id: category.parent_id,
        status,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trip-categories'] });
      const msgMap: Record<string, string> = {
        trash: __('Category moved to trash', 'Category moved to trash'),
        draft: __('Category marked as draft', 'Category marked as draft'),
        publish: __('Category published', 'Category published'),
      };
      const msg = msgMap[variables.status] || __('Category updated successfully', 'Category updated successfully');
      showToast(msg, 'success');
    },
    onError: (error: any, variables) => {
      const msgMapError: Record<string, string> = {
        trash: __('Failed to move category to trash', 'Failed to move category to trash'),
        draft: __('Failed to mark category as draft', 'Failed to mark category as draft'),
        publish: __('Failed to publish category', 'Failed to publish category'),
      };
      const fallback = msgMapError[variables.status] || __('Failed to update category', 'Failed to update category');
      showToast(error?.message || fallback, 'error');
    },
  });

  // Define actions for the shared table - dynamic based on item status
  const actions = [
    {
      key: 'edit',
      label: __('Edit', 'Edit'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (category: Category) => handleEdit(category),
      condition: () => can('yatra_edit_trips'),
    },
    {
      key: 'publish',
      label: __('Make Published', 'Make Published'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (category: Category) => statusMutation.mutate({ id: category.id, status: 'publish' }),
      condition: (category: Category) =>
        can('yatra_edit_trips') && category.status !== 'publish',
    },
    {
      key: 'draft',
      label: __('Make Draft', 'Make Draft'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (category: Category) => statusMutation.mutate({ id: category.id, status: 'draft' }),
      condition: (category: Category) =>
        can('yatra_edit_trips') && category.status !== 'draft',
    },
    {
      key: 'trash',
      label: __('Move to Trash', 'Move to Trash'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (category: Category) => statusMutation.mutate({ id: category.id, status: 'trash' }),
      variant: 'destructive' as const,
      condition: (category: Category) =>
        can('yatra_edit_trips') && category.status !== 'trash',
    },
    {
      key: 'delete',
      label: __('Delete Permanently', 'Delete Permanently'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (category: Category) => setDeleteConfirm({ isOpen: true, category }),
      variant: 'destructive' as const,
      condition: (category: Category) => can('yatra_edit_trips') && category.status === 'trash',
    },
  ];

  // Custom row content renderer for hierarchical display
  const renderRowContent = (category: Category, _index: number, isChild = false): React.ReactNode[] => {
    return [
      // Name column with icon and hierarchy indicator
      <div className="flex items-center gap-2">
        {renderIcon(category.icon)}
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {isChild && <span className="text-gray-400 mr-1">└─</span>}
            <a
              href={`${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=categories&action=edit&id=${category.id}`}
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer"
            >
              {category.name}
            </a>
          </div>
          {category.parent_name && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {__('Parent:', 'Parent:')} {category.parent_name}
            </div>
          )}
        </div>
      </div>,
      // Slug column
      <code className="text-xs text-gray-600 dark:text-gray-400">{category.slug}</code>,
      // Description column
      <div className="max-w-xs truncate text-sm text-gray-600 dark:text-gray-400">
        {category.description || '—'}
      </div>,
      // Status column
      getStatusBadge(category.status),
      // Created date column
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {formatDate(category.created_at)}
      </span>,
    ];
  };

  return (
    <div className="space-y-3">
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, category: null })}
        onConfirm={confirmDelete}
        title={__('Delete Category', 'Delete Category')}
        message={deleteConfirm.category 
          ? __('Are you sure you want to delete "{name}"? This action cannot be undone.', 'Are you sure you want to delete "{name}"? This action cannot be undone.').replace('{name}', deleteConfirm.category.name)
          : __('Are you sure you want to delete this category? This action cannot be undone.', 'Are you sure you want to delete this category? This action cannot be undone.')
        }
        confirmText={__('Delete', 'Delete')}
        cancelText={__('Cancel', 'Cancel')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <PageHeader
        title={__('Categories', 'Categories')}
        description={__('Manage trip categories and subcategories', 'Manage trip categories and subcategories')}
        actionCapability="yatra_edit_trips"
        actions={
          <Button onClick={handleCreateCategory} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add New Category', 'Add New Category')}
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Shared search + status + sort toolbar - give it more space on large screens */}
            <div className="min-w-0 w-full lg:flex-[3]">
              <SearchFilterToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                statusOptions={[
                  { value: 'all', label: __('All Status', 'All Status') },
                  { value: 'publish', label: __('Publish', 'Publish') },
                  { value: 'draft', label: __('Draft', 'Draft') },
                  { value: 'trash', label: __('Trash', 'Trash') },
                ]}
                sortBy={sortBy}
                onSortByChange={(value) => {
                  setSortBy(value);
                  setSortOrder('asc');
                  setPage(1);
                }}
                sortOrder={sortOrder}
                onSortOrderChange={(order) => {
                  setSortOrder(order);
                  setPage(1);
                }}
                sortOptions={[
                  { value: 'name', label: __('Name', 'Name') },
                  { value: 'status', label: __('Status', 'Status') },
                  { value: 'created_at', label: __('Created', 'Created') },
                ]}
                onResetFilters={handleResetFilters}
                hasFilters={!!hasFilters}
                placeholder={__('Search categories...', 'Search categories...')}
              />
            </div>

            {/* Parent filter - narrower on large screens */}
            <Select
              value={parentFilter}
              onChange={(e) => setParentFilter(e.target.value as 'all' | 'top-level' | 'subcategories')}
              className="w-full lg:w-28 lg:flex-none text-sm"
            >
              <option value="all">{__('All Categories', 'All Categories')}</option>
              <option value="top-level">{__('Top Level Only', 'Top Level Only')}</option>
              <option value="subcategories">{__('Subcategories Only', 'Subcategories Only')}</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <BulkActionToolbar
        selectedIds={selectedIds}
        bulkAction={bulkAction}
        setBulkAction={setBulkAction}
        onApply={handleBulkApply}
        onClearSelection={() => setSelectedIds([])}
        statusFilter={statusFilter}
        setStatusFilter={(value) => {
          setStatusFilter(value);
          setPage(1);
          setSelectedIds([]);
          setBulkAction('');
        }}
        statusOptions={[
          { key: 'all', label: __('All', 'All'), count: statusCounts.all },
          { key: 'publish', label: __('Published', 'Published'), count: statusCounts.publish },
          { key: 'draft', label: __('Draft', 'Draft'), count: statusCounts.draft },
          { key: 'trash', label: __('Trash', 'Trash'), count: statusCounts.trash },
        ]}
        showColumnsDropdown={showColumnsDropdown}
        setShowColumnsDropdown={setShowColumnsDropdown}
        columnOptions={[
          { key: 'name', label: __('Name', 'Name'), visible: visibleColumns.name },
          { key: 'slug', label: __('Slug', 'Slug'), visible: visibleColumns.slug },
          { key: 'description', label: __('Description', 'Description'), visible: visibleColumns.description },
          { key: 'status', label: __('Status', 'Status'), visible: visibleColumns.status },
          { key: 'created_at', label: __('Created', 'Created'), visible: visibleColumns.created_at },
        ]}
        onToggleColumn={toggleColumn}
        bulkMutationPending={bulkMutation.isPending}
        totalItems={processedCategories.length}
        bulkActionOptions={getDefaultBulkStatusOptions(statusFilter)}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <SharedTable
            data={processedCategories}
            columns={columns}
            actions={actions}
            isLoading={isLoading}
            isError={!!error}
            errorText={__('Failed to load categories', 'Failed to load categories')}
            emptyText={__('No categories found', 'No categories found')}
            emptyDescription={__('Get started by creating your first category to organize your trips.', 'Get started by creating your first category to organize your trips.')}
            onCreateClick={handleCreateCategory}
            selectedItemIds={selectedIds}
            onSelectItem={(id: string | number, checked: boolean) => {
              if (checked) {
                setSelectedIds([...selectedIds, id]);
              } else {
                setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
              }
            }}
            onSelectAll={(checked: boolean) => {
              if (checked) {
                setSelectedIds(processedCategories.map((cat: Category) => cat.id));
              } else {
                setSelectedIds([]);
              }
            }}
            isAllSelected={processedCategories.length > 0 && selectedIds.length === processedCategories.length}
            getItemId={(category: Category) => category.id}
            getItemStatus={(category: Category) => category.status}
            statusFilter={statusFilter}
            skeletonRows={5}
            capability="yatra_view_trips"
            // Hierarchical props
            isHierarchical={true}
            expandedIds={expandedCategories}
            onToggleExpand={toggleExpand}
            getChildren={(category: Category) => category.subcategories || []}
            renderRowContent={renderRowContent}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 0 && (
        <Card>
          <CardContent className="p-3">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={50}
              onPageChange={setPage}
              itemName={__('categories', 'categories')}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Categories;

