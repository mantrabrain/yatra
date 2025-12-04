/**
 * Categories Page
 * Clean, minimal SaaS-style categories management page with subcategory support
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronRight, ChevronDown, Edit, Trash2 } from 'lucide-react';
import { SearchFilterToolbar } from '../components/shared';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ConditionalRender } from '../components/ui/conditional-render';
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

  // Process categories for hierarchical display
  const processedCategories = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return [];
    }

    const normalized = categories.map((cat: Category) => ({
      ...cat,
      subcategories: Array.isArray(cat.subcategories) ? cat.subcategories : [],
    }));

    if (parentFilter === 'subcategories') {
      const onlySubs: Category[] = normalized.flatMap((cat: Category) =>
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
      return normalized;
    }

    return normalized;
  }, [categories, parentFilter]);

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

  const toggleExpand = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleEdit = (category: Category) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=categories&action=edit&id=${category.id}`;
  };

  const handleDelete = (category: Category) => {
    setDeleteConfirm({ isOpen: true, category });
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

  const renderCategoryRow = (category: Category, isSubcategory: boolean = false) => {
    const derivedSub = isSubcategory || !!category.__subOnly;
    const hasSubcategories = !category.__subOnly && category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <React.Fragment key={category.id}>
        <TableRow className={derivedSub ? 'bg-gray-50 dark:bg-gray-900/50' : ''}>
          <TableCell className="w-12">
            {hasSubcategories && (
              <button
                onClick={() => toggleExpand(category.id)}
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
          <TableCell>
            <div className="flex items-center gap-2">
              {renderIcon(category.icon)}
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {derivedSub && <span className="text-gray-400 mr-1">└─</span>}
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
            </div>
          </TableCell>
          <TableCell>
            <code className="text-xs text-gray-600 dark:text-gray-400">{category.slug}</code>
          </TableCell>
          <TableCell>
            <div className="max-w-xs truncate text-sm text-gray-600 dark:text-gray-400">
              {category.description || '—'}
            </div>
          </TableCell>
          <TableCell>{getStatusBadge(category.status)}</TableCell>
          <TableCell className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(category.created_at)}
          </TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-2">
              <ConditionalRender capability="yatra_edit_trips">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(category)}
                  className="h-9 w-9 p-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(category)}
                  className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </ConditionalRender>
            </div>
          </TableCell>
        </TableRow>
        {hasSubcategories && isExpanded && category.subcategories?.map(sub => renderCategoryRow(sub, true))}
      </React.Fragment>
    );
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
              className="w-full lg:w-36 lg:flex-none text-sm"
            >
              <option value="all">{__('All Categories', 'All Categories')}</option>
              <option value="top-level">{__('Top Level Only', 'Top Level Only')}</option>
              <option value="subcategories">{__('Subcategories Only', 'Subcategories Only')}</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>{__('Name', 'Name')}</TableHead>
                  <TableHead>{__('Slug', 'Slug')}</TableHead>
                  <TableHead>{__('Description', 'Description')}</TableHead>
                  <TableHead>{__('Status', 'Status')}</TableHead>
                  <TableHead>{__('Created', 'Created')}</TableHead>
                  <TableHead className="w-28 text-right">{__('Actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`category-skeleton-${index}`}>
                    <TableCell>
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-4 w-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                          <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-20 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="h-9 w-9 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        <div className="h-9 w-9 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-red-600 dark:text-red-400">{__('Failed to load categories', 'Failed to load categories')}</div>
            </div>
          ) : processedCategories.length === 0 ? (
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
                    {__('No categories found', 'No categories found')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {__('Get started by creating your first category to organize your trips.', 'Get started by creating your first category to organize your trips.')}
                  </p>
                </div>

                {/* Action button */}
                <ConditionalRender capability="yatra_edit_trips">
                  <div className="pt-2">
                    <Button
                      onClick={handleCreateCategory}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    >
                      <Plus className="w-4 h-4" />
                      {__('Add Your First Category', 'Add Your First Category')}
                    </Button>
                  </div>
                </ConditionalRender>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>{__('Name', 'Name')}</TableHead>
                  <TableHead>{__('Slug', 'Slug')}</TableHead>
                  <TableHead>{__('Description', 'Description')}</TableHead>
                  <TableHead>{__('Status', 'Status')}</TableHead>
                  <TableHead>{__('Created', 'Created')}</TableHead>
                  <TableHead className="w-28 text-right">{__('Actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedCategories.map(category => renderCategoryRow(category))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Categories;

