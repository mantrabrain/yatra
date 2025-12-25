/**
 * Traveler Category Form Page
 * Add/Edit Traveler Category form with clean, minimal SaaS-style design
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Edit2, X, AlertCircle } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { apiClient } from '../lib/api';
import { generateSlug } from '../lib/slug';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { IconPicker, IconPickerValue } from '../components/ui/icon-picker';
import { Skeleton } from '../components/ui/skeleton';
import { HelpText } from '../components/ui/help-text';

interface TravelerCategoryFormData {
  label: string;
  slug: string;
  description: string;
  age_min: string;
  age_max: string;
  icon: {
    type: 'icon' | 'image';
    value: string;
  } | null;
  status: 'draft' | 'publish' | 'trash';
  pricing_mode: 'per_person' | 'per_group';
  min_pax: string;
  max_pax: string;
}

const TravelerCategoryForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<TravelerCategoryFormData>({
    label: '',
    slug: '',
    description: '',
    age_min: '',
    age_max: '',
    icon: null,
    status: 'publish',
    pricing_mode: 'per_person',
    min_pax: '',
    max_pax: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugEditable, setIsSlugEditable] = useState(false);

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const categoryId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  const isEditMode = action === 'edit' && categoryId !== null;

  // Fetch category data if editing
  const { data: categoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['traveler-category', categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      try {
        const response = await apiClient.get(`/traveler-categories/${categoryId}`);
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load traveler category', 'Failed to load traveler category'), 'error');
        throw error;
      }
    },
    enabled: isEditMode && can('yatra_view_trips'),
  });

  // Load category data into form when editing
  useEffect(() => {
    if (categoryData && isEditMode) {
      setFormData({
        label: categoryData.label || '',
        slug: categoryData.slug || '',
        description: categoryData.description || '',
        age_min: categoryData.age_min?.toString() || '',
        age_max: categoryData.age_max?.toString() || '',
        icon: (categoryData.icon as IconPickerValue) || null,
        status: categoryData.status || 'draft',
        pricing_mode: (categoryData.pricing_mode as 'per_person' | 'per_group') || 'per_person',
        min_pax: categoryData.min_pax !== undefined && categoryData.min_pax !== null ? categoryData.min_pax.toString() : '',
        max_pax: categoryData.max_pax !== undefined && categoryData.max_pax !== null ? categoryData.max_pax.toString() : '',
      });
    }
  }, [categoryData, isEditMode]);

  const handleLabelChange = (value: string) => {
    // Auto-generate slug from label only on create (and when slug is not manually edited)
    if (!isEditMode && !isSlugEditable) {
      const newSlug = generateSlug(value);
      setFormData(prev => ({
        ...prev,
        label: value,
        slug: newSlug,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        label: value,
      }));
    }
    if (errors.label) {
      setErrors(prev => ({ ...prev, label: '' }));
    }
  };

  const handleSlugChange = (value: string) => {
    // Only allow manual slug editing if edit mode is enabled
    if (isSlugEditable) {
      setFormData(prev => ({ ...prev, slug: value }));
      if (errors.slug) {
        setErrors(prev => ({ ...prev, slug: '' }));
      }
    }
  };

  const handleToggleSlugEdit = () => {
    if (isSlugEditable) {
      // If disabling edit, regenerate slug from label
      const newSlug = generateSlug(formData.label);
      setFormData(prev => ({ ...prev, slug: newSlug }));
    }
    setIsSlugEditable(!isSlugEditable);
  };

  const handleFieldChange = (field: keyof TravelerCategoryFormData, value: string | IconPickerValue | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.label.trim()) {
      newErrors.label = __('Label is required', 'Label is required');
    }

    if (!formData.slug.trim()) {
      newErrors.slug = __('Slug is required', 'Slug is required');
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = __('Slug can only contain lowercase letters, numbers, and hyphens', 'Slug can only contain lowercase letters, numbers, and hyphens');
    }

    if (!formData.description.trim()) {
      newErrors.description = __('Description is required', 'Description is required');
    }

    // Validate age range
    if (formData.age_min && isNaN(parseInt(formData.age_min))) {
      newErrors.age_min = __('Minimum age must be a valid number', 'Minimum age must be a valid number');
    }
    if (formData.age_max && isNaN(parseInt(formData.age_max))) {
      newErrors.age_max = __('Maximum age must be a valid number', 'Maximum age must be a valid number');
    }
    if (formData.age_min && formData.age_max && parseInt(formData.age_min) >= parseInt(formData.age_max)) {
      newErrors.age_max = __('Maximum age must be greater than minimum age', 'Maximum age must be greater than minimum age');
    }

    // Validate group size when pricing_mode is per_group
    if (formData.pricing_mode === 'per_group') {
      if (formData.min_pax && isNaN(parseInt(formData.min_pax))) {
        newErrors.min_pax = __('Minimum group size must be a valid number', 'Minimum group size must be a valid number');
      }
      if (formData.max_pax && isNaN(parseInt(formData.max_pax))) {
        newErrors.max_pax = __('Maximum group size must be a valid number', 'Maximum group size must be a valid number');
      }
      if (
        formData.min_pax &&
        formData.max_pax &&
        !isNaN(parseInt(formData.min_pax)) &&
        !isNaN(parseInt(formData.max_pax)) &&
        parseInt(formData.min_pax) > parseInt(formData.max_pax)
      ) {
        newErrors.max_pax = __('Maximum group size should be greater than or equal to minimum group size', 'Maximum group size should be greater than or equal to minimum group size');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: TravelerCategoryFormData) => {
      const payload: any = {
        label: data.label.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        icon: data.icon,
        status: data.status,
      };

      // Handle age_min
      if (data.age_min && data.age_min.trim() !== '') {
        payload.age_min = parseInt(data.age_min);
      } else {
        payload.age_min = null;
      }

      // Handle age_max
      if (data.age_max && data.age_max.trim() !== '') {
        payload.age_max = parseInt(data.age_max);
      } else {
        payload.age_max = null;
      }

      // Pricing mode and group size
      payload.pricing_mode = data.pricing_mode || 'per_person';

      if (data.pricing_mode === 'per_group') {
        if (data.min_pax && data.min_pax.trim() !== '') {
          payload.min_pax = parseInt(data.min_pax);
        } else {
          payload.min_pax = null;
        }

        if (data.max_pax && data.max_pax.trim() !== '') {
          payload.max_pax = parseInt(data.max_pax);
        } else {
          payload.max_pax = null;
        }
      } else {
        payload.min_pax = null;
        payload.max_pax = null;
      }

      // If slug was manually edited, add flag to preserve it
      if (isEditMode && isSlugEditable) {
        payload.preserve_slug = true;
      }

      if (isEditMode && categoryId) {
        return await apiClient.put(`/traveler-categories/${categoryId}`, payload);
      } else {
        return await apiClient.post('/traveler-categories', payload);
      }
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['traveler-categories'] });
      queryClient.invalidateQueries({ queryKey: ['traveler-category', categoryId] });
      showToast(
        isEditMode 
          ? __('Traveler category updated successfully', 'Traveler category updated successfully')
          : __('Traveler category created successfully', 'Traveler category created successfully'),
        'success'
      );
      if (!isEditMode) {
        const newId = response?.id || response?.data?.id;
        if (newId) {
          setTimeout(() => {
            window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=traveler-categories&action=edit&id=${newId}`;
          }, 800);
        }
      } else {
        setIsSubmitting(false);
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving the traveler category', 'An error occurred while saving the traveler category');
      showToast(errorMessage, 'error');
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast(__('Please fix the form errors', 'Please fix the form errors'), 'warning');
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    saveMutation.mutate(formData);
  };

  const handleCancel = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=traveler-categories`;
  };

  if (isEditMode && isLoadingCategory) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__('Edit Category', 'Edit Category')}
          description={__('Update traveler category information', 'Update traveler category information')}
          actions={
            <Skeleton className="w-24 h-9 rounded-md" />
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((section) => (
                  <div key={section} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map((card) => (
              <Card key={card}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-36" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={isEditMode ? __('Edit Category', 'Edit Category') : __('Add Category', 'Add Category')}
        description={isEditMode ? __('Update traveler category information', 'Update traveler category information') : __('Create a new traveler category for pricing', 'Create a new traveler category for pricing')}
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

      <ConditionalRender capability="yatra_edit_trips">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Main Form Fields */}
            <div className="lg:col-span-2 space-y-3">
              {/* Basic Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Category Information', 'Category Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Label */}
                  <div>
                    <label htmlFor="label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Category Label', 'Category Label')} <span className="text-red-500">*</span>
                    </label>
                    <HelpText
                      text={__('The name of this traveler category (e.g., Adult, Child, Senior, Student)', 'The name of this traveler category (e.g., Adult, Child, Senior, Student)')}
                      className="mb-2"
                    />
                    <Input
                      id="label"
                      type="text"
                      value={formData.label}
                      onChange={(e) => handleLabelChange(e.target.value)}
                      placeholder={__('e.g., Adult', 'e.g., Adult')}
                      className={errors.label ? 'border-red-500' : ''}
                      required
                    />
                    {errors.label && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.label}
                      </p>
                    )}
                  </div>

                  {/* Slug */}
                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Slug', 'Slug')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="slug"
                        type="text"
                        value={formData.slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder={__('category-slug', 'category-slug')}
                        className={`pr-10 ${errors.slug ? 'border-red-500' : ''} ${!isSlugEditable ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : ''}`}
                        disabled={!isSlugEditable}
                        required
                      />
                      <button
                        type="button"
                        onClick={handleToggleSlugEdit}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded"
                        aria-label={isSlugEditable ? __('Cancel editing slug', 'Cancel editing slug') : __('Edit slug', 'Edit slug')}
                      >
                        {isSlugEditable ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Edit2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.slug && (
                      <p className="mt-1 text-sm text-red-500">{errors.slug}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {isSlugEditable 
                        ? __('Manually editing slug. Click X to cancel and regenerate from label.', 'Manually editing slug. Click X to cancel and regenerate from label.')
                        : __('Auto-generated from label. Click edit icon to customize.', 'Auto-generated from label. Click edit icon to customize.')
                      }
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Description', 'Description')} <span className="text-red-500">*</span>
                    </label>
                    <HelpText
                      text={__('A brief description of this category and who it applies to', 'A brief description of this category and who it applies to')}
                      className="mb-2"
                    />
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder={__('e.g., Standard adult pricing for travelers aged 18 and above', 'e.g., Standard adult pricing for travelers aged 18 and above')}
                      rows={3}
                      className={`flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none ${errors.description ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.description && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Age Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Age Range', 'Age Range')}
                    </label>
                    <HelpText
                      text={__('Specify the age range for this category (e.g., 0-4 for Infant, 5-17 for Child, 18+ for Adult). Leave empty if no age restriction.', 'Specify the age range for this category (e.g., 0-4 for Infant, 5-17 for Child, 18+ for Adult). Leave empty if no age restriction.')}
                      className="mb-2"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="age_min" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          {__('Minimum Age', 'Minimum Age')}
                        </label>
                        <Input
                          id="age_min"
                          type="number"
                          min="0"
                          value={formData.age_min}
                          onChange={(e) => handleFieldChange('age_min', e.target.value)}
                          placeholder={__('e.g., 0, 5, 18', 'e.g., 0, 5, 18')}
                          className={errors.age_min ? 'border-red-500' : ''}
                        />
                        {errors.age_min && (
                          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.age_min}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="age_max" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          {__('Maximum Age', 'Maximum Age')}
                        </label>
                        <Input
                          id="age_max"
                          type="number"
                          min="0"
                          value={formData.age_max}
                          onChange={(e) => handleFieldChange('age_max', e.target.value)}
                          placeholder={__('e.g., 4, 17, leave empty for 18+', 'e.g., 4, 17, leave empty for 18+')}
                          className={errors.age_max ? 'border-red-500' : ''}
                        />
                        {errors.age_max && (
                          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.age_max}
                          </p>
                        )}
                      </div>
                    </div>
                    {formData.age_min && formData.age_max && parseInt(formData.age_min) >= parseInt(formData.age_max) && (
                      <p className="mt-1.5 text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {__('Minimum age should be less than maximum age', 'Minimum age should be less than maximum age')}
                      </p>
                    )}
                  </div>

                  {/* Pricing Mode & Group Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Pricing Mode', 'Pricing Mode')}
                    </label>
                    <HelpText
                      text={__('Choose how this traveler category is priced. Per person charges per traveler, while per group uses a flat price for a group booking.', 'Choose how this traveler category is priced. Per person charges per traveler, while per group uses a flat price for a group booking.')}
                      className="mb-2"
                    />
                    <Select
                      id="pricing_mode"
                      value={formData.pricing_mode}
                      onChange={(e) => handleFieldChange('pricing_mode', e.target.value as 'per_person' | 'per_group')}
                    >
                      <option value="per_person">{__('Per person', 'Per person')}</option>
                      <option value="per_group">{__('Per group', 'Per group')}</option>
                    </Select>

                    {formData.pricing_mode === 'per_group' && (
                      <div className="mt-3 space-y-2">
                        <HelpText
                          text={__('Optional group size limits for this category. These are used to validate bookings when this category is priced per group.', 'Optional group size limits for this category. These are used to validate bookings when this category is priced per group.')}
                          className="mb-1"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="min_pax" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                              {__('Minimum Group Size', 'Minimum Group Size')}
                            </label>
                            <Input
                              id="min_pax"
                              type="number"
                              min="1"
                              value={formData.min_pax}
                              onChange={(e) => handleFieldChange('min_pax', e.target.value)}
                              placeholder={__('e.g., 2', 'e.g., 2')}
                              className={errors.min_pax ? 'border-red-500' : ''}
                            />
                            {errors.min_pax && (
                              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {errors.min_pax}
                              </p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="max_pax" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                              {__('Maximum Group Size', 'Maximum Group Size')}
                            </label>
                            <Input
                              id="max_pax"
                              type="number"
                              min="1"
                              value={formData.max_pax}
                              onChange={(e) => handleFieldChange('max_pax', e.target.value)}
                              placeholder={__('e.g., 6 (optional)', 'e.g., 6 (optional)')}
                              className={errors.max_pax ? 'border-red-500' : ''}
                            />
                            {errors.max_pax && (
                              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {errors.max_pax}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Icon/Image Picker */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Category Icon or Image', 'Category Icon or Image')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <IconPicker
                    value={formData.icon}
                    onChange={(value) => handleFieldChange('icon', value)}
                    label={undefined}
                    helpText={__('Select an icon from the library or upload a custom image for this category.', 'Select an icon from the library or upload a custom image for this category.')}
                    allowImageUpload={true}
                    allowIconSelection={true}
                    size="md"
                  />
                </CardContent>
              </Card>

              {/* Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Status', 'Status')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Status', 'Status')}
                    </label>
                    <HelpText
                      text={__('Draft categories will not be available when creating trips', 'Draft categories will not be available when creating trips')}
                      className="mb-2"
                    />
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value as 'draft' | 'publish' | 'trash')}
                    >
                      <option value="draft">{__('Draft', 'Draft')}</option>
                      <option value="publish">{__('Publish', 'Publish')}</option>
                      <option value="trash">{__('Trash', 'Trash')}</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Actions */}
              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
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
                            {isEditMode ? __('Update Category', 'Update Category') : __('Create Category', 'Create Category')}
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

export default TravelerCategoryForm;
