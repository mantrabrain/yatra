/**
 * Activity Form Page
 * Add/Edit Activity form with clean, minimal SaaS-style design
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Edit2, X } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { apiClient } from '../lib/api-client';
import { generateSlug } from '../lib/slug';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { IconPicker, IconPickerValue } from '../components/ui/icon-picker';
import { RichTextEditor } from '../components/ui/rich-text-editor';

interface ActivityFormData {
  name: string;
  slug: string;
  description: string;
  icon: {
    type: 'icon' | 'image';
    value: string;
  } | null;
  status: string;
}

const ActivityForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<ActivityFormData>({
    name: '',
    slug: '',
    description: '',
    icon: null,
    status: 'publish',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugEditable, setIsSlugEditable] = useState(false);

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const activityId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  const isEditMode = action === 'edit' && activityId !== null;

  // Fetch activity data if editing
  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['activity', activityId],
    queryFn: async () => {
      if (!activityId) return null;
      try {
        const response = await apiClient.get(`/activities/${activityId}`);
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load activity', 'yatra'), 'error');
        throw error;
      }
    },
    enabled: isEditMode && can('yatra_view_trips'),
  });

  // Load activity data into form when editing
  useEffect(() => {
    if (activityData && isEditMode) {
      setFormData({
        name: activityData.name || '',
        slug: activityData.slug || '',
        description: activityData.description || '',
        icon: (activityData.icon as IconPickerValue) || null,
        status: activityData.status || 'draft',
      });
    }
  }, [activityData, isEditMode]);

  const handleNameChange = (value: string) => {
    // Auto-generate slug from name only in ADD mode (not in EDIT mode)
    // In EDIT mode, slug only changes if user explicitly edits it
    if (!isEditMode && !isSlugEditable) {
      const newSlug = generateSlug(value);
      setFormData(prev => ({
        ...prev,
        name: value,
        slug: newSlug,
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

  const handleFieldChange = (field: keyof ActivityFormData, value: string | IconPickerValue | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = __('Name is required', 'yatra');
    }

    if (!formData.slug.trim()) {
      newErrors.slug = __('Slug is required', 'yatra');
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = __('Slug can only contain lowercase letters, numbers, and hyphens', 'yatra');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ActivityFormData) => {
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

      if (isEditMode && activityId) {
        return await apiClient.put(`/activities/${activityId}`, payload);
      } else {
        return await apiClient.post('/activities', payload);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activity', activityId] });
      showToast(
        isEditMode 
          ? __('Activity updated successfully', 'yatra')
          : __('Activity created successfully', 'yatra'),
        'success'
      );
      if (!isEditMode && response?.id) {
        const editUrl = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=activities&action=edit&id=${response.id}`;
        setTimeout(() => {
          window.location.href = editUrl;
        }, 800);
      } else {
        setIsSubmitting(false);
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving the activity', 'yatra');
      showToast(errorMessage, 'error');
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast(__('Please fix the form errors', 'yatra'), 'warning');
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    saveMutation.mutate(formData);
  };

  const handleCancel = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=activities`;
  };

  if (isEditMode && isLoadingActivity) {
    return (
      <div className="space-y-3">
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
        </div>

        {/* Form Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Fields */}
          <div className="lg:col-span-2 space-y-3">
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* Name field */}
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                {/* Slug field */}
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                {/* Description field */}
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={isEditMode ? __('Edit Activity', 'yatra') : __('Add New Activity', 'yatra')}
        description={isEditMode ? __('Update activity information', 'yatra') : __('Create a new travel activity', 'yatra')}
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

      <ConditionalRender capability="yatra_edit_trips">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Main Form Fields */}
            <div className="lg:col-span-2 space-y-3">
              {/* Basic Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Basic Information', 'yatra')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Name', 'yatra')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder={__('Enter activity name', 'yatra')}
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
                      {__('Slug', 'yatra')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="slug"
                        type="text"
                        value={formData.slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder={__('activity-slug', 'yatra')}
                        className={`pr-10 ${errors.slug ? 'border-red-500' : ''} ${!isSlugEditable ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : ''}`}
                        disabled={!isSlugEditable}
                        required
                      />
                      <button
                        type="button"
                        onClick={handleToggleSlugEdit}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded"
                        aria-label={isSlugEditable ? __('Cancel editing slug', 'yatra') : __('Edit slug', 'yatra')}
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
                        ? __('Manually editing slug. Click X to cancel and regenerate from name.', 'yatra')
                        : __('Auto-generated from name. Click edit icon to customize.', 'yatra')
                      }
                    </p>
                  </div>

                  {/* Description */}
                  <RichTextEditor
                    label={__('Description', 'yatra')}
                    value={formData.description || ''}
                    onChange={(value) => handleFieldChange('description', value)}
                    placeholder={__('Write a rich description (supports formatting, lists, links...)', 'yatra')}
                    helperText={__('Use formatting, bullet lists, and links to create a compelling description. HTML is supported.', 'yatra')}
                    minHeight={360}
                    maxHeight={720}
                  />
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
                      {__('Status', 'yatra')}
                    </label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                    >
                      <option value="draft">{__('Draft', 'yatra')}</option>
                      <option value="publish">{__('Publish', 'yatra')}</option>
                      <option value="trash">{__('Trash', 'yatra')}</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Icon/Image Picker */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Activity Icon or Image', 'yatra')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <IconPicker
                    value={formData.icon}
                    onChange={(value) => handleFieldChange('icon', value)}
                    label={__('Select Icon or Upload Image', 'yatra')}
                    helpText={__('Choose a library icon or upload a custom image to visually represent this activity.', 'yatra')}
                    allowImageUpload={true}
                    allowIconSelection={true}
                    size="md"
                  />
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
                            {__('Saving...', 'yatra')}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {isEditMode ? __('Update Activity', 'yatra') : __('Create Itinerary Activity', 'yatra')}
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

export default ActivityForm;

