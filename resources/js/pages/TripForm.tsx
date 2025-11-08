/**
 * Trip Form Page
 * Add/Edit Trip form with clean, minimal SaaS-style design
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
// import { apiClient } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { HelpText } from '../components/ui/help-text';
import { Alert } from '../components/ui/alert';

interface TripFormData {
  title: string;
  slug: string;
  description: string;
  price: string;
  status: string;
}

const TripForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [formData, setFormData] = useState<TripFormData>({
    title: '',
    slug: '',
    description: '',
    price: '',
    status: 'draft',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const tripId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  const isEditMode = action === 'edit' && tripId !== null;

  // Fetch trip data if editing
  const { data: tripData, isLoading: isLoadingTrip } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      if (!tripId) return null;
      // return await apiClient.get(`/trips/${tripId}`);
      // Dummy data for now
      return {
        id: tripId,
        title: 'Sample Trip',
        slug: 'sample-trip',
        description: 'This is a sample trip description.',
        price: 1000,
        status: 'active',
      };
    },
    enabled: isEditMode && can('yatra_view_trips'),
  });

  // Load trip data into form when editing
  useEffect(() => {
    if (tripData && isEditMode) {
      setFormData({
        title: tripData.title || '',
        slug: tripData.slug || '',
        description: tripData.description || '',
        price: tripData.price?.toString() || '',
        status: tripData.status || 'draft',
      });
    }
  }, [tripData, isEditMode]);

  // Auto-generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: prev.slug || generateSlug(value),
    }));
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: '' }));
    }
  };

  const handleSlugChange = (value: string) => {
    setFormData(prev => ({ ...prev, slug: value }));
    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: '' }));
    }
  };

  const handleFieldChange = (field: keyof TripFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = __('Title is required', 'Title is required');
    }

    if (!formData.slug.trim()) {
      newErrors.slug = __('Slug is required', 'Slug is required');
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = __('Slug can only contain lowercase letters, numbers, and hyphens', 'Slug can only contain lowercase letters, numbers, and hyphens');
    }

    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = __('Price must be a valid number', 'Price must be a valid number');
    } else if (formData.price && parseFloat(formData.price) < 0) {
      newErrors.price = __('Price cannot be negative', 'Price cannot be negative');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: TripFormData) => {
      const payload = {
        title: data.title.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        price: data.price ? parseFloat(data.price) : 0,
        status: data.status,
      };

      if (isEditMode && tripId) {
        // return await apiClient.put(`/trips/${tripId}`, payload);
        console.log('Updating trip:', tripId, payload);
        return { success: true, id: tripId };
      } else {
        // return await apiClient.post('/trips', payload);
        console.log('Creating trip:', payload);
        return { success: true, id: Math.floor(Math.random() * 1000) };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      // Redirect to trips list
      window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=all`;
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving the trip', 'An error occurred while saving the trip');
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
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=all`;
  };

  if (isEditMode && isLoadingTrip) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">{__('Loading trip...', 'Loading trip...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={isEditMode ? __('Edit Trip', 'Edit Trip') : __('Add New Trip', 'Add New Trip')}
        description={isEditMode ? __('Update trip information', 'Update trip information') : __('Create a new travel package or tour', 'Create a new travel package or tour')}
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

      <ConditionalRender capability={isEditMode ? 'yatra_edit_trips' : 'yatra_edit_trips'}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Main Form Fields */}
            <div className="lg:col-span-2 space-y-3">
              {/* Basic Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Basic Information', 'Basic Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Trip Title', 'Trip Title')} <span className="text-red-500">*</span>
                    </label>
                    <HelpText 
                      text={__('Enter a clear, descriptive name for your trip. This will be displayed to customers on your website.', 'Enter a clear, descriptive name for your trip. This will be displayed to customers on your website.')}
                      className="mb-2"
                    />
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder={__('e.g., Everest Base Camp Trek', 'e.g., Everest Base Camp Trek')}
                      className={errors.title ? 'border-red-500' : ''}
                      required
                    />
                    {errors.title && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Slug */}
                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('URL Slug', 'URL Slug')} <span className="text-red-500">*</span>
                    </label>
                    <HelpText 
                      text={__('This creates the web address for your trip page. It\'s automatically generated from the title, but you can edit it. Use only lowercase letters, numbers, and hyphens.', 'This creates the web address for your trip page. It\'s automatically generated from the title, but you can edit it. Use only lowercase letters, numbers, and hyphens.')}
                      className="mb-2"
                    />
                    <Input
                      id="slug"
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder={__('everest-base-camp-trek', 'everest-base-camp-trek')}
                      className={errors.slug ? 'border-red-500' : ''}
                      required
                    />
                    {errors.slug && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.slug}
                      </p>
                    )}
                    {!errors.slug && formData.slug && (
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {__('URL will be:', 'URL will be:')} <span className="font-mono text-blue-600 dark:text-blue-400">/trips/{formData.slug}</span>
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Trip Description', 'Trip Description')}
                    </label>
                    <HelpText 
                      text={__('Describe your trip in detail. Include highlights, itinerary, what\'s included, and what makes it special. This helps customers understand and choose your trip.', 'Describe your trip in detail. Include highlights, itinerary, what\'s included, and what makes it special. This helps customers understand and choose your trip.')}
                      className="mb-2"
                    />
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder={__('Write a detailed description of your trip... Include highlights, itinerary, inclusions, and what makes it special.', 'Write a detailed description of your trip... Include highlights, itinerary, inclusions, and what makes it special.')}
                      rows={8}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {formData.description.length} {__('characters', 'characters')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Pricing & Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Pricing & Status', 'Pricing & Status')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Price */}
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Price per Person', 'Price per Person')} (USD)
                    </label>
                    <HelpText 
                      text={__('Enter the price for one person. This is the base price customers will see. You can add additional pricing options later.', 'Enter the price for one person. This is the base price customers will see. You can add additional pricing options later.')}
                      className="mb-2"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => handleFieldChange('price', e.target.value)}
                        placeholder="0.00"
                        className={`pl-7 ${errors.price ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.price && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.price}
                      </p>
                    )}
                    {!errors.price && formData.price && (
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {__('Customers will see:', 'Customers will see:')} <span className="font-semibold text-gray-900 dark:text-white">${parseFloat(formData.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> {__('per person', 'per person')}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Trip Status', 'Trip Status')}
                    </label>
                    <HelpText 
                      text={__('Draft: Not visible to customers. Active: Visible and bookable. Inactive: Hidden from customers.', 'Draft: Not visible to customers. Active: Visible and bookable. Inactive: Hidden from customers.')}
                      className="mb-2"
                    />
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                      className="h-9"
                    >
                      <option value="draft">{__('Draft', 'Draft')} - {__('Not published', 'Not published')}</option>
                      <option value="active">{__('Active', 'Active')} - {__('Visible to customers', 'Visible to customers')}</option>
                      <option value="inactive">{__('Inactive', 'Inactive')} - {__('Hidden from customers', 'Hidden from customers')}</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Actions */}
              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {errors.submit && (
                      <Alert variant="error" title={__('Error', 'Error')}>
                        {errors.submit}
                      </Alert>
                    )}
                    {!isEditMode && (
                      <Alert variant="info" className="mb-2">
                        <strong>{__('Tip:', 'Tip:')}</strong> {__('You can save as Draft first, then activate when ready. Customers won\'t see Draft trips.', 'You can save as Draft first, then activate when ready. Customers won\'t see Draft trips.')}
                      </Alert>
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
                            {isEditMode ? __('Update Trip', 'Update Trip') : __('Create Trip', 'Create Trip')}
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

export default TripForm;

