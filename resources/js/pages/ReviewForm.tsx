/**
 * Review Form Page
 * Add/Edit Review form with clean, minimal SaaS-style design
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Star } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
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
      // return await apiClient.get('/yatra/v1/trips', { params: { per_page: 100 } });
      // Dummy trips data
      return {
        data: [
          { id: 1, title: 'Everest Base Camp Trek' },
          { id: 2, title: 'Annapurna Circuit Adventure' },
          { id: 3, title: 'Golden Triangle Tour' },
          { id: 4, title: 'Bhutan Cultural Journey' },
          { id: 5, title: 'Tibet Spiritual Tour' },
          { id: 6, title: 'Langtang Valley Trek' },
          { id: 7, title: 'Manaslu Circuit Trek' },
          { id: 8, title: 'Upper Mustang Trek' },
        ],
      };
    },
    enabled: can('yatra_view_trips'),
  });

  // Fetch review data if editing
  const { data: reviewData, isLoading: isLoadingReview } = useQuery({
    queryKey: ['review', reviewId],
    queryFn: async () => {
      if (!reviewId) return null;
      // return await apiClient.get(`/reviews/${reviewId}`);
      // Dummy data for now
      return {
        id: reviewId,
        trip_id: 1,
        customer_name: 'John Smith',
        customer_email: 'john.smith@example.com',
        rating: 5,
        title: 'Amazing Experience!',
        comment: 'This was the trip of a lifetime. The guides were knowledgeable and the scenery was breathtaking.',
        status: 'approved',
        verified: true,
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
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{rating} {__('stars', 'stars')}</span>
      </div>
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.trip_id) {
      newErrors.trip_id = __('Trip is required', 'Trip is required');
    }

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = __('Customer name is required', 'Customer name is required');
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = __('Email is required', 'Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = __('Invalid email address', 'Invalid email address');
    }

    if (!formData.rating || parseInt(formData.rating) < 1 || parseInt(formData.rating) > 5) {
      newErrors.rating = __('Rating must be between 1 and 5', 'Rating must be between 1 and 5');
    }

    if (!formData.title.trim()) {
      newErrors.title = __('Review title is required', 'Review title is required');
    }

    if (!formData.comment.trim()) {
      newErrors.comment = __('Review comment is required', 'Review comment is required');
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
        // return await apiClient.put(`/reviews/${reviewId}`, payload);
        console.log('Updating review:', reviewId, payload);
        return { success: true, id: reviewId };
      } else {
        // return await apiClient.post('/reviews', payload);
        console.log('Creating review:', payload);
        return { success: true, id: Math.floor(Math.random() * 1000) };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      // Redirect to reviews list
      window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=reviews`;
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving the review', 'An error occurred while saving the review');
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
        <span className="ml-2 text-gray-600 dark:text-gray-400">{__('Loading review...', 'Loading review...')}</span>
      </div>
    );
  }

  const trips = tripsData?.data || [];
  const currentRating = parseInt(formData.rating);

  return (
    <div className="space-y-3">
      <PageHeader
        title={isEditMode ? __('Edit Review', 'Edit Review') : __('Add New Review', 'Add New Review')}
        description={isEditMode ? __('Update review information', 'Update review information') : __('Create a new customer review', 'Create a new customer review')}
        actions={
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {__('Back', 'Back')}
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
                  <CardTitle className="text-base">{__('Review Details', 'Review Details')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Trip Selection */}
                  <div>
                    <label htmlFor="trip_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Trip', 'Trip')} <span className="text-red-500">*</span>
                    </label>
                    <Select
                      id="trip_id"
                      value={formData.trip_id}
                      onChange={(e) => handleFieldChange('trip_id', e.target.value)}
                      className={errors.trip_id ? 'border-red-500' : ''}
                      required
                    >
                      <option value="">{__('Select a trip', 'Select a trip')}</option>
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
                      {__('Rating', 'Rating')} <span className="text-red-500">*</span>
                    </label>
                    {renderStarRating(currentRating)}
                    {errors.rating && (
                      <p className="mt-1 text-sm text-red-500">{errors.rating}</p>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Review Title', 'Review Title')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      placeholder={__('Enter review title', 'Enter review title')}
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
                      {__('Review Comment', 'Review Comment')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="comment"
                      value={formData.comment}
                      onChange={(e) => handleFieldChange('comment', e.target.value)}
                      placeholder={__('Enter review comment', 'Enter review comment')}
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
                  <CardTitle className="text-base">{__('Customer Information', 'Customer Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Customer Name */}
                    <div>
                      <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Customer Name', 'Customer Name')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="customer_name"
                        type="text"
                        value={formData.customer_name}
                        onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                        placeholder={__('Enter customer name', 'Enter customer name')}
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
                        {__('Customer Email', 'Customer Email')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="customer_email"
                        type="email"
                        value={formData.customer_email}
                        onChange={(e) => handleFieldChange('customer_email', e.target.value)}
                        placeholder={__('customer@example.com', 'customer@example.com')}
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
                  <CardTitle className="text-base">{__('Status', 'Status')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Review Status', 'Review Status')}
                    </label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                      className="h-9"
                    >
                      <option value="pending">{__('Pending', 'Pending')}</option>
                      <option value="approved">{__('Approved', 'Approved')}</option>
                      <option value="spam">{__('Spam', 'Spam')}</option>
                      <option value="trash">{__('Trash', 'Trash')}</option>
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
                      {__('Verified Purchase', 'Verified Purchase')}
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
                            {__('Saving...', 'Saving...')}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {isEditMode ? __('Update Review', 'Update Review') : __('Create Review', 'Create Review')}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                      >
                        {__('Cancel', 'Cancel')}
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

