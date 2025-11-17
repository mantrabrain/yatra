/**
 * Difficulty Level Form Page
 * Add/Edit trip difficulty level
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

interface DifficultyLevelFormData {
  name: string;
  slug: string;
  description: string;
  icon: IconPickerValue | null;
  level_order: number | '';
  status: string;
}

const DifficultyLevelForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<DifficultyLevelFormData>({
    name: '',
    slug: '',
    description: '',
    icon: null,
    level_order: '',
    status: 'draft',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugEditable, setIsSlugEditable] = useState(false);

  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const levelId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0', 10) : null;
  }, []);

  const isEditMode = action === 'edit' && levelId !== null;

  const { data: levelData, isLoading: isLoadingLevel } = useQuery({
    queryKey: ['difficulty-level', levelId],
    queryFn: async () => {
      if (!levelId) return null;
      try {
        const response = await apiClient.get(`/difficulty-levels/${levelId}`);
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load difficulty level', 'Failed to load difficulty level'), 'error');
        throw error;
      }
    },
    enabled: isEditMode && can('yatra_view_trips'),
  });

  useEffect(() => {
    if (levelData && isEditMode) {
      setFormData({
        name: levelData.name || '',
        slug: levelData.slug || '',
        description: levelData.description || '',
        icon: (levelData.icon as IconPickerValue) || null,
        level_order: typeof levelData.level_order === 'number' ? levelData.level_order : '',
        status: levelData.status || 'draft',
      });
    }
  }, [levelData, isEditMode]);

  const handleNameChange = (value: string) => {
    if (!isSlugEditable) {
      const newSlug = generateSlug(value);
      setFormData(prev => ({
        ...prev,
        name: value,
        slug: newSlug,
      }));
    } else {
      setFormData(prev => ({ ...prev, name: value }));
    }
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const handleSlugChange = (value: string) => {
    if (isSlugEditable) {
      setFormData(prev => ({ ...prev, slug: value }));
      if (errors.slug) {
        setErrors(prev => ({ ...prev, slug: '' }));
      }
    }
  };

  const handleToggleSlugEdit = () => {
    if (isSlugEditable) {
      const newSlug = generateSlug(formData.name);
      setFormData(prev => ({ ...prev, slug: newSlug }));
    }
    setIsSlugEditable(!isSlugEditable);
  };

  const handleFieldChange = (field: keyof DifficultyLevelFormData, value: any) => {
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

    if (formData.level_order !== '' && Number(formData.level_order) < 0) {
      newErrors.level_order = __('Order must be a positive number', 'Order must be a positive number');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: DifficultyLevelFormData) => {
      const payload: any = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        icon: data.icon,
        level_order: data.level_order === '' ? null : Number(data.level_order),
        status: data.status,
      };

      if (isEditMode && isSlugEditable) {
        payload.preserve_slug = true;
      }

      if (isEditMode && levelId) {
        return await apiClient.put(`/difficulty-levels/${levelId}`, payload);
      }
      return await apiClient.post('/difficulty-levels', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['difficulty-levels'] });
      queryClient.invalidateQueries({ queryKey: ['difficulty-level', levelId] });
      showToast(
        isEditMode
          ? __('Difficulty level updated successfully', 'Difficulty level updated successfully')
          : __('Difficulty level created successfully', 'Difficulty level created successfully'),
        'success'
      );
      setTimeout(() => {
        window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=difficulty-levels`;
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving the difficulty level', 'An error occurred while saving the difficulty level');
      showToast(errorMessage, 'error');
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
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
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=difficulty-levels`;
  };

  if (isEditMode && isLoadingLevel) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          {__('Loading difficulty level...', 'Loading difficulty level...')}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={isEditMode ? __('Edit Difficulty Level', 'Edit Difficulty Level') : __('Add Difficulty Level', 'Add Difficulty Level')}
        description={isEditMode ? __('Update difficulty level information', 'Update difficulty level information') : __('Create a new trip difficulty level', 'Create a new trip difficulty level')}
        actions={
          <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {__('Back', 'Back')}
          </Button>
        }
      />

      <ConditionalRender capability="yatra_edit_trips">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Basic Information', 'Basic Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Name', 'Name')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder={__('Enter difficulty level name', 'Enter difficulty level name')}
                      className={errors.name ? 'border-red-500' : ''}
                      required
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                  </div>

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
                        placeholder={__('difficulty-slug', 'difficulty-slug')}
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
                        {isSlugEditable ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {isSlugEditable
                        ? __('Manually editing slug. Click X to cancel and regenerate from name.', 'Manually editing slug. Click X to cancel and regenerate from name.')
                        : __('Auto-generated from name. Click edit icon to customize.', 'Auto-generated from name. Click edit icon to customize.')}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Description', 'Description')}
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder={__('Describe this difficulty level', 'Describe this difficulty level')}
                      rows={6}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>

                  <div>
                    <IconPicker
                      value={formData.icon}
                      onChange={(value) => handleFieldChange('icon', value)}
                      label={__('Difficulty Level Icon or Image', 'Difficulty Level Icon or Image')}
                      helpText={__('Select an icon or image to visually represent this difficulty level.', 'Select an icon or image to visually represent this difficulty level.')}
                      allowImageUpload
                      allowIconSelection
                      size="md"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Ordering & Status', 'Ordering & Status')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label htmlFor="level_order" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Display Order', 'Display Order')}
                    </label>
                    <Input
                      id="level_order"
                      type="number"
                      min={0}
                      value={formData.level_order}
                      onChange={(e) => handleFieldChange('level_order', e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={__('Auto', 'Auto')}
                      className={errors.level_order ? 'border-red-500' : ''}
                    />
                    {errors.level_order && <p className="mt-1 text-sm text-red-500">{errors.level_order}</p>}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {__('Lower numbers appear first. Leave blank to auto-assign.', 'Lower numbers appear first. Leave blank to auto-assign.')}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Status', 'Status')}
                    </label>
                    <Select id="status" value={formData.status} onChange={(e) => handleFieldChange('status', e.target.value)} className="w-full h-10">
                      <option value="draft">{__('Draft', 'Draft')}</option>
                      <option value="publish">{__('Publish', 'Publish')}</option>
                      <option value="trash">{__('Trash', 'Trash')}</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {__('Saving...', 'Saving...')}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {isEditMode ? __('Update Difficulty Level', 'Update Difficulty Level') : __('Create Difficulty Level', 'Create Difficulty Level')}
                          </>
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
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

export default DifficultyLevelForm;

