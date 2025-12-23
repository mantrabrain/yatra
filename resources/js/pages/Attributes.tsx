/**
 * Attributes Page
 * Clean, minimal SaaS-style attributes management page
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, Edit, Trash2 } from 'lucide-react';
import { Pagination, SearchFilterToolbar, BulkActionToolbar, Table as SharedTable } from '../components/shared';
import { getDefaultBulkStatusOptions } from '../components/shared/bulkStatusOptions';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { Badge } from '../components/ui/badge';
import { IconSelector } from '../components/ui/icon-selector';

interface Attribute {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: {
    type: 'icon' | 'image';
    value: string;
  } | null;
  field_type: string;
  field_options: any;
  default_value: string;
  placeholder: string;
  required: boolean | string | number;
  validation_rules: any;
  display_order: number;
  show_on_frontend: boolean | string | number;
  show_in_filters: boolean | string | number;
  filter_type: string;
  searchable: boolean | string | number;
  status: string;
  created_at: string;
  updated_at: string;
}

const Attributes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [permanentDeleteConfirm, setPermanentDeleteConfirm] = useState<{ isOpen: boolean; attribute: Attribute | null }>({
    isOpen: false,
    attribute: null,
  });
  const [individualActionConfirm, setIndividualActionConfirm] = useState<{ isOpen: boolean; action: string; attribute: Attribute | null }>({
    isOpen: false,
    action: '',
    attribute: null,
  });
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | number | null>(null);
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  
  // Column visibility state with localStorage
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('yatra-attributes-columns');
    return saved ? JSON.parse(saved) : {
      name: true,
      field_type: true,
      required: true,
      show_on_frontend: true,
      show_in_filters: true,
      searchable: true,
      status: true,
      created_at: false,
      updated_at: false,
      description: false,
      display_order: false,
    };
  });

  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  
  const fieldTypeOptions = [
    { value: 'text_field', label: 'Text Field' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'url', label: 'URL' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'select', label: 'Select Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'date', label: 'Date' },
    { value: 'time', label: 'Time' },
    { value: 'color', label: 'Color' }
  ];

  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newVisibleColumns);
    localStorage.setItem('yatra-attributes-columns', JSON.stringify(newVisibleColumns));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking on dropdown button or dropdown content
      if (target.closest('[data-dropdown-trigger]') || target.closest('[data-dropdown-content]') || 
          target.closest('[data-columns-trigger]') || target.closest('[data-columns-content]')) {
        return;
      }
      setOpenDropdown(null);
      setShowColumnsDropdown(false);
    };
    
    if (openDropdown !== null || showColumnsDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown, showColumnsDropdown]);

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: 10,
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

  // Fetch status counts from API (no caching to ensure fresh counts)
  const { data: statsData } = useQuery({
    queryKey: ['attributes-stats', searchTerm, statusFilter, page],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/attributes/stats');
        console.log('Attributes Stats Response:', response);
        return response || { all: 0, publish: 0, draft: 0, trash: 0 };
      } catch (error: any) {
        console.error('Attributes Stats Error:', error);
        return { all: 0, publish: 0, draft: 0, trash: 0 };
      }
    },
    enabled: can('yatra_view_trips'),
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache the results (formerly cacheTime)
    refetchOnMount: 'always' as const, // Always refetch when component mounts
  });

  // Fetch attributes from API
  const { data: attributesData, isLoading, error } = useQuery({
    queryKey: ['attributes', searchTerm, statusFilter, sortBy, sortOrder, page],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/attributes', { params: queryParams });
        
        // Debug: Log the raw response from API
        console.log('Attributes page - Raw API response:', response);
        console.log('Attributes page - Response data:', response?.data);
        
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load attributes', 'Failed to load attributes'), 'error');
        throw error;
      }
    },
    enabled: can('yatra_view_trips'),
  });

  const attributes = attributesData?.data || [];
  const total = attributesData?.total || 0;
  const totalPages = Math.ceil(total / 10);

  // Debug logging
  console.log('Attributes Debug:', {
    attributesData,
    attributes,
    total,
    isLoading,
    error,
    canView: can('yatra_view_trips')
  });

  // Status counts from stats API
  const statusCounts = useMemo(() => {
    if (statsData) {
      const statusCounts = {
        all: (statsData?.all ?? 0) as number,
        publish: (statsData?.publish ?? 0) as number,
        draft: (statsData?.draft ?? 0) as number,
        trash: (statsData?.trash ?? 0) as number,
      };
      return statusCounts;
    }
    return {
      all: 0,
      publish: 0,
      draft: 0,
      trash: 0,
    };
  }, [statsData]);

  // Bulk actions mutation
  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: (string | number)[] }) => {
      return await apiClient.post('/attributes/bulk', { action, ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
      queryClient.invalidateQueries({ queryKey: ['attributes-stats'] });
      showToast(__('Bulk action completed successfully', 'Bulk action completed successfully'), 'success');
      setSelectedIds([]);
      setBulkAction('');
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to perform bulk action', 'Failed to perform bulk action'), 'error');
    },
  });

  const handleEdit = (attribute: Attribute) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=attributes&action=edit&id=${attribute.id}`;
  };

  const handlePermanentDelete = (attribute: Attribute) => {
    setPermanentDeleteConfirm({ isOpen: true, attribute });
  };

  const confirmPermanentDelete = () => {
    if (permanentDeleteConfirm.attribute) {
      bulkMutation.mutate({ action: 'delete', ids: [permanentDeleteConfirm.attribute.id] });
      setPermanentDeleteConfirm({ isOpen: false, attribute: null });
    }
  };

  const confirmIndividualAction = () => {
    if (individualActionConfirm.attribute) {
      const action = individualActionConfirm.action === 'restore' ? 'restore' : 'trash';
      bulkMutation.mutate({ action, ids: [individualActionConfirm.attribute.id] });
      setIndividualActionConfirm({ isOpen: false, action: '', attribute: null });
    }
  };

  const handleCreateAttribute = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=attributes&action=create`;
  };

  // Keep selection in sync with current page data
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => attributes.some((attribute: Attribute) => attribute.id === id))
    );
  }, [attributes]);

  const handleBulkApply = () => {
    if (!bulkAction) {
      showToast(__('Select a bulk action first.', 'Select a bulk action first.'), 'warning');
      return;
    }

    if (selectedIds.length === 0) {
      showToast(__('Select at least one attribute.', 'Select at least one attribute.'), 'warning');
      return;
    }

    // Execute bulk action (confirmation is now handled in BulkActionToolbar)
    bulkMutation.mutate({ action: bulkAction, ids: selectedIds });
  };

  const viewFilters = [
    { key: 'all', label: __('All', 'All'), count: statusCounts.all ?? 0 },
    { key: 'publish', label: __('Published', 'Published'), count: statusCounts.publish ?? 0 },
    { key: 'draft', label: __('Draft', 'Draft'), count: statusCounts.draft ?? 0 },
    { key: 'trash', label: __('Trash', 'Trash'), count: statusCounts.trash ?? 0 },
  ];

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('name');
    setSortOrder('asc');
    setPage(1);
    setSelectedIds([]);
    setBulkAction('');
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

  const hasFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'name' || sortOrder !== 'asc';

  const getFieldTypeLabel = (type: string) => {
    const option = fieldTypeOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  };

  return (
    <div className="space-y-3">
      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={permanentDeleteConfirm.isOpen}
        onClose={() => setPermanentDeleteConfirm({ isOpen: false, attribute: null })}
        onConfirm={confirmPermanentDelete}
        title={__('Delete Attribute Permanently', 'Delete Attribute Permanently')}
        message={permanentDeleteConfirm.attribute 
          ? __('Are you sure you want to permanently delete "{name}"? This action cannot be undone.', 'Are you sure you want to permanently delete "{name}"? This action cannot be undone.').replace('{name}', permanentDeleteConfirm.attribute.name)
          : __('Are you sure you want to permanently delete this attribute? This action cannot be undone.', 'Are you sure you want to permanently delete this attribute? This action cannot be undone.')
        }
        confirmText={__('Delete Permanently', 'Delete Permanently')}
        cancelText={__('Cancel', 'Cancel')}
        variant="danger"
        isLoading={bulkMutation.isPending}
      />

      {/* Individual Action Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={individualActionConfirm.isOpen}
        onClose={() => setIndividualActionConfirm({ isOpen: false, action: '', attribute: null })}
        onConfirm={confirmIndividualAction}
        title={individualActionConfirm.action === 'trash' ? __('Move to Trash', 'Move to Trash') : __('Restore Attribute', 'Restore Attribute')}
        message={individualActionConfirm.attribute 
          ? (individualActionConfirm.action === 'trash' 
              ? __('Are you sure you want to move "{name}" to trash?', 'Are you sure you want to move "{name}" to trash?').replace('{name}', individualActionConfirm.attribute.name)
              : __('Are you sure you want to restore "{name}"?', 'Are you sure you want to restore "{name}"?').replace('{name}', individualActionConfirm.attribute.name)
            )
          : (individualActionConfirm.action === 'trash' 
              ? __('Are you sure you want to move this attribute to trash?', 'Are you sure you want to move this attribute to trash?')
              : __('Are you sure you want to restore this attribute?', 'Are you sure you want to restore this attribute?')
            )
        }
        confirmText={individualActionConfirm.action === 'trash' ? __('Move to Trash', 'Move to Trash') : __('Restore', 'Restore')}
        cancelText={__('Cancel', 'Cancel')}
        variant="warning"
        isLoading={bulkMutation.isPending}
      />

      <PageHeader
        title={__('Attributes', 'Attributes')}
        description={__('Manage your travel attributes and their properties', 'Manage your travel attributes and their properties')}
        actionCapability="manage_options"
        actions={
          <Button onClick={handleCreateAttribute} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add New Attribute', 'Add New Attribute')}
          </Button>
        }
      />

      {/* Filters, Search, and Sorting - Always Visible */}
      <Card>
        <CardContent className="p-3">
          <SearchFilterToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={(value) => {
              setStatusFilter(value);
              setPage(1);
              setSelectedIds([]);
              setBulkAction('');
            }}
            statusOptions={[
              { value: "all", label: __('All Status', 'All Status') },
              { value: "publish", label: __('Published', 'Published') },
              { value: "draft", label: __('Draft', 'Draft') },
              { value: "trash", label: __('Trash', 'Trash') }
            ]}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            sortOptions={[
              { value: "name", label: __('Name', 'Name') },
              { value: "field_type", label: __('Field Type', 'Field Type') },
              { value: "status", label: __('Status', 'Status') },
              { value: "created_at", label: __('Created At', 'Created At') },
              { value: "updated_at", label: __('Updated At', 'Updated At') }
            ]}
            onResetFilters={handleResetFilters}
            hasFilters={!!hasFilters}
            placeholder={__('Search attributes...', 'Search attributes...')}
          />
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_trips">
        {/* Table */}
        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              {__('Error loading attributes', 'Error loading attributes')}
            </CardContent>
          </Card>
        ) : (
          <>
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
              statusOptions={viewFilters}
              showColumnsDropdown={showColumnsDropdown}
              setShowColumnsDropdown={setShowColumnsDropdown}
              columnOptions={[
                { key: 'name', label: __('Attribute', 'Attribute'), visible: visibleColumns.name },
                { key: 'field_type', label: __('Field Type', 'Field Type'), visible: visibleColumns.field_type },
                { key: 'required', label: __('Required', 'Required'), visible: visibleColumns.required },
                { key: 'show_on_frontend', label: __('Frontend', 'Frontend'), visible: visibleColumns.show_on_frontend },
                { key: 'show_in_filters', label: __('Filters', 'Filters'), visible: visibleColumns.show_in_filters },
                { key: 'searchable', label: __('Searchable', 'Searchable'), visible: visibleColumns.searchable },
                { key: 'status', label: __('Status', 'Status'), visible: visibleColumns.status },
                { key: 'created_at', label: __('Created Date', 'Created Date'), visible: visibleColumns.created_at },
                { key: 'updated_at', label: __('Updated Date', 'Updated Date'), visible: visibleColumns.updated_at },
                { key: 'description', label: __('Description', 'Description'), visible: visibleColumns.description },
                { key: 'display_order', label: __('Order', 'Order'), visible: visibleColumns.display_order }
              ]}
              onToggleColumn={toggleColumn}
              bulkMutationPending={bulkMutation.isPending}
              totalItems={attributes.length}
              bulkActionOptions={getDefaultBulkStatusOptions(statusFilter)}
            />

            <Card className="overflow-visible">
              <CardContent className="p-0 overflow-visible">
                <SharedTable
                  data={attributes}
                  columns={[
                    {
                      key: 'name',
                      label: __('Attribute', 'Attribute'),
                      sortable: true,
                      visible: visibleColumns.name,
                      render: (attribute: Attribute) => (
                        <div className="flex items-center gap-3">
                          {/* Icon/Image */}
                          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                            {attribute.icon ? (
                              attribute.icon.type === 'image' ? (
                                <img 
                                  src={attribute.icon.value} 
                                  alt={attribute.name}
                                  className="w-6 h-6 object-cover rounded"
                                />
                              ) : (
                                <IconSelector 
                                  iconName={attribute.icon.value} 
                                  size={16} 
                                  className="text-purple-600 dark:text-purple-400"
                                />
                              )
                            ) : (
                              <div className="w-5 h-5 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-semibold">
                                {attribute.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          {/* Text */}
                          <div>
                            <a 
                              href={`${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=attributes&action=edit&id=${attribute.id}`}
                              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer"
                            >
                              {attribute.name}
                            </a>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {attribute.slug}
                            </div>
                          </div>
                        </div>
                      )
                    },
                    {
                      key: 'field_type',
                      label: __('Field Type', 'Field Type'),
                      sortable: true,
                      visible: visibleColumns.field_type,
                      render: (attribute: Attribute) => (
                        <Badge variant="outline">{getFieldTypeLabel(attribute.field_type)}</Badge>
                      )
                    },
                    {
                      key: 'required',
                      label: __('Required', 'Required'),
                      sortable: true,
                      visible: visibleColumns.required,
                      render: (attribute: Attribute) => (
                        <Badge variant={attribute.required ? 'default' : 'outline'}>
                          {attribute.required === true || attribute.required === '1' || attribute.required === 1 ? 'Yes' : 'No'}
                        </Badge>
                      )
                    },
                    {
                      key: 'show_on_frontend',
                      label: __('Frontend', 'Frontend'),
                      sortable: true,
                      visible: visibleColumns.show_on_frontend,
                      render: (attribute: Attribute) => (
                        <Badge variant={attribute.show_on_frontend === true || attribute.show_on_frontend === '1' || attribute.show_on_frontend === 1 ? 'default' : 'outline'}>
                          {attribute.show_on_frontend === true || attribute.show_on_frontend === '1' || attribute.show_on_frontend === 1 ? 'Yes' : 'No'}
                        </Badge>
                      )
                    },
                    {
                      key: 'show_in_filters',
                      label: __('Filters', 'Filters'),
                      sortable: true,
                      visible: visibleColumns.show_in_filters,
                      render: (attribute: Attribute) => (
                        <Badge variant={attribute.show_in_filters === true || attribute.show_in_filters === '1' || attribute.show_in_filters === 1 ? 'default' : 'outline'}>
                          {attribute.show_in_filters === true || attribute.show_in_filters === '1' || attribute.show_in_filters === 1 ? 'Yes' : 'No'}
                        </Badge>
                      )
                    },
                    {
                      key: 'searchable',
                      label: __('Searchable', 'Searchable'),
                      sortable: true,
                      visible: visibleColumns.searchable,
                      render: (attribute: Attribute) => (
                        <Badge variant={attribute.searchable === true || attribute.searchable === '1' || attribute.searchable === 1 ? 'default' : 'outline'}>
                          {attribute.searchable === true || attribute.searchable === '1' || attribute.searchable === 1 ? 'Yes' : 'No'}
                        </Badge>
                      )
                    },
                    {
                      key: 'status',
                      label: __('Status', 'Status'),
                      sortable: true,
                      visible: visibleColumns.status,
                      render: (attribute: Attribute) => (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          attribute.status === 'trash' || statusFilter === 'trash'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : attribute.status === 'publish'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {attribute.status === 'trash' || statusFilter === 'trash'
                            ? __('Trash', 'Trash')
                            : attribute.status === 'publish'
                              ? __('Published', 'Published')
                              : __('Draft', 'Draft')
                          }
                        </span>
                      )
                    },
                    {
                      key: 'created_at',
                      label: __('Created Date', 'Created Date'),
                      sortable: true,
                      visible: visibleColumns.created_at,
                      render: (attribute: Attribute) => (
                        <span className={attribute.status === 'trash' || statusFilter === 'trash' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'}>
                          {new Date(attribute.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )
                    },
                    {
                      key: 'updated_at',
                      label: __('Updated Date', 'Updated Date'),
                      sortable: true,
                      visible: visibleColumns.updated_at,
                      render: (attribute: Attribute) => (
                        <span className={attribute.status === 'trash' || statusFilter === 'trash' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'}>
                          {new Date(attribute.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )
                    },
                    {
                      key: 'description',
                      label: __('Description', 'Description'),
                      visible: visibleColumns.description,
                      render: (attribute: Attribute) => (
                        <span className={attribute.status === 'trash' || statusFilter === 'trash' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'}>
                          {attribute.description || __('No description', 'No description')}
                        </span>
                      )
                    },
                    {
                      key: 'display_order',
                      label: __('Order', 'Order'),
                      sortable: true,
                      visible: visibleColumns.display_order,
                      render: (attribute: Attribute) => (
                        <span className={attribute.status === 'trash' || statusFilter === 'trash' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'}>
                          {attribute.display_order}
                        </span>
                      )
                    }
                  ]}
                  actions={[
                    {
                      key: 'edit',
                      label: __('Edit', 'Edit'),
                      icon: <Edit className="w-4 h-4" />,
                      onClick: handleEdit,
                      condition: () => can('yatra_view_trips'),
                    },
                    {
                      key: 'restore',
                      label: __('Restore', 'Restore'),
                      icon: <RotateCcw className="w-4 h-4" />,
                      onClick: (attribute: Attribute) => {
                        bulkMutation.mutate({ action: 'restore', ids: [attribute.id] });
                      },
                      condition: (attribute: Attribute) => (attribute.status === 'trash' || statusFilter === 'trash') && can('yatra_view_trips'),
                    },
                    {
                      key: 'trash',
                      label: __('Move to Trash', 'Move to Trash'),
                      icon: <Trash2 className="w-4 h-4" />,
                      onClick: (attribute: Attribute) => {
                        bulkMutation.mutate({ action: 'trash', ids: [attribute.id] });
                      },
                      condition: (attribute: Attribute) => attribute.status !== 'trash' && statusFilter !== 'trash' && can('yatra_view_trips'),
                    },
                    {
                      key: 'delete',
                      label: __('Delete Permanently', 'Delete Permanently'),
                      icon: <Trash2 className="w-4 h-4" />,
                      onClick: handlePermanentDelete,
                      condition: (attribute: Attribute) => (attribute.status === 'trash' || statusFilter === 'trash') && can('yatra_view_trips'),
                      variant: 'destructive',
                    }
                  ]}
                  isLoading={isLoading}
                  isError={!!error}
                  errorText={__('Error loading attributes', 'Error loading attributes')}
                  emptyText={__('No attributes found', 'No attributes found')}
                  emptyDescription={hasFilters 
                    ? __('Try adjusting your filters to see more results.', 'Try adjusting your filters to see more results.')
                    : __('Get started by creating your first attribute.', 'Get started by creating your first attribute.')
                  }
                  onCreateClick={can('yatra_view_trips') ? handleCreateAttribute : undefined}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
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
                      setSelectedIds(attributes.map((a: Attribute) => a.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  isAllSelected={attributes.length > 0 && selectedIds.length === attributes.length}
                  getItemId={(attribute: Attribute) => attribute.id}
                  getItemStatus={(attribute: Attribute) => attribute.status}
                  statusFilter={statusFilter}
                  skeletonRows={5}
                />
              </CardContent>
            </Card>

          </>
        )}
      </ConditionalRender>

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={10}
            onPageChange={(newPage) => setPage(newPage)}
            itemName={__('attributes', 'attributes')}
          />
        </div>
      )}
    </div>
  );
};

export default Attributes;
