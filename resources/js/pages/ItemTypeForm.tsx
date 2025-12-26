/**
 * Item Type Form Page
 * Add/Edit Item Type form
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

interface ItemTypeFormData {
  name: string;
  slug: string;
  description: string;
  icon: {
    type: 'icon' | 'image';
    value: string;
  } | null;
  color: string;
  status: string;
}

const ItemTypeForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<ItemTypeFormData>({
    name: '',
    slug: '',
    description: '',
    icon: null,
    color: 'blue',
    status: 'publish',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugEditable, setIsSlugEditable] = useState(false);

  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const typeId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  const isEditMode = action === 'edit' && typeId !== null;

  const { data: typeData, isLoading: isLoadingType } = useQuery({
    queryKey: ['item-type', typeId],
    queryFn: async () => {
      if (!typeId) return null;
      try {
        const response = await apiClient.get(`/item-types/${typeId}`);
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load item type', 'Failed to load item type'), 'error');
        throw error;
      }
    },
    enabled: isEditMode && can('yatra_view_trips'),
  });

  useEffect(() => {
    if (typeData && isEditMode) {
      // Handle icon - could be string (old format) or IconPickerValue (new format)
      let iconValue: IconPickerValue | null = null;
      if (typeData.icon) {
        if (typeof typeData.icon === 'string') {
          // Old format: just icon name string
          iconValue = { type: 'icon', value: typeData.icon };
        } else if (typeof typeData.icon === 'object' && typeData.icon !== null) {
          // New format: IconPickerValue object
          iconValue = typeData.icon as IconPickerValue;
        }
      }

      setFormData({
        name: typeData.name || '',
        slug: typeData.slug || '',
        description: typeData.description || '',
        icon: iconValue,
        color: typeData.color || 'blue',
        status: typeData.status || 'publish',
      });
    }
  }, [typeData, isEditMode]);

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

  const handleFieldChange = (field: keyof ItemTypeFormData, value: string | IconPickerValue | null) => {
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

  const saveMutation = useMutation({
    mutationFn: async (data: ItemTypeFormData) => {
      const payload: any = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        icon: data.icon,
        color: data.color,
        status: data.status,
      };

      // If slug was manually edited, add flag to preserve it
      if (isEditMode && isSlugEditable) {
        payload.preserve_slug = true;
      }

      if (isEditMode && typeId) {
        return await apiClient.put(`/item-types/${typeId}`, payload);
      } else {
        return await apiClient.post('/item-types', payload);
      }
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['item-types'] });
      queryClient.invalidateQueries({ queryKey: ['item-type', typeId] });
      showToast(
        isEditMode 
          ? __('Item type updated successfully', 'Item type updated successfully')
          : __('Item type created successfully', 'Item type created successfully'),
        'success'
      );
      
      if (isEditMode) {
        // Don't redirect on update - stay on edit page
        setIsSubmitting(false);
      } else {
        // Redirect to edit page after create
        setTimeout(() => {
          const newId = response?.id || typeId;
          window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=item-types&action=edit&id=${newId}`;
        }, 1000);
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving the item type', 'An error occurred while saving the item type');
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
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=item-types`;
  };

  const colorOptions = [
    { value: 'blue', label: __('Blue', 'Blue') },
    { value: 'green', label: __('Green', 'Green') },
    { value: 'purple', label: __('Purple', 'Purple') },
    { value: 'orange', label: __('Orange', 'Orange') },
    { value: 'red', label: __('Red', 'Red') },
    { value: 'yellow', label: __('Yellow', 'Yellow') },
    { value: 'gray', label: __('Gray', 'Gray') },
  ];

  if (isEditMode && isLoadingType) {
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
                {/* Icon field */}
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                {/* Color field */}
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                {/* Status field */}
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            <Card>
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
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
        title={isEditMode ? __('Edit Item Type', 'Edit Item Type') : __('Add New Item Type', 'Add New Item Type')}
        description={isEditMode ? __('Update item type information', 'Update item type information') : __('Create a new category for organizing itinerary items', 'Create a new category for organizing itinerary items')}
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
            <div className="lg:col-span-2 space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Basic Information', 'Basic Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Type Name', 'Type Name')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder={__('e.g., Activity', 'e.g., Activity')}
                      className={errors.name ? 'border-red-500' : ''}
                      required
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
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
                          placeholder={__('item-type-slug', 'item-type-slug')}
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
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Description', 'Description')}
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder={__('Describe what this item type is used for...', 'Describe what this item type is used for...')}
                      rows={4}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Appearance', 'Appearance')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <IconPicker
                      value={formData.icon}
                      onChange={(value) => handleFieldChange('icon', value)}
                      label={__('Icon', 'Icon')}
                      helpText={__('Choose an icon to represent this item type visually. Icons help users quickly identify different types. You can also upload a custom image.', 'Choose an icon to represent this item type visually. Icons help users quickly identify different types. You can also upload a custom image.')}
                      allowImageUpload={true}
                      allowIconSelection={true}
                      size="md"
                    />
                  </div>

                  <div>
                    <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Color', 'Color')}
                    </label>
                    <Select
                      id="color"
                      value={formData.color}
                      onChange={(e) => handleFieldChange('color', e.target.value)}
                    >
                      {colorOptions.map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Status', 'Status')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Item Type Status', 'Item Type Status')}
                    </label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                    >
                      <option value="publish">{__('Publish', 'Publish')}</option>
                      <option value="draft">{__('Draft', 'Draft')}</option>
                      <option value="trash">{__('Trash', 'Trash')}</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

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
                            {isEditMode ? __('Update Type', 'Update Type') : __('Create Type', 'Create Type')}
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

export default ItemTypeForm;

