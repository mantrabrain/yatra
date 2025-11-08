import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Tag, Loader2 } from 'lucide-react';
import { __ } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useNavigate } from '../hooks/useNavigate';

interface TravelerCategory {
  id: number;
  label: string;
  description: string;
  age_min?: number;
  age_max?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

const TravelerCategories: React.FC = () => {
  const { navigate } = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'label' | 'status' | 'created_at'>('label');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Dummy data - replace with actual API call
  const { data: categories = [], isLoading } = useQuery<TravelerCategory[]>({
    queryKey: ['traveler-categories'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return [
        {
          id: 1,
          label: 'Adult',
          description: 'Standard adult pricing for travelers aged 18 and above',
          age_min: 18,
          age_max: undefined,
          status: 'active',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          label: 'Child',
          description: 'Pricing for children aged 5-17 years',
          age_min: 5,
          age_max: 17,
          status: 'active',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 3,
          label: 'Infant',
          description: 'Pricing for infants under 5 years old',
          age_min: 0,
          age_max: 4,
          status: 'active',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 4,
          label: 'Senior',
          description: 'Special pricing for senior citizens aged 60 and above',
          age_min: 60,
          age_max: undefined,
          status: 'active',
          created_at: '2024-01-16T10:00:00Z',
          updated_at: '2024-01-16T10:00:00Z',
        },
        {
          id: 5,
          label: 'Student',
          description: 'Discounted pricing for students with valid ID',
          age_min: undefined,
          age_max: undefined,
          status: 'active',
          created_at: '2024-01-17T10:00:00Z',
          updated_at: '2024-01-17T10:00:00Z',
        },
      ];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (_id: number) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traveler-categories'] });
    },
  });

  const filteredAndSortedCategories = useMemo(() => {
    let filtered = categories.filter(category => {
      const matchesSearch = category.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           category.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || category.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'label':
          aValue = a.label.toLowerCase();
          bValue = b.label.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [categories, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleSort = (field: 'label' | 'status' | 'created_at') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: 'label' | 'status' | 'created_at') => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const handleDelete = (id: number, label: string) => {
    if (window.confirm(__('Are you sure you want to delete the category "{{label}}"?', `Are you sure you want to delete the category "${label}"?`))) {
      deleteMutation.mutate(id);
    }
  };


  // Skeleton loader component
  const SkeletonRow = () => (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </TableCell>
      <TableCell>
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={__('Traveler Categories', 'Traveler Categories')}
        description={__('Manage pricing categories for different types of travelers', 'Manage pricing categories for different types of travelers')}
        actions={
          <Button
            onClick={() => navigate({ subpage: 'traveler-categories', action: 'create' })}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {__('Add Category', 'Add Category')}
          </Button>
        }
      />

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={__('Search categories...', 'Search categories...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full md:w-48"
            >
              <option value="all">{__('All Status', 'All Status')}</option>
              <option value="active">{__('Active', 'Active')}</option>
              <option value="inactive">{__('Inactive', 'Inactive')}</option>
            </Select>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as 'label' | 'status' | 'created_at');
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="w-full md:w-48"
            >
              <option value="label-asc">{__('Label (A-Z)', 'Label (A-Z)')}</option>
              <option value="label-desc">{__('Label (Z-A)', 'Label (Z-A)')}</option>
              <option value="status-asc">{__('Status (A-Z)', 'Status (A-Z)')}</option>
              <option value="status-desc">{__('Status (Z-A)', 'Status (Z-A)')}</option>
              <option value="created_at-desc">{__('Newest First', 'Newest First')}</option>
              <option value="created_at-asc">{__('Oldest First', 'Oldest First')}</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{__('Category', 'Category')}</TableHead>
                  <TableHead>{__('Description', 'Description')}</TableHead>
                  <TableHead>{__('Age Range', 'Age Range')}</TableHead>
                  <TableHead>{__('Status', 'Status')}</TableHead>
                  <TableHead>{__('Created', 'Created')}</TableHead>
                  <TableHead className="text-right">{__('Actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonRow key={i} />
                ))}
              </TableBody>
            </Table>
          ) : filteredAndSortedCategories.length === 0 ? (
            <div className="p-12 text-center">
              <Tag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                {searchTerm || statusFilter !== 'all'
                  ? __('No categories match your search', 'No categories match your search')
                  : __('No categories yet', 'No categories yet')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? __('Try adjusting your filters', 'Try adjusting your filters')
                  : __('Get started by creating your first traveler category', 'Get started by creating your first traveler category')}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button
                  onClick={() => navigate({ subpage: 'traveler-categories', action: 'create' })}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  {__('Add Category', 'Add Category')}
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => handleSort('label')}
                      className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {__('Category', 'Category')}
                      {getSortIcon('label')}
                    </button>
                  </TableHead>
                  <TableHead>{__('Description', 'Description')}</TableHead>
                  <TableHead>{__('Age Range', 'Age Range')}</TableHead>
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
                  <TableHead className="text-right">{__('Actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                          {category.label}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {category.description}
                      </span>
                    </TableCell>
                    <TableCell>
                      {category.age_min !== undefined || category.age_max !== undefined ? (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {category.age_min !== undefined && category.age_max !== undefined
                            ? `${category.age_min}-${category.age_max} ${__('years', 'years')}`
                            : category.age_min !== undefined
                            ? `${category.age_min}+ ${__('years', 'years')}`
                            : category.age_max !== undefined
                            ? `${__('Under', 'Under')} ${category.age_max} ${__('years', 'years')}`
                            : '-'}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                          {__('No age restriction', 'No age restriction')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={category.status === 'active' ? 'success' : 'error'}
                        className="text-xs"
                      >
                        {category.status === 'active' ? __('Active', 'Active') : __('Inactive', 'Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(category.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate({ subpage: 'traveler-categories', action: 'edit', id: category.id })}
                          className="h-8 w-8"
                          title={__('Edit Category', 'Edit Category')}
                          aria-label={__('Edit category', 'Edit category')}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id, category.label)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          disabled={deleteMutation.isPending}
                          title={__('Delete Category', 'Delete Category')}
                          aria-label={__('Delete category', 'Delete category')}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TravelerCategories;

