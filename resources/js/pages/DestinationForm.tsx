/**
 * Destination Form Page
 * Add/Edit Destination form with clean, minimal SaaS-style design
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Edit2, X } from 'lucide-react';
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

interface DestinationFormData {
  name: string;
  slug: string;
  description: string;
  icon: {
    type: 'icon' | 'image';
    value: string;
  } | null;
  status: string;
}

const DestinationForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<DestinationFormData>({
    name: '',
    slug: '',
    description: '',
    icon: null,
    status: 'draft',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugEditable, setIsSlugEditable] = useState(false);

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const destinationId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  const isEditMode = action === 'edit' && destinationId !== null;

  // Fetch destination data if editing
  const { data: destinationData, isLoading: isLoadingDestination } = useQuery({
    queryKey: ['destination', destinationId],
    queryFn: async () => {
      if (!destinationId) return null;
      try {
        const response = await apiClient.get(`/destinations/${destinationId}`);
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load destination', 'Failed to load destination'), 'error');
        throw error;
      }
    },
    enabled: isEditMode && can('yatra_view_trips'),
  });

  // Load destination data into form when editing
  useEffect(() => {
    if (destinationData && isEditMode) {
      setFormData({
        name: destinationData.name || '',
        slug: destinationData.slug || '',
        description: destinationData.description || '',
        icon: (destinationData.icon as IconPickerValue) || null,
        status: destinationData.status || 'draft',
      });
    }
  }, [destinationData, isEditMode]);

  const handleNameChange = (value: string) => {
    // Auto-generate slug from name (only if slug is not manually edited)
    if (!isSlugEditable) {
      const newSlug = generateSlug(value);
      setFormData(prev => ({
        ...prev,
        name: value,
        slug: newSlug, // Always auto-generate slug from name
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        name: value,
      }));
    }
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
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
      // If disabling edit, regenerate slug from name
      const newSlug = generateSlug(formData.name);
      setFormData(prev => ({ ...prev, slug: newSlug }));
    }
    setIsSlugEditable(!isSlugEditable);
  };

  const handleFieldChange = (field: keyof DestinationFormData, value: string | IconPickerValue | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = __('Name is required', 'Name is required');
    }

    if (!formData.slug.trim()) {
      newErrors.slug = __('Slug is required', 'Slug is required');
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = __('Slug can only contain lowercase letters, numbers, and hyphens', 'Slug can only contain lowercase letters, numbers, and hyphens');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: DestinationFormData) => {
      const payload: any = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        icon: data.icon,
        status: data.status,
      };

      // If slug was manually edited, add flag to preserve it
      if (isEditMode && isSlugEditable) {
        payload.preserve_slug = true;
      }

      if (isEditMode && destinationId) {
        return await apiClient.put(`/destinations/${destinationId}`, payload);
      } else {
        return await apiClient.post('/destinations', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      queryClient.invalidateQueries({ queryKey: ['destination', destinationId] });
      showToast(
        isEditMode 
          ? __('Destination updated successfully', 'Destination updated successfully')
          : __('Destination created successfully', 'Destination created successfully'),
        'success'
      );
      // Redirect to destinations list after a short delay
      setTimeout(() => {
        window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=destinations`;
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving the destination', 'An error occurred while saving the destination');
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
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=destinations`;
  };

  if (isEditMode && isLoadingDestination) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">{__('Loading destination...', 'Loading destination...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={isEditMode ? __('Edit Destination', 'Edit Destination') : __('Add New Destination', 'Add New Destination')}
        description={isEditMode ? __('Update destination information', 'Update destination information') : __('Create a new travel destination', 'Create a new travel destination')}
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
                  <CardTitle className="text-base">{__('Basic Information', 'Basic Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Name', 'Name')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder={__('Enter destination name', 'Enter destination name')}
                      className={errors.name ? 'border-red-500' : ''}
                      required
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
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
                        placeholder={__('destination-slug', 'destination-slug')}
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
                        ? __('Manually editing slug. Click X to cancel and regenerate from name.', 'Manually editing slug. Click X to cancel and regenerate from name.')
                        : __('Auto-generated from name. Click edit icon to customize.', 'Auto-generated from name. Click edit icon to customize.')
                      }
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Description', 'Description')}
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder={__('Enter destination description', 'Enter destination description')}
                      rows={6}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>

                  {/* Icon/Image Picker */}
                  <div>
                    <IconPicker
                      value={formData.icon}
                      onChange={(value) => handleFieldChange('icon', value)}
                      label={__('Destination Icon or Image', 'Destination Icon or Image')}
                      helpText={__('Select an icon from the library or upload a custom image for this destination.', 'Select an icon from the library or upload a custom image for this destination.')}
                      allowImageUpload={true}
                      allowIconSelection={true}
                      size="md"
                    />
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
                      {__('Status', 'Status')}
                    </label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                      className="h-9"
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
                            {isEditMode ? __('Update Destination', 'Update Destination') : __('Create Destination', 'Create Destination')}
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

export default DestinationForm;
