/**
 * Items Page (Item Subtypes)
 * Manage specific items under item types (Hiking, Lunch, Bus, etc.)
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, Tag, Edit, Trash2 } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { ConditionalRender } from '../components/ui/conditional-render';
import { HelpText } from '../components/ui/help-text';
import { Alert } from '../components/ui/alert';
import { IconSelector } from '../components/ui/icon-selector';

interface Item {
  id: number;
  name: string;
  slug: string;
  description: string;
  type_id: number;
  type_name: string;
  type_icon: string;
  status: string;
  usage_count: number;
  created_at: string;
}

const Items: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { can } = usePermissions();

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

    if (typeFilter !== 'all') {
      params.type_id = typeFilter;
    }

    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    return params;
  }, [searchTerm, typeFilter, statusFilter, sortBy, sortOrder, page]);

  // Fetch item types for filter
  const { data: typesData } = useQuery({
    queryKey: ['item-types-simple'],
    queryFn: async () => {
      return [
        { id: 1, name: 'Activity', icon: 'activity' },
        { id: 2, name: 'Meal', icon: 'utensils' },
        { id: 3, name: 'Accommodation', icon: 'hotel' },
        { id: 4, name: 'Transportation', icon: 'bus' },
        { id: 5, name: 'Rest', icon: 'moon' },
      ];
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['items', queryParams],
    queryFn: async () => {
      const today = new Date();
      const getDate = (days: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
      };

      const allItems: Item[] = [
        { id: 1, name: 'Hiking', slug: 'hiking', description: 'Mountain hiking and trekking', type_id: 1, type_name: 'Activity', type_icon: 'footprints', status: 'active', usage_count: 25, created_at: getDate(30) },
        { id: 2, name: 'Sightseeing', slug: 'sightseeing', description: 'Tourist attractions and landmarks', type_id: 1, type_name: 'Activity', type_icon: 'eye', status: 'active', usage_count: 18, created_at: getDate(28) },
        { id: 3, name: 'Breakfast', slug: 'breakfast', description: 'Morning meal', type_id: 2, type_name: 'Meal', type_icon: 'utensils', status: 'active', usage_count: 45, created_at: getDate(25) },
        { id: 4, name: 'Lunch', slug: 'lunch', description: 'Midday meal', type_id: 2, type_name: 'Meal', type_icon: 'utensils', status: 'active', usage_count: 42, created_at: getDate(24) },
        { id: 5, name: 'Dinner', slug: 'dinner', description: 'Evening meal', type_id: 2, type_name: 'Meal', type_icon: 'utensils', status: 'active', usage_count: 40, created_at: getDate(23) },
        { id: 6, name: 'Hotel', slug: 'hotel', description: 'Hotel accommodation', type_id: 3, type_name: 'Accommodation', type_icon: 'hotel', status: 'active', usage_count: 35, created_at: getDate(20) },
        { id: 7, name: 'Lodge', slug: 'lodge', description: 'Mountain lodge', type_id: 3, type_name: 'Accommodation', type_icon: 'hotel', status: 'active', usage_count: 22, created_at: getDate(18) },
        { id: 8, name: 'Bus', slug: 'bus', description: 'Bus transportation', type_id: 4, type_name: 'Transportation', type_icon: 'bus', status: 'active', usage_count: 30, created_at: getDate(15) },
        { id: 9, name: 'Flight', slug: 'flight', description: 'Airplane flight', type_id: 4, type_name: 'Transportation', type_icon: 'plane', status: 'active', usage_count: 15, created_at: getDate(12) },
        { id: 10, name: 'Free Time', slug: 'free-time', description: 'Leisure and rest period', type_id: 5, type_name: 'Rest', type_icon: 'moon', status: 'active', usage_count: 20, created_at: getDate(10) },
      ];

      let filtered = allItems;
      
      if (searchTerm) {
        filtered = filtered.filter(i => 
          i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (typeFilter !== 'all') {
        filtered = filtered.filter(i => i.type_id === parseInt(typeFilter));
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(i => i.status === statusFilter);
      }

      filtered.sort((a, b) => {
        let aVal: any = a[sortBy as keyof Item];
        let bVal: any = b[sortBy as keyof Item];
        
        if (sortBy === 'created_at') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      const start = (page - 1) * 10;
      const end = start + 10;
      const paginated = filtered.slice(start, end);

      return {
        data: paginated,
        total: filtered.length,
        pages: Math.ceil(filtered.length / 10),
      };
    },
    enabled: can('yatra_view_trips'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log('Deleting item:', id);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const handleCreate = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=items&action=create`;
  };

  const handleEdit = (item: Item) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=items&action=edit&id=${item.id}`;
  };

  const handleDelete = (item: Item) => {
    const confirmMessage = __('Are you sure you want to delete "{name}"? This will remove it from all itineraries and cannot be undone.', 'Are you sure you want to delete "{name}"? This will remove it from all itineraries and cannot be undone.').replace('{name}', item.name);
    if (confirm(confirmMessage)) {
      deleteMutation.mutate(item.id);
    }
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

  const items = data?.data || [];
  const totalPages = data?.pages || 1;
  const types = typesData || [];

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('Items', 'Items')}
        description={__('Manage specific items (subtypes) under item types. Examples: Hiking (under Activity), Lunch (under Meal), Bus (under Transportation).', 'Manage specific items (subtypes) under item types. Examples: Hiking (under Activity), Lunch (under Meal), Bus (under Transportation).')}
        actionCapability="yatra_edit_trips"
        actions={
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add New Item', 'Add New Item')}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-3">
          <div className="mb-2">
            <HelpText 
              text={__('Items are specific subtypes under item types. For example, under "Activity" type, you can have items like "Hiking", "Sightseeing", etc.', 'Items are specific subtypes under item types. For example, under "Activity" type, you can have items like "Hiking", "Sightseeing", etc.')}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={__('Search by name...', 'Search by name...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full md:w-48 h-9"
            >
              <option value="all">{__('All Types', 'All Types')}</option>
              {types.map((type: any) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40 h-9"
            >
              <option value="all">{__('All Status', 'All Status')}</option>
              <option value="active">{__('Active', 'Active')}</option>
              <option value="inactive">{__('Inactive', 'Inactive')}</option>
            </Select>

            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-40 h-9"
            >
              <option value="name">{__('Name', 'Name')}</option>
              <option value="type_name">{__('Type', 'Type')}</option>
              <option value="usage_count">{__('Usage', 'Usage')}</option>
              <option value="created_at">{__('Date', 'Date')}</option>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-9 px-3 flex items-center gap-1.5"
            >
              {sortOrder === 'asc' ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
              <span className="text-xs">{sortOrder === 'asc' ? __('Asc', 'Asc') : __('Desc', 'Desc')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_trips">
        {error ? (
          <Alert variant="error" title={__('Error Loading Items', 'Error Loading Items')}>
            {__('We couldn\'t load items. Please refresh the page or try again later.', 'We couldn\'t load items. Please refresh the page or try again later.')}
          </Alert>
        ) : (
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {__('Loading items...', 'Loading items...')}
                    </p>
                  </div>
                </div>
              ) : items.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <Tag className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {__('No items yet', 'No items yet')}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {__('Create specific items under item types. Examples: Hiking, Lunch, Bus, etc.', 'Create specific items under item types. Examples: Hiking, Lunch, Bus, etc.')}
                      </p>
                      <Button onClick={handleCreate} className="flex items-center gap-2 mx-auto">
                        <Plus className="w-4 h-4" />
                        {__('Create Your First Item', 'Create Your First Item')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          {__('Item', 'Item')}
                          {getSortIcon('name')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('type_name')}
                          className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          {__('Type', 'Type')}
                          {getSortIcon('type_name')}
                        </button>
                      </TableHead>
                      <TableHead>{__('Description', 'Description')}</TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('usage_count')}
                          className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          {__('Usage', 'Usage')}
                          {getSortIcon('usage_count')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          {__('Status', 'Status')}
                          {getSortIcon('status')}
                        </button>
                      </TableHead>
                      <TableHead className="text-right w-[120px]">
                        <span className="sr-only">{__('Actions', 'Actions')}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {item.slug}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <IconSelector 
                                iconName={item.type_icon as any} 
                                className="w-4 h-4 text-gray-700 dark:text-gray-300"
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {item.type_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {item.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="info">{item.usage_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={item.status === 'active' ? 'success' : 'default'}
                          >
                            {item.status === 'active' ? __('Active', 'Active') : __('Inactive', 'Inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <ConditionalRender capability="yatra_edit_trips">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(item)}
                                className="h-8 w-8"
                                title={__('Edit this item', 'Edit this item')}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </ConditionalRender>

                            <ConditionalRender capability="yatra_delete_trips">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item)}
                                className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                title={__('Delete this item (cannot be undone)', 'Delete this item (cannot be undone)')}
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
        )}

        {!isLoading && items.length > 0 && totalPages > 1 && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {__('Page', 'Page')} {page} {__('of', 'of')} {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    {__('Previous', 'Previous')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    {__('Next', 'Next')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </ConditionalRender>
    </div>
  );
};

export default Items;

