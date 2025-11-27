/**
 * Categories Page
 * Clean, minimal SaaS-style categories management page with subcategory support
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ChevronRight, ChevronDown } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ConditionalRender } from '../components/ui/conditional-render';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { Edit, Trash2 } from 'lucide-react';
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
                  {category.name}
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

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
            <div className="relative min-w-0 w-full lg:flex-[2]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={__('Search categories...', 'Search categories...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full lg:flex-1"
            >
              <option value="all">{__('All Status', 'All Status')}</option>
              <option value="draft">{__('Draft', 'Draft')}</option>
              <option value="publish">{__('Publish', 'Publish')}</option>
              <option value="trash">{__('Trash', 'Trash')}</option>
            </Select>

            <Select
              value={parentFilter}
              onChange={(e) => setParentFilter(e.target.value as 'all' | 'top-level' | 'subcategories')}
              className="w-full lg:flex-1"
            >
              <option value="all">{__('All Categories', 'All Categories')}</option>
              <option value="top-level">{__('Top Level Only', 'Top Level Only')}</option>
              <option value="subcategories">{__('Subcategories Only', 'Subcategories Only')}</option>
            </Select>

            {hasFilters && (
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="h-11 flex items-center gap-2 flex-shrink-0"
              >
                <X className="w-4 h-4" />
                {__('Reset', 'Reset')}
              </Button>
            )}
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
            <div className="p-12 text-center">
              <div className="text-gray-500 dark:text-gray-400 mb-4">{__('No categories found', 'No categories found')}</div>
              <ConditionalRender capability="yatra_edit_trips">
                <Button onClick={handleCreateCategory} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  {__('Add Your First Category', 'Add Your First Category')}
                </Button>
              </ConditionalRender>
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

