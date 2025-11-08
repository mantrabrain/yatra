/**
 * Reviews Page
 * Clean, minimal SaaS-style reviews management page
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, Trash2, Star } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ConditionalRender } from '../components/ui/conditional-render';

interface Review {
  id: number;
  trip_id: number;
  trip_title: string;
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

  // Fetch reviews with dummy data
  const { data, isLoading, error } = useQuery({
    queryKey: ['reviews', queryParams],
    queryFn: async () => {
      // return await apiClient.get('/yatra/v1/reviews', { params: queryParams });
      // Dummy data
      const today = new Date();
      const getDate = (days: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
      };

      const allReviews: Review[] = [
        {
          id: 1,
          trip_id: 1,
          trip_title: 'Everest Base Camp Trek',
          customer_name: 'John Smith',
          customer_email: 'john.smith@example.com',
          rating: 5,
          title: 'Amazing Experience!',
          comment: 'This was the trip of a lifetime. The guides were knowledgeable and the scenery was breathtaking.',
          status: 'approved',
          verified: true,
          created_at: getDate(5),
        },
        {
          id: 2,
          trip_id: 2,
          trip_title: 'Annapurna Circuit Adventure',
          customer_name: 'Sarah Johnson',
          customer_email: 'sarah.j@example.com',
          rating: 4,
          title: 'Great Adventure',
          comment: 'Beautiful landscapes and well-organized tour. Would recommend to anyone looking for an adventure.',
          status: 'approved',
          verified: true,
          created_at: getDate(8),
        },
        {
          id: 3,
          trip_id: 1,
          trip_title: 'Everest Base Camp Trek',
          customer_name: 'Michael Brown',
          customer_email: 'michael.b@example.com',
          rating: 5,
          title: 'Unforgettable Journey',
          comment: 'Everything exceeded expectations. The team was professional and the experience was incredible.',
          status: 'approved',
          verified: false,
          created_at: getDate(12),
        },
        {
          id: 4,
          trip_id: 3,
          trip_title: 'Golden Triangle Tour',
          customer_name: 'Emily Davis',
          customer_email: 'emily.d@example.com',
          rating: 3,
          title: 'Good but could be better',
          comment: 'The tour was good overall, but some accommodations could have been better.',
          status: 'pending',
          verified: false,
          created_at: getDate(15),
        },
        {
          id: 5,
          trip_id: 2,
          trip_title: 'Annapurna Circuit Adventure',
          customer_name: 'David Wilson',
          customer_email: 'david.w@example.com',
          rating: 5,
          title: 'Perfect Trip',
          comment: 'Absolutely loved every moment. The guides were amazing and the itinerary was perfect.',
          status: 'approved',
          verified: true,
          created_at: getDate(18),
        },
        {
          id: 6,
          trip_id: 4,
          trip_title: 'Bhutan Cultural Journey',
          customer_name: 'Lisa Anderson',
          customer_email: 'lisa.a@example.com',
          rating: 4,
          title: 'Cultural Delight',
          comment: 'Great cultural experience. Learned a lot about Bhutanese traditions and history.',
          status: 'approved',
          verified: true,
          created_at: getDate(22),
        },
        {
          id: 7,
          trip_id: 1,
          trip_title: 'Everest Base Camp Trek',
          customer_name: 'Robert Taylor',
          customer_email: 'robert.t@example.com',
          rating: 2,
          title: 'Disappointing',
          comment: 'The trip did not meet my expectations. Several issues with accommodations and logistics.',
          status: 'pending',
          verified: false,
          created_at: getDate(25),
        },
        {
          id: 8,
          trip_id: 5,
          trip_title: 'Tibet Spiritual Tour',
          customer_name: 'Jennifer Martinez',
          customer_email: 'jennifer.m@example.com',
          rating: 5,
          title: 'Spiritual Awakening',
          comment: 'A truly transformative experience. The spiritual aspects of the tour were deeply moving.',
          status: 'approved',
          verified: true,
          created_at: getDate(30),
        },
      ];

      // Apply filters
      let filtered = [...allReviews];

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(
          review =>
            review.trip_title.toLowerCase().includes(search) ||
            review.customer_name.toLowerCase().includes(search) ||
            review.customer_email.toLowerCase().includes(search) ||
            review.title.toLowerCase().includes(search) ||
            review.comment.toLowerCase().includes(search)
        );
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(review => review.status === statusFilter);
      }

      if (ratingFilter !== 'all') {
        filtered = filtered.filter(review => review.rating === parseInt(ratingFilter));
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'trip_title':
            aValue = a.trip_title.toLowerCase();
            bValue = b.trip_title.toLowerCase();
            break;
          case 'customer_name':
            aValue = a.customer_name.toLowerCase();
            bValue = b.customer_name.toLowerCase();
            break;
          case 'rating':
            aValue = a.rating;
            bValue = b.rating;
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
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      // Apply pagination
      const start = (page - 1) * 10;
      const end = start + 10;
      const paginated = filtered.slice(start, end);

      return {
        data: paginated,
        total: filtered.length,
        page,
        per_page: 10,
      };
    },
    enabled: can('yatra_view_reviews'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (_id: number) => {
      // return await apiClient.delete(`/yatra/v1/reviews/${_id}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const reviews = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
        label: __('Approved', 'Approved'),
      },
      'pending': {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: __('Pending', 'Pending'),
      },
      'spam': {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        label: __('Spam', 'Spam'),
      },
      'trash': {
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
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

  const handleEdit = (review: Review) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=reviews&action=edit&id=${review.id}`;
  };

  const handleDelete = (review: Review) => {
    if (confirm(__('Are you sure you want to delete this review?', 'Are you sure you want to delete this review?'))) {
      deleteMutation.mutate(review.id);
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

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('Reviews', 'Reviews')}
        description={__('Manage customer reviews and ratings', 'Manage customer reviews and ratings')}
        actionCapability="yatra_edit_reviews"
        actions={
          <Button onClick={handleCreateReview} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add New Review', 'Add New Review')}
          </Button>
        }
      />

      {/* Filters, Search, and Sorting - Always Visible */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={__('Search reviews...', 'Search reviews...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40 h-9"
            >
              <option value="all">{__('All Status', 'All Status')}</option>
              <option value="approved">{__('Approved', 'Approved')}</option>
              <option value="pending">{__('Pending', 'Pending')}</option>
              <option value="spam">{__('Spam', 'Spam')}</option>
              <option value="trash">{__('Trash', 'Trash')}</option>
            </Select>

            {/* Rating Filter */}
            <Select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full md:w-40 h-9"
            >
              <option value="all">{__('All Ratings', 'All Ratings')}</option>
              <option value="5">{__('5 Stars', '5 Stars')}</option>
              <option value="4">{__('4 Stars', '4 Stars')}</option>
              <option value="3">{__('3 Stars', '3 Stars')}</option>
              <option value="2">{__('2 Stars', '2 Stars')}</option>
              <option value="1">{__('1 Star', '1 Star')}</option>
            </Select>

            {/* Sort By */}
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-40 h-9"
            >
              <option value="created_at">{__('Date', 'Date')}</option>
              <option value="trip_title">{__('Trip', 'Trip')}</option>
              <option value="customer_name">{__('Customer', 'Customer')}</option>
              <option value="rating">{__('Rating', 'Rating')}</option>
              <option value="status">{__('Status', 'Status')}</option>
            </Select>

            {/* Sort Order */}
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-9 px-3 flex items-center gap-1.5"
              title={sortOrder === 'asc' ? __('Ascending', 'Ascending') : __('Descending', 'Descending')}
            >
              {sortOrder === 'asc' ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
              <span className="text-xs">{sortOrder === 'asc' ? __('Asc', 'Asc') : __('Desc', 'Desc')}</span>
            </Button>

            {/* Reset Button */}
            {hasFilters && (
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="flex items-center gap-2 h-9"
              >
                <X className="w-4 h-4" />
                {__('Reset', 'Reset')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_reviews">
        {/* Table */}
        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              {__('Error loading reviews', 'Error loading reviews')}
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              {__('Loading reviews...', 'Loading reviews...')}
            </CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              {__('No reviews found', 'No reviews found')}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        onClick={() => handleSort('trip_title')}
                        className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        {__('Trip', 'Trip')}
                        {getSortIcon('trip_title')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('customer_name')}
                        className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        {__('Customer', 'Customer')}
                        {getSortIcon('customer_name')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('rating')}
                        className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        {__('Rating', 'Rating')}
                        {getSortIcon('rating')}
                      </button>
                    </TableHead>
                    <TableHead>{__('Review', 'Review')}</TableHead>
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
                        {__('Date', 'Date')}
                        {getSortIcon('created_at')}
                      </button>
                    </TableHead>
                    <TableHead className="text-right w-[100px]">{__('Actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {review.trip_title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {review.customer_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {review.customer_email}
                          </div>
                          {review.verified && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 mt-1">
                              {__('Verified', 'Verified')}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderStars(review.rating)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white mb-1">
                            {review.title}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {review.comment}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(review.status)}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                        {formatDate(review.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ConditionalRender capability="yatra_view_reviews">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(review)}
                              className="h-8 w-8"
                              aria-label={__('View review', 'View review')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </ConditionalRender>

                          <ConditionalRender capability="yatra_edit_reviews">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(review)}
                              className="h-8 w-8"
                              aria-label={__('Edit review', 'Edit review')}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </ConditionalRender>

                          <ConditionalRender capability="yatra_delete_reviews">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(review)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              aria-label={__('Delete review', 'Delete review')}
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
            </CardContent>
          </Card>
        )}

        {/* Pagination - Always Visible */}
        {total > 0 && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {__('Showing', 'Showing')} <span className="font-medium text-gray-900 dark:text-white">{(page - 1) * 10 + 1}</span> - <span className="font-medium text-gray-900 dark:text-white">{Math.min(page * 10, total)}</span> {__('of', 'of')} <span className="font-medium text-gray-900 dark:text-white">{total}</span> {__('reviews', 'reviews')}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8"
                  >
                    {__('Previous', 'Previous')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-8"
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

export default Reviews;

