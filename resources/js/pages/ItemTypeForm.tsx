/**
 * Item Type Form Page
 * Add/Edit Item Type form
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { HelpText } from '../components/ui/help-text';
import { Alert } from '../components/ui/alert';
import { availableIcons, IconSelector } from '../components/ui/icon-selector';

interface ItemTypeFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  status: string;
}

const ItemTypeForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [formData, setFormData] = useState<ItemTypeFormData>({
    name: '',
    slug: '',
    description: '',
    icon: 'package',
    color: 'blue',
    status: 'active',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      return {
        id: typeId,
        name: 'Activity',
        slug: 'activity',
        description: 'Physical activities',
        icon: 'activity',
        color: 'blue',
        status: 'active',
      };
    },
    enabled: isEditMode && can('yatra_view_trips'),
  });

  useEffect(() => {
    if (typeData && isEditMode) {
      setFormData({
        name: typeData.name || '',
        slug: typeData.slug || '',
        description: typeData.description || '',
        icon: typeData.icon || '📦',
        color: typeData.color || 'blue',
        status: typeData.status || 'active',
      });
    }
  }, [typeData, isEditMode]);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: prev.slug || generateSlug(value),
    }));
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const handleFieldChange = (field: keyof ItemTypeFormData, value: string) => {
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
      const payload = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        icon: data.icon,
        color: data.color,
        status: data.status,
      };

      if (isEditMode && typeId) {
        console.log('Updating item type:', typeId, payload);
        return { success: true, id: typeId };
      } else {
        console.log('Creating item type:', payload);
        return { success: true, id: Math.floor(Math.random() * 1000) };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-types'] });
      window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=item-types`;
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving', 'An error occurred while saving');
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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">{__('Loading...', 'Loading...')}</span>
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
                    <HelpText 
                      text={__('Enter a name for this item type. Examples: Activity, Meal, Accommodation, Transportation.', 'Enter a name for this item type. Examples: Activity, Meal, Accommodation, Transportation.')}
                      className="mb-2"
                    />
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
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('URL Slug', 'URL Slug')} <span className="text-red-500">*</span>
                    </label>
                    <HelpText 
                      text={__('URL-friendly version of the name. Automatically generated but can be edited.', 'URL-friendly version of the name. Automatically generated but can be edited.')}
                      className="mb-2"
                    />
                    <Input
                      id="slug"
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleFieldChange('slug', e.target.value)}
                      placeholder={__('activity', 'activity')}
                      className={errors.slug ? 'border-red-500' : ''}
                      required
                    />
                    {errors.slug && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.slug}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Description', 'Description')}
                    </label>
                    <HelpText 
                      text={__('Brief description of what this item type represents. This helps users understand the category.', 'Brief description of what this item type represents. This helps users understand the category.')}
                      className="mb-2"
                    />
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
                    <label htmlFor="icon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Icon', 'Icon')}
                    </label>
                    <HelpText 
                      text={__('Choose an icon to represent this item type visually. Icons help users quickly identify different types.', 'Choose an icon to represent this item type visually. Icons help users quickly identify different types.')}
                      className="mb-2"
                    />
                    <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto p-1 border border-gray-200 dark:border-gray-700 rounded-md">
                      {availableIcons.map((iconOption) => {
                        const IconComponent = iconOption.component;
                        return (
                          <button
                            key={iconOption.name}
                            type="button"
                            onClick={() => handleFieldChange('icon', iconOption.name)}
                            className={`p-2 rounded-md border-2 transition-colors flex items-center justify-center ${
                              formData.icon === iconOption.name
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            title={iconOption.label}
                          >
                            <IconComponent className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{__('Selected:', 'Selected:')}</span>
                        {formData.icon && (
                          <div className="flex items-center gap-2">
                            <IconSelector 
                              iconName={formData.icon as any} 
                              className="w-4 h-4 text-gray-700 dark:text-gray-300"
                            />
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{formData.icon}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Color', 'Color')}
                    </label>
                    <HelpText 
                      text={__('Choose a color theme for this item type. Used for visual organization.', 'Choose a color theme for this item type. Used for visual organization.')}
                      className="mb-2"
                    />
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

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Status', 'Status')}
                    </label>
                    <HelpText 
                      text={__('Active types can be used in itineraries. Inactive types are hidden but not deleted.', 'Active types can be used in itineraries. Inactive types are hidden but not deleted.')}
                      className="mb-2"
                    />
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                    >
                      <option value="active">{__('Active', 'Active')}</option>
                      <option value="inactive">{__('Inactive', 'Inactive')}</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

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
                        <strong>{__('Tip:', 'Tip:')}</strong> {__('After creating the type, you can add specific items (subtypes) under it.', 'After creating the type, you can add specific items (subtypes) under it.')}
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

