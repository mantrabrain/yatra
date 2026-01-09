/**
 * Review Form Page
 * Add/Edit Review form with clean, minimal SaaS-style design
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Star } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { apiClient } from '../lib/api-client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';

interface ReviewFormData {
  trip_id: string;
  customer_name: string;
  customer_email: string;
  rating: string;
  title: string;
  comment: string;
  status: string;
  verified: boolean;
}

const ReviewForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [formData, setFormData] = useState<ReviewFormData>({
    trip_id: '',
    customer_name: '',
    customer_email: '',
    rating: '5',
    title: '',
    comment: '',
    status: 'pending',
    verified: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const reviewId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  const isEditMode = action === 'edit' && reviewId !== null;

  // Fetch trips for dropdown
  const { data: tripsData } = useQuery({
    queryKey: ['trips-list'],
    queryFn: async () => {
      const response = await apiClient.get('/trips', { 
        params: { 
          per_page: 100,
          status: 'all' // Get all trips including drafts
        } 
      });
      // Transform API response
      const trips = (response?.data || []).map((trip: any) => ({
        id: trip.id,
        title: trip.title || 'Untitled Trip',
      }));
      return { data: trips };
    },
    enabled: can('yatra_view_trips'),
  });

  // Fetch review data if editing
  const { data: reviewData, isLoading: isLoadingReview } = useQuery({
    queryKey: ['review', reviewId],
    queryFn: async () => {
      if (!reviewId) return null;
      const response = await apiClient.get(`/reviews/${reviewId}`);
      // Transform API response - WordPress REST API may wrap response
      const review = response?.data || response;
      return {
        id: review.id,
        trip_id: review.trip_id,
        customer_name: review.customer_name || review.author_name || '',
        customer_email: review.customer_email || review.author_email || '',
        rating: review.rating,
        title: review.title || '',
        comment: review.comment || review.content || '',
        status: review.status || 'pending',
        verified: review.verified || false,
      };
    },
    enabled: isEditMode && can('yatra_view_reviews'),
  });

  // Load review data into form when editing
  useEffect(() => {
    if (reviewData && isEditMode) {
      setFormData({
        trip_id: reviewData.trip_id?.toString() || '',
        customer_name: reviewData.customer_name || '',
        customer_email: reviewData.customer_email || '',
        rating: reviewData.rating?.toString() || '5',
        title: reviewData.title || '',
        comment: reviewData.comment || '',
        status: reviewData.status || 'pending',
        verified: reviewData.verified || false,
      });
    }
  }, [reviewData, isEditMode]);

  const handleFieldChange = (field: keyof ReviewFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleFieldChange('rating', star.toString())}
            className="focus:outline-none"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600 hover:fill-yellow-200 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{rating} {__('stars', 'yatra')}</span>
      </div>
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.trip_id) {
      newErrors.trip_id = __('Trip is required', 'yatra');
    }

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = __('Customer name is required', 'yatra');
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = __('Email is required', 'yatra');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = __('Invalid email address', 'yatra');
    }

    if (!formData.rating || parseInt(formData.rating) < 1 || parseInt(formData.rating) > 5) {
      newErrors.rating = __('Rating must be between 1 and 5', 'yatra');
    }

    if (!formData.title.trim()) {
      newErrors.title = __('Review title is required', 'yatra');
    }

    if (!formData.comment.trim()) {
      newErrors.comment = __('Review comment is required', 'yatra');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const payload = {
        trip_id: parseInt(data.trip_id),
        customer_name: data.customer_name.trim(),
        customer_email: data.customer_email.trim(),
        rating: parseInt(data.rating),
        title: data.title.trim(),
        comment: data.comment.trim(),
        status: data.status,
        verified: data.verified,
      };

      if (isEditMode && reviewId) {
        return await apiClient.put(`/reviews/${reviewId}`, payload);
      } else {
        return await apiClient.post('/reviews', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      // Redirect to reviews list
      window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=reviews`;
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving the review', 'yatra');
      setErrors({ submit: errorMessage });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    saveMutation.mutate(formData);
  };

  const handleCancel = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=reviews`;
  };

  if (isEditMode && isLoadingReview) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">{__('Loading review...', 'yatra')}</span>
      </div>
    );
  }

  const trips = tripsData?.data || [];
  const currentRating = parseInt(formData.rating);

  return (
    <div className="space-y-3">
      <PageHeader
        title={isEditMode ? __('Edit Review', 'yatra') : __('Add New Review', 'yatra')}
        description={isEditMode ? __('Update review information', 'yatra') : __('Create a new customer review', 'yatra')}
        actions={
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {__('Back', 'yatra')}
          </Button>
        }
      />

      <ConditionalRender capability="yatra_edit_reviews">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Main Form Fields */}
            <div className="lg:col-span-2 space-y-3">
              {/* Review Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Review Details', 'yatra')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Trip Selection */}
                  <div>
                    <label htmlFor="trip_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Trip', 'yatra')} <span className="text-red-500">*</span>
                    </label>
                    <Select
                      id="trip_id"
                      value={formData.trip_id}
                      onChange={(e) => handleFieldChange('trip_id', e.target.value)}
                      className={errors.trip_id ? 'border-red-500' : ''}
                      required
                    >
                      <option value="">{__('Select a trip', 'yatra')}</option>
                      {trips.map((trip: any) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.title}
                        </option>
                      ))}
                    </Select>
                    {errors.trip_id && (
                      <p className="mt-1 text-sm text-red-500">{errors.trip_id}</p>
                    )}
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Rating', 'yatra')} <span className="text-red-500">*</span>
                    </label>
                    {renderStarRating(currentRating)}
                    {errors.rating && (
                      <p className="mt-1 text-sm text-red-500">{errors.rating}</p>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Review Title', 'yatra')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      placeholder={__('Enter review title', 'yatra')}
                      className={errors.title ? 'border-red-500' : ''}
                      required
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Review Comment', 'yatra')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="comment"
                      value={formData.comment}
                      onChange={(e) => handleFieldChange('comment', e.target.value)}
                      placeholder={__('Enter review comment', 'yatra')}
                      rows={6}
                      className={`flex w-full rounded-md border ${errors.comment ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none`}
                      required
                    />
                    {errors.comment && (
                      <p className="mt-1 text-sm text-red-500">{errors.comment}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Customer Information', 'yatra')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Customer Name */}
                    <div>
                      <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Customer Name', 'yatra')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="customer_name"
                        type="text"
                        value={formData.customer_name}
                        onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                        placeholder={__('Enter customer name', 'yatra')}
                        className={errors.customer_name ? 'border-red-500' : ''}
                        required
                      />
                      {errors.customer_name && (
                        <p className="mt-1 text-sm text-red-500">{errors.customer_name}</p>
                      )}
                    </div>

                    {/* Customer Email */}
                    <div>
                      <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Customer Email', 'yatra')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="customer_email"
                        type="email"
                        value={formData.customer_email}
                        onChange={(e) => handleFieldChange('customer_email', e.target.value)}
                        placeholder={__('customer@example.com', 'yatra')}
                        className={errors.customer_email ? 'border-red-500' : ''}
                        required
                      />
                      {errors.customer_email && (
                        <p className="mt-1 text-sm text-red-500">{errors.customer_email}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Status', 'yatra')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Review Status', 'yatra')}
                    </label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                    >
                      <option value="pending">{__('Pending', 'yatra')}</option>
                      <option value="approved">{__('Approved', 'yatra')}</option>
                      <option value="spam">{__('Spam', 'yatra')}</option>
                      <option value="trash">{__('Trash', 'yatra')}</option>
                    </Select>
                  </div>

                  {/* Verified */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="verified"
                      checked={formData.verified}
                      onChange={(e) => handleFieldChange('verified', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="verified" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {__('Verified Purchase', 'yatra')}
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Actions */}
              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {errors.submit && (
                      <div className="p-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                        {errors.submit}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {__('Saving...', 'yatra')}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {isEditMode ? __('Update Review', 'yatra') : __('Create Review', 'yatra')}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                      >
                        {__('Cancel', 'yatra')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </ConditionalRender>
    </div>
  );
};

export default ReviewForm;

