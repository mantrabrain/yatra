/**
 * Item Types Page
 * Manage itinerary item types (Activity, Meal, Accommodation, etc.)
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, Package, Edit, Trash2 } from 'lucide-react';
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

interface ItemType {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  status: string;
  items_count: number;
  created_at: string;
}

const ItemTypes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
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

    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    return params;
  }, [searchTerm, statusFilter, sortBy, sortOrder, page]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['item-types', queryParams],
    queryFn: async () => {
      const today = new Date();
      const getDate = (days: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
      };

      const allTypes: ItemType[] = [
        {
          id: 1,
          name: 'Activity',
          slug: 'activity',
          description: 'Physical activities like hiking, trekking, sightseeing',
          icon: 'activity',
          color: 'blue',
          status: 'active',
          items_count: 45,
          created_at: getDate(30),
        },
        {
          id: 2,
          name: 'Meal',
          slug: 'meal',
          description: 'Breakfast, lunch, dinner, snacks',
          icon: 'utensils',
          color: 'green',
          status: 'active',
          items_count: 32,
          created_at: getDate(25),
        },
        {
          id: 3,
          name: 'Accommodation',
          slug: 'accommodation',
          description: 'Hotels, lodges, campsites',
          icon: 'hotel',
          color: 'purple',
          status: 'active',
          items_count: 28,
          created_at: getDate(20),
        },
        {
          id: 4,
          name: 'Transportation',
          slug: 'transportation',
          description: 'Bus, flight, train, car transfers',
          icon: 'bus',
          color: 'orange',
          status: 'active',
          items_count: 18,
          created_at: getDate(15),
        },
        {
          id: 5,
          name: 'Rest',
          slug: 'rest',
          description: 'Rest periods, free time',
          icon: 'moon',
          color: 'gray',
          status: 'active',
          items_count: 12,
          created_at: getDate(10),
        },
      ];

      // Apply filters
      let filtered = allTypes;
      
      if (searchTerm) {
        filtered = filtered.filter(t => 
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(t => t.status === statusFilter);
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aVal: any = a[sortBy as keyof ItemType];
        let bVal: any = b[sortBy as keyof ItemType];
        
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
      // return await apiClient.delete(`/item-types/${id}`);
      console.log('Deleting item type:', id);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-types'] });
    },
  });

  const handleCreate = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=item-types&action=create`;
  };

  const handleEdit = (type: ItemType) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=item-types&action=edit&id=${type.id}`;
  };

  const handleDelete = (type: ItemType) => {
    const confirmMessage = __('Are you sure you want to delete "{name}"? This will also delete all associated items and cannot be undone.', 'Are you sure you want to delete "{name}"? This will also delete all associated items and cannot be undone.').replace('{name}', type.name);
    if (confirm(confirmMessage)) {
      deleteMutation.mutate(type.id);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const types = data?.data || [];
  const totalPages = data?.pages || 1;

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('Item Types', 'Item Types')}
        description={__('Manage categories for itinerary items like Activity, Meal, Accommodation, etc. These types help organize your trip schedules.', 'Manage categories for itinerary items like Activity, Meal, Accommodation, etc. These types help organize your trip schedules.')}
        actionCapability="yatra_edit_trips"
        actions={
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add New Type', 'Add New Type')}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-3">
          <div className="mb-2">
            <HelpText 
              text={__('Item types are categories for organizing itinerary items. Examples: Activity, Meal, Accommodation, Transportation.', 'Item types are categories for organizing itinerary items. Examples: Activity, Meal, Accommodation, Transportation.')}
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
              <option value="items_count">{__('Items Count', 'Items Count')}</option>
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
          <Alert variant="error" title={__('Error Loading Item Types', 'Error Loading Item Types')}>
            {__('We couldn\'t load item types. Please refresh the page or try again later.', 'We couldn\'t load item types. Please refresh the page or try again later.')}
          </Alert>
        ) : (
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {__('Loading item types...', 'Loading item types...')}
                    </p>
                  </div>
                </div>
              ) : types.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {__('No item types yet', 'No item types yet')}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {__('Get started by creating your first item type. Examples: Activity, Meal, Accommodation.', 'Get started by creating your first item type. Examples: Activity, Meal, Accommodation.')}
                      </p>
                      <Button onClick={handleCreate} className="flex items-center gap-2 mx-auto">
                        <Plus className="w-4 h-4" />
                        {__('Create Your First Type', 'Create Your First Type')}
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
                          {__('Type', 'Type')}
                          {getSortIcon('name')}
                        </button>
                      </TableHead>
                      <TableHead>{__('Description', 'Description')}</TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('items_count')}
                          className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          {__('Items', 'Items')}
                          {getSortIcon('items_count')}
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
                      <TableHead>
                        <button
                          onClick={() => handleSort('created_at')}
                          className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          {__('Created', 'Created')}
                          {getSortIcon('created_at')}
                        </button>
                      </TableHead>
                      <TableHead className="text-right w-[120px]">
                        <span className="sr-only">{__('Actions', 'Actions')}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {types.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <IconSelector 
                                iconName={type.icon as any} 
                                className="w-5 h-5 text-gray-700 dark:text-gray-300"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {type.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {type.slug}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {type.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="info">{type.items_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={type.status === 'active' ? 'success' : 'default'}
                          >
                            {type.status === 'active' ? __('Active', 'Active') : __('Inactive', 'Inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                          {formatDate(type.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <ConditionalRender capability="yatra_edit_trips">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(type)}
                                className="h-8 w-8"
                                title={__('Edit this type', 'Edit this type')}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </ConditionalRender>

                            <ConditionalRender capability="yatra_delete_trips">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(type)}
                                className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                title={__('Delete this type (cannot be undone)', 'Delete this type (cannot be undone)')}
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

        {/* Pagination */}
        {!isLoading && types.length > 0 && totalPages > 1 && (
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

export default ItemTypes;

