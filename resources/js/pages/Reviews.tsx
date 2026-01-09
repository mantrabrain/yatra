/**
 * Reviews Page
 * Clean, minimal SaaS-style reviews management page
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, Trash2, Star } from 'lucide-react';
import { __ } from '../lib/i18n';
import { formatDate as formatDateUtil } from '../lib/dateFormat';
import { usePermissions } from '../hooks/usePermissions';
import { apiClient } from '../lib/api-client';
import { apiService } from '../lib/api-client';
import { getErrorContext } from '../lib/errors';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { Pagination, Table as SharedTable, BulkActionToolbar } from '../components/shared';

interface Review {
  id: number;
  trip_id: number;
  trip_title: string;
  trip_slug: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string;
  comment: string;
  status: string;
  verified: boolean;
  created_at: string;
}

const Reviews: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; review: Review | null }>({
    isOpen: false,
    review: null,
  });
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        trip: true,
        customer: true,
        rating: true,
        review: true,
        status: true,
        date: true,
      };
    }

    const saved = window.localStorage.getItem('yatra-reviews-visible-columns');
    return saved
      ? JSON.parse(saved)
      : {
          trip: true,
          customer: true,
          rating: true,
          review: true,
          status: true,
          date: true,
        };
  });
  const queryClient = useQueryClient();
  const { can } = usePermissions();

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

    if (ratingFilter !== 'all') {
      params.rating = ratingFilter;
    }

    return params;
  }, [searchTerm, statusFilter, ratingFilter, sortBy, sortOrder, page]);

  // Fetch reviews from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['reviews', queryParams],
    queryFn: async () => {
      const response = await apiClient.get('/reviews', { params: queryParams });
      // Transform API response to match our interface
      const reviews = (response?.data || []).map((item: any) => ({
        id: item.id,
        trip_id: item.trip_id,
        trip_title: item.trip_title || 'Unknown Trip',
        trip_slug: item.trip_slug || '',
        customer_name: item.customer_name || item.author_name || 'Anonymous',
        customer_email: item.customer_email || item.author_email || '',
        rating: item.rating,
        title: item.title || '',
        comment: item.comment || item.content || '',
        status: item.status || 'pending',
        verified: item.verified || false,
        created_at: item.created_at || '',
      }));
      
      return {
        data: reviews,
        total: response?.total || 0,
        page: response?.page || page,
        per_page: response?.per_page || 10,
      };
    },
    enabled: can('yatra_view_reviews'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/reviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const reviews: Review[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);
  const errorContext = getErrorContext(error);

  const formatDate = (dateString: string) => {
    return formatDateUtil(dateString);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">{rating}</span>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'approved': {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Approved', 'yatra'),
      },
      'pending': {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: __('Pending', 'yatra'),
      },
      'spam': {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        label: __('Spam', 'yatra'),
      },
      'trash': {
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
        label: __('Trash', 'yatra'),
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

  const handleEdit = (review: Review) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=reviews&action=edit&id=${review.id}`;
  };

  const handleDelete = (review: Review) => {
    setDeleteConfirm({ isOpen: true, review });
  };

  const confirmDelete = () => {
    if (deleteConfirm.review) {
      deleteMutation.mutate(deleteConfirm.review.id);
      setDeleteConfirm({ isOpen: false, review: null });
    }
  };

  const handleView = (review: Review) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=reviews&action=view&id=${review.id}`;
  };

  const handleCreateReview = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=reviews&action=create`;
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRatingFilter('all');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
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

  const hasFilters = searchTerm || statusFilter !== 'all' || ratingFilter !== 'all' || sortBy !== 'created_at' || sortOrder !== 'desc';

  // Bulk action options depend on current status filter
  const bulkActionOptions = useMemo(() => {
    // In trash view, only allow permanent delete
    if (statusFilter === 'trash') {
      return [
        { value: 'delete', label: __('Delete Permanently', 'yatra') },
      ];
    }

    // In spam view, allow move to trash or delete
    if (statusFilter === 'spam') {
      return [
        { value: 'mark_trash', label: __('Move to Trash', 'yatra') },
        { value: 'delete', label: __('Delete Permanently', 'yatra') },
      ];
    }

    // Default view: allow approve, pending, spam, trash, delete
    return [
      { value: 'mark_approved', label: __('Mark as Approved', 'yatra') },
      { value: 'mark_pending', label: __('Mark as Pending', 'yatra') },
      { value: 'mark_spam', label: __('Mark as Spam', 'yatra') },
      { value: 'mark_trash', label: __('Move to Trash', 'yatra') },
      { value: 'delete', label: __('Delete Permanently', 'yatra') },
    ];
  }, [statusFilter]);

  // Bulk actions
  const handleBulkApply = () => {
    if (!bulkAction || selectedIds.length === 0) {
      return;
    }

    const run = async () => {
      try {
        await apiService.bulkReviewsAction(bulkAction, selectedIds);

        queryClient.invalidateQueries({ queryKey: ['reviews'] });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Bulk review action error', error);
      } finally {
        setSelectedIds([]);
        setBulkAction('');
      }
    };

    void run();
  };

  const toggleColumn = (columnKey: string) => {
    const newVisible = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey as keyof typeof visibleColumns],
    };
    setVisibleColumns(newVisible);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('yatra-reviews-visible-columns', JSON.stringify(newVisible));
    }
  };

  const columnOptions = [
    { key: 'trip', label: __('Trip', 'yatra'), visible: visibleColumns.trip },
    { key: 'customer', label: __('Customer', 'yatra'), visible: visibleColumns.customer },
    { key: 'rating', label: __('Rating', 'yatra'), visible: visibleColumns.rating },
    { key: 'review', label: __('Review', 'yatra'), visible: visibleColumns.review },
    { key: 'status', label: __('Status', 'yatra'), visible: visibleColumns.status },
    { key: 'date', label: __('Date', 'yatra'), visible: visibleColumns.date },
  ];

  const handleApprove = async (review: Review) => {
    await apiService.updateReviewStatus(review.id, 'approved');
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
  };

  const handleMarkPending = async (review: Review) => {
    await apiService.updateReviewStatus(review.id, 'pending');
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
  };

  const handleMarkSpam = async (review: Review) => {
    await apiService.updateReviewStatus(review.id, 'spam');
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
  };

  const handleMarkTrash = async (review: Review) => {
    await apiService.updateReviewStatus(review.id, 'trash');
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
  };

  const actions = [
    {
      key: 'view',
      label: __('View', 'yatra'),
      icon: <Eye className="w-4 h-4" />,
      onClick: (review: Review) => handleView(review),
      condition: () => can('yatra_view_reviews'),
    },
    {
      key: 'approve',
      label: __('Approve', 'yatra'),
      icon: <Star className="w-4 h-4" />,
      onClick: (review: Review) => handleApprove(review),
      condition: (review: Review) => can('yatra_edit_reviews') && review.status !== 'approved',
    },
    {
      key: 'mark_pending',
      label: __('Mark as Pending', 'yatra'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (review: Review) => handleMarkPending(review),
      condition: (review: Review) => can('yatra_edit_reviews') && review.status !== 'pending',
    },
    {
      key: 'edit',
      label: __('Edit', 'yatra'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (review: Review) => handleEdit(review),
      condition: () => can('yatra_edit_reviews'),
    },
    {
      key: 'mark_spam',
      label: __('Mark as Spam', 'yatra'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (review: Review) => handleMarkSpam(review),
      condition: (review: Review) => can('yatra_edit_reviews') && review.status !== 'spam',
    },
    {
      key: 'mark_trash',
      label: __('Move to Trash', 'yatra'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (review: Review) => handleMarkTrash(review),
      condition: (review: Review) => can('yatra_edit_reviews') && review.status !== 'trash',
    },
    {
      key: 'delete',
      label: __('Delete Permanently', 'yatra'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (review: Review) => handleDelete(review),
      variant: 'destructive' as const,
      condition: () => can('yatra_delete_reviews'),
    },
  ];

  return (
    <div className="space-y-3">
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, review: null })}
        onConfirm={confirmDelete}
        title={__('Delete Review', 'yatra')}
        message={deleteConfirm.review 
          ? __('Are you sure you want to delete this review by "{name}"? This action cannot be undone.', 'yatra').replace('{name}', deleteConfirm.review.customer_name)
          : __('Are you sure you want to delete this review? This action cannot be undone.', 'yatra')
        }
        confirmText={__('Delete', 'yatra')}
        cancelText={__('Cancel', 'yatra')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <PageHeader
        title={__('Reviews', 'yatra')}
        description={__('Manage customer reviews and ratings', 'yatra')}
        actionCapability="yatra_edit_reviews"
        actions={
          <Button onClick={handleCreateReview} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add New Review', 'yatra')}
          </Button>
        }
      />

      {/* Filters, Search, and Sorting - Always Visible */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
            {/* Search */}
            <div className="relative min-w-0 w-full lg:w-12 lg:flex-[2]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={__('Search reviews...', 'yatra')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full lg:flex-1"
            >
              <option value="all">{__('All Status', 'yatra')}</option>
              <option value="approved">{__('Approved', 'yatra')}</option>
              <option value="pending">{__('Pending', 'yatra')}</option>
              <option value="spam">{__('Spam', 'yatra')}</option>
              <option value="trash">{__('Trash', 'yatra')}</option>
            </Select>

            {/* Rating Filter */}
            <Select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full lg:flex-1"
            >
              <option value="all">{__('All Ratings', 'yatra')}</option>
              <option value="5">{__('5 Stars', 'yatra')}</option>
              <option value="4">{__('4 Stars', 'yatra')}</option>
              <option value="3">{__('3 Stars', 'yatra')}</option>
              <option value="2">{__('2 Stars', 'yatra')}</option>
              <option value="1">{__('1 Star', 'yatra')}</option>
            </Select>

            {/* Sort By */}
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full lg:flex-1"
            >
              <option value="created_at">{__('Date', 'yatra')}</option>
              <option value="trip_title">{__('Trip', 'yatra')}</option>
              <option value="customer_name">{__('Customer', 'yatra')}</option>
              <option value="rating">{__('Rating', 'yatra')}</option>
              <option value="status">{__('Status', 'yatra')}</option>
            </Select>

            {/* Sort Order */}
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-11 px-4 flex items-center gap-1.5 flex-shrink-0"
              title={sortOrder === 'asc' ? __('Ascending', 'yatra') : __('Descending', 'yatra')}
            >
              {sortOrder === 'asc' ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
              <span className="text-sm">{sortOrder === 'asc' ? __('Asc', 'yatra') : __('Desc', 'yatra')}</span>
            </Button>

            {/* Reset Button */}
            {hasFilters && (
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="flex items-center gap-2 h-11 flex-shrink-0"
              >
                <X className="w-4 h-4" />
                {__('Reset', 'yatra')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions toolbar - shared component */}
      <BulkActionToolbar
        selectedIds={selectedIds}
        bulkAction={bulkAction}
        setBulkAction={setBulkAction}
        onApply={handleBulkApply}
        onClearSelection={() => setSelectedIds([])}
        statusFilter={statusFilter}
        setStatusFilter={(value: string) => {
          setStatusFilter(value);
          setPage(1);
          setSelectedIds([]);
          setBulkAction('');
        }}
        statusOptions={[
          { key: 'all', label: __('All', 'yatra'), count: total },
          { key: 'approved', label: __('Approved', 'yatra'), count: reviews.filter(r => r.status === 'approved').length },
          { key: 'pending', label: __('Pending', 'yatra'), count: reviews.filter(r => r.status === 'pending').length },
          { key: 'spam', label: __('Spam', 'yatra'), count: reviews.filter(r => r.status === 'spam').length },
          { key: 'trash', label: __('Trash', 'yatra'), count: reviews.filter(r => r.status === 'trash').length },
        ]}
        showColumnsDropdown={showColumnsDropdown}
        setShowColumnsDropdown={setShowColumnsDropdown}
        columnOptions={columnOptions}
        onToggleColumn={toggleColumn}
        bulkMutationPending={deleteMutation.isPending}
        totalItems={reviews.length}
        bulkActionOptions={bulkActionOptions}
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <SharedTable
            data={reviews}
            columns={[
              visibleColumns.trip && {
                key: 'trip',
                label: __('Trip', 'yatra'),
                render: (review: Review) => (
                  review.trip_id ? (
                    <a
                      href={`${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&action=edit&id=${review.trip_id}`}
                      className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                    >
                      {review.trip_title}
                    </a>
                  ) : (
                    <span className="font-medium text-gray-500 dark:text-gray-400">
                      {review.trip_title}
                    </span>
                  )
                ),
              },
              visibleColumns.customer && {
                key: 'customer',
                label: __('Customer', 'yatra'),
                render: (review: Review) => (
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {review.customer_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {review.customer_email}
                    </div>
                    {review.verified && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 mt-1">
                        {__('Verified', 'yatra')}
                      </span>
                    )}
                  </div>
                ),
              },
              visibleColumns.rating && {
                key: 'rating',
                label: __('Rating', 'yatra'),
                render: (review: Review) => renderStars(review.rating),
              },
              visibleColumns.review && {
                key: 'review',
                label: __('Review', 'yatra'),
                render: (review: Review) => (
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      {review.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {review.comment}
                    </div>
                  </div>
                ),
              },
              visibleColumns.status && {
                key: 'status',
                label: __('Status', 'yatra'),
                render: (review: Review) => getStatusBadge(review.status),
              },
              visibleColumns.date && {
                key: 'date',
                label: __('Date', 'yatra'),
                render: (review: Review) => (
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {formatDate(review.created_at)}
                  </span>
                ),
              },
            ].filter(Boolean)}
            actions={actions}
            isLoading={isLoading}
            isError={!!error}
            errorText={__('Error loading reviews', 'yatra')}
            errorDescription={__(
              'We couldn’t connect to the reviews service. Please refresh or try again shortly.',
              'We couldn’t connect to the reviews service. Please refresh or try again shortly.'
            )}
            onRetry={() => queryClient.invalidateQueries({ queryKey: ['reviews'] })}
            errorDetails={errorContext.details}
            errorRequestInfo={errorContext.requestInfo}
            emptyText={__('No reviews found', 'yatra')}
            emptyDescription={__('When customers submit reviews, they will appear here.', 'yatra')}
            onSort={handleSort}
            getSortIcon={getSortIcon}
            selectedItemIds={selectedIds}
            onSelectItem={(id: string | number, checked: boolean) => {
              if (checked) {
                setSelectedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
              } else {
                setSelectedIds(prev => prev.filter(existingId => existingId !== id));
              }
            }}
            onSelectAll={(checked: boolean) => {
              if (checked) {
                setSelectedIds(reviews.map(r => r.id));
              } else {
                setSelectedIds([]);
              }
            }}
            isAllSelected={reviews.length > 0 && selectedIds.length === reviews.length}
            getItemId={(review: Review) => review.id}
            capability="yatra_view_reviews"
            skeletonRows={5}
          />
        </CardContent>
      </Card>

      {/* Pagination - shared component, no extra white background */}
      {total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={10}
          onPageChange={setPage}
          itemName={__('Review', 'yatra')}
        />
      )}
    </div>
  );
};

export default Reviews;

