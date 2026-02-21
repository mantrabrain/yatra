/**
 * View Review Page
 * Display review details in a clean, minimal SaaS-style design
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, Mail, Calendar, Edit, MapPin } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { apiClient } from '../lib/api-client';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';

interface ReviewData {
  id: number;
  trip_id: number;
  trip_title: string;
  trip_slug?: string;
  customer_name: string;
  customer_email: string;
  customer_location?: string;
  rating: number;
  title: string;
  content: string;
  status: string;
  verified: boolean;
  created_at: string;
  updated_at?: string;
}

const ViewReview: React.FC = () => {
  const { can } = usePermissions();

  // Get review id from URL
  const reviewId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  // Fetch review data from API
  const { data: review, isLoading, error } = useQuery<ReviewData | null>({
    queryKey: ['review', reviewId],
    queryFn: async () => {
      if (!reviewId) return null;
      const response = await apiClient.get(`/reviews/${reviewId}`);
      // Transform API response
      const data = response?.data || response;
      return {
        id: data.id,
        trip_id: data.trip_id,
        trip_title: data.trip_title || 'Unknown Trip',
        trip_slug: data.trip_slug || '',
        customer_name: data.customer_name || data.author_name || 'Anonymous',
        customer_email: data.customer_email || data.author_email || '',
        customer_location: data.customer_location || data.author_location || '',
        rating: data.rating,
        title: data.title || '',
        content: data.content || '',
        status: data.status || 'pending',
        verified: data.verified || false,
        created_at: data.created_at || '',
        updated_at: data.updated_at || '',
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
        <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">{rating} {__('out of 5', 'yatra')}</span>
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
      <div className="space-y-3">
        <PageHeader
          title={__('Review Details', 'yatra')}
          description={__('View complete review information', 'yatra')}
          actions={
            <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {__('Back', 'yatra')}
            </Button>
          }
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div>
                  <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div>
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Sidebar Skeleton */}
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div>
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                  <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                  <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__('Review Not Found', 'yatra')}
          description={__('The review you are looking for does not exist', 'yatra')}
          actions={
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__('Back to Reviews', 'yatra')}
            </Button>
          }
        />
        <Card>
          <CardContent className="p-8 text-center text-red-500">
            {__('Error loading review or review not found', 'yatra')}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('Review Details', 'yatra')}
        description={__('View complete review information', 'yatra')}
        actions={
          <div className="flex gap-2">
            <ConditionalRender capability="yatra_edit_reviews">
              <Button
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {__('Edit Review', 'yatra')}
              </Button>
            </ConditionalRender>
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__('Back', 'yatra')}
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
                  <CardTitle className="text-base">{__('Review Overview', 'yatra')}</CardTitle>
                  {getStatusBadge(review.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trip */}
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Trip', 'yatra')}
                  </div>
                  {review.trip_id ? (
                    <a 
                      href={`${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&action=edit&id=${review.trip_id}`}
                      className="text-lg font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                    >
                      {review.trip_title}
                    </a>
                  ) : (
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {review.trip_title}
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    {__('Rating', 'yatra')}
                  </div>
                  {renderStars(review.rating)}
                </div>

                {/* Title */}
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Review Title', 'yatra')}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {review.title}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    {__('Review Comment', 'yatra')}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {review.content}
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
                <CardTitle className="text-base">{__('Customer Information', 'yatra')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Customer Name', 'yatra')}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {review.customer_name}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {__('Email Address', 'yatra')}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {review.customer_email || <span className="text-gray-400">{__('Not provided', 'yatra')}</span>}
                  </div>
                </div>
                {review.customer_location && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {__('Location', 'yatra')}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {review.customer_location}
                    </div>
                  </div>
                )}
                {review.verified && (
                  <div>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      {__('Verified Purchase', 'yatra')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{__('Timeline', 'yatra')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {__('Created', 'yatra')}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatDate(review.created_at)}
                  </div>
                </div>
                {review.updated_at && review.updated_at !== review.created_at && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__('Last Updated', 'yatra')}
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

