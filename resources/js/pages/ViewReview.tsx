/**
 * View Review Page
 * Display review details in a clean, minimal SaaS-style design
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Star, Mail, Calendar, Edit } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';

const ViewReview: React.FC = () => {
  const { can } = usePermissions();

  // Get review id from URL
  const reviewId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  // Fetch review data
  const { data: review, isLoading, error } = useQuery({
    queryKey: ['review', reviewId],
    queryFn: async () => {
      if (!reviewId) return null;
      // return await apiClient.get(`/reviews/${reviewId}`);
      // Dummy data for now
      const today = new Date();
      const getDate = (days: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
      };

      return {
        id: reviewId,
        trip_id: 1,
        trip_title: 'Everest Base Camp Trek',
        customer_name: 'John Smith',
        customer_email: 'john.smith@example.com',
        rating: 5,
        title: 'Amazing Experience!',
        comment: 'This was the trip of a lifetime. The guides were knowledgeable and the scenery was breathtaking. Every day brought new adventures and unforgettable memories. The team was professional, the accommodations were comfortable, and the food was excellent. I would highly recommend this trip to anyone looking for an authentic mountain trekking experience.',
        status: 'approved',
        verified: true,
        created_at: getDate(5),
        updated_at: getDate(2),
      };
    },
    enabled: !!reviewId && can('yatra_view_reviews'),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600'
            }`}
          />
        ))}
        <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">{rating} {__('out of 5', 'out of 5')}</span>
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
      <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const handleBack = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=reviews`;
  };

  const handleEdit = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=reviews&action=edit&id=${reviewId}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">{__('Loading review...', 'Loading review...')}</span>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__('Review Not Found', 'Review Not Found')}
          description={__('The review you are looking for does not exist', 'The review you are looking for does not exist')}
          actions={
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__('Back to Reviews', 'Back to Reviews')}
            </Button>
          }
        />
        <Card>
          <CardContent className="p-8 text-center text-red-500">
            {__('Error loading review or review not found', 'Error loading review or review not found')}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('Review Details', 'Review Details')}
        description={__('View complete review information', 'View complete review information')}
        actions={
          <div className="flex gap-2">
            <ConditionalRender capability="yatra_edit_reviews">
              <Button
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {__('Edit Review', 'Edit Review')}
              </Button>
            </ConditionalRender>
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__('Back', 'Back')}
            </Button>
          </div>
        }
      />

      <ConditionalRender capability="yatra_view_reviews">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-3">
            {/* Review Overview */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{__('Review Overview', 'Review Overview')}</CardTitle>
                  {getStatusBadge(review.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trip */}
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Trip', 'Trip')}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {review.trip_title}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    {__('Rating', 'Rating')}
                  </div>
                  {renderStars(review.rating)}
                </div>

                {/* Title */}
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Review Title', 'Review Title')}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {review.title}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    {__('Review Comment', 'Review Comment')}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {review.comment}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Customer Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{__('Customer Information', 'Customer Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Customer Name', 'Customer Name')}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {review.customer_name}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {__('Email Address', 'Email Address')}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {review.customer_email}
                  </div>
                </div>
                {review.verified && (
                  <div>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      {__('Verified Purchase', 'Verified Purchase')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{__('Timeline', 'Timeline')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {__('Created', 'Created')}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatDate(review.created_at)}
                  </div>
                </div>
                {review.updated_at && review.updated_at !== review.created_at && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__('Last Updated', 'Last Updated')}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(review.updated_at)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </ConditionalRender>
    </div>
  );
};

export default ViewReview;

