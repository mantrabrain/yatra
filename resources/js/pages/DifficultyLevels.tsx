/**
 * Difficulty Levels Page
 * Manage trip difficulty levels with ordering
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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

interface DifficultyLevel {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: IconPickerValue | null;
  level_order: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  created_by_name?: string;
  updated_by_name?: string;
}

const DifficultyLevels: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('level_order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; level: DifficultyLevel | null }>({
    isOpen: false,
    level: null,
  });
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: 20,
      orderby: sortBy,
      order: sortOrder,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }
    return params;
  }, [searchTerm, statusFilter, sortBy, sortOrder, page]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['difficulty-levels', queryParams],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/difficulty-levels', { params: queryParams });
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load difficulty levels', 'Failed to load difficulty levels'), 'error');
        throw error;
      }
    },
    enabled: can('yatra_view_trips'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiClient.delete(`/difficulty-levels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['difficulty-levels'] });
      showToast(__('Difficulty level deleted successfully', 'Difficulty level deleted successfully'), 'success');
      setDeleteConfirm({ isOpen: false, level: null });
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete difficulty level', 'Failed to delete difficulty level'), 'error');
    },
  });

  const levels = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

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
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { className: string; label: string }> = {
      publish: { className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', label: __('Publish', 'Publish') },
      draft: { className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400', label: __('Draft', 'Draft') },
      trash: { className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', label: __('Trash', 'Trash') },
    };
    const info = map[status] || map.draft;
    return <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${info.className}`}>{info.label}</span>;
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
              target.parentElement.innerHTML =
                '<div class="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><span class="text-xs text-gray-400 dark:text-gray-500">—</span></div>';
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

  const handleEdit = (level: DifficultyLevel) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=difficulty-levels&action=edit&id=${level.id}`;
  };

  const handleDelete = (level: DifficultyLevel) => {
    setDeleteConfirm({ isOpen: true, level });
  };

  const confirmDelete = () => {
    if (deleteConfirm.level) {
      deleteMutation.mutate(deleteConfirm.level.id);
    }
  };

  const handleCreate = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=difficulty-levels&action=create`;
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('level_order');
    setSortOrder('asc');
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-gray-400" />;
    }
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 ml-1 text-gray-600 dark:text-gray-300" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1 text-gray-600 dark:text-gray-300" />;
  };

  const hasFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'level_order' || sortOrder !== 'asc';

  return (
    <div className="space-y-3">
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, level: null })}
        onConfirm={confirmDelete}
        title={__('Delete Difficulty Level', 'Delete Difficulty Level')}
        message={deleteConfirm.level
          ? __('Are you sure you want to delete "{name}"? This action cannot be undone.', 'Are you sure you want to delete "{name}"? This action cannot be undone.').replace('{name}', deleteConfirm.level.name)
          : __('Are you sure you want to delete this difficulty level?', 'Are you sure you want to delete this difficulty level?')}
        confirmText={__('Delete', 'Delete')}
        cancelText={__('Cancel', 'Cancel')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <PageHeader
        title={__('Difficulty Levels', 'Difficulty Levels')}
        description={__('Define and manage trip difficulty levels', 'Define and manage trip difficulty levels')}
        actionCapability="yatra_edit_trips"
        actions={
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add Difficulty Level', 'Add Difficulty Level')}
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
                placeholder={__('Search difficulty levels...', 'Search difficulty levels...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full lg:flex-1">
              <option value="all">{__('All Status', 'All Status')}</option>
              <option value="draft">{__('Draft', 'Draft')}</option>
              <option value="publish">{__('Publish', 'Publish')}</option>
              <option value="trash">{__('Trash', 'Trash')}</option>
            </Select>

            {hasFilters && (
              <Button variant="outline" onClick={handleResetFilters} className="h-11 flex items-center gap-2 flex-shrink-0">
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
                  <TableHead className="w-24">{__('Order', 'Order')}</TableHead>
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
                  <TableRow key={`difficulty-skeleton-${index}`}>
                    <TableCell>
                      <div className="h-6 w-12 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                        <div className="h-4 w-36 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
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
                      <div className="h-4 w-28 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
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
              <div className="text-red-600 dark:text-red-400">{__('Failed to load difficulty levels', 'Failed to load difficulty levels')}</div>
            </div>
          ) : levels.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-500 dark:text-gray-400 mb-4">{__('No difficulty levels found', 'No difficulty levels found')}</div>
              <ConditionalRender capability="yatra_edit_trips">
                <Button onClick={handleCreate} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  {__('Add Your First Difficulty Level', 'Add Your First Difficulty Level')}
                </Button>
              </ConditionalRender>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 cursor-pointer select-none" onClick={() => handleSort('level_order')}>
                    <div className="inline-flex items-center">
                      {__('Order', 'Order')}
                      {getSortIcon('level_order')}
                    </div>
                  </TableHead>
                  <TableHead>{__('Name', 'Name')}</TableHead>
                  <TableHead>{__('Slug', 'Slug')}</TableHead>
                  <TableHead>{__('Description', 'Description')}</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                    <div className="inline-flex items-center">
                      {__('Status', 'Status')}
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead>{__('Created', 'Created')}</TableHead>
                  <TableHead className="w-28 text-right">{__('Actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {levels.map((level: DifficultyLevel) => (
                  <TableRow key={level.id}>
                    <TableCell>
                      <span className="inline-flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                        {level.level_order ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderIcon(level.icon)}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{level.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-gray-600 dark:text-gray-400">{level.slug}</code>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm text-gray-600 dark:text-gray-400">
                        {level.description || '—'}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(level.status)}</TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">{formatDate(level.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ConditionalRender capability="yatra_edit_trips">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(level)} className="h-9 w-9 p-0">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(level)}
                            className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </ConditionalRender>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {__('Showing {current} of {total} levels', 'Showing {current} of {total} levels')
              .replace('{current}', String(Math.min(page * 20, total)))
              .replace('{total}', String(total))}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
              {__('Previous', 'Previous')}
            </Button>
            <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              {__('Next', 'Next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DifficultyLevels;