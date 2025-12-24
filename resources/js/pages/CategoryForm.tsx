/**
 * Category Form Page
 * Add/Edit Trip Category with parent/subcategory support
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
import { RichTextEditor } from '../components/ui/rich-text-editor';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  icon: IconPickerValue | null;
  parent_id: number | '';
  status: string;
}

interface CategoryOption {
  id: number;
  name: string;
  parent_id: number | null;
}

const CategoryForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    icon: null,
    parent_id: '',
    status: 'publish',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugEditable, setIsSlugEditable] = useState(false);

  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const categoryId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0', 10) : null;
  }, []);

  const isEditMode = action === 'edit' && categoryId !== null;

  // Fetch category data if editing
  const { data: categoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['trip-category', categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      try {
        const response = await apiClient.get(`/trip-categories/${categoryId}`);
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load category', 'Failed to load category'), 'error');
        throw error;
      }
    },
    enabled: isEditMode && can('yatra_view_trips'),
  });

  // Fetch parent category options (top-level categories)
  const { data: parentCategoriesData } = useQuery({
    queryKey: ['trip-categories', 'parent-options'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/trip-categories', {
          params: {
            per_page: 100,
            parent_id: null,
            hierarchical: false,
            orderby: 'name',
            order: 'ASC',
          },
        });
        const payload = response?.data || response;
        if (!payload) {
          return [];
        }
        if (Array.isArray(payload)) {
          return payload;
        }
        return payload.data || [];
      } catch (error) {
        return [];
      }
    },
    enabled: can('yatra_view_trips'),
  });

  const parentOptions: CategoryOption[] = useMemo(() => {
    if (!parentCategoriesData || !Array.isArray(parentCategoriesData)) {
      return [];
    }
    return parentCategoriesData.filter((cat: any) => {
      if (!cat || typeof cat !== 'object') return false;
      // Only allow top-level categories (no parent)
      if (cat.parent_id) return false;
      // Prevent selecting itself as parent when editing
      if (isEditMode && categoryId && cat.id === categoryId) return false;
      return true;
    });
  }, [parentCategoriesData, isEditMode, categoryId]);

  // Load category data into form when editing
  useEffect(() => {
    if (categoryData && isEditMode) {
      setFormData({
        name: categoryData.name || '',
        slug: categoryData.slug || '',
        description: categoryData.description || '',
        icon: (categoryData.icon as IconPickerValue) || null,
        parent_id: categoryData.parent_id ?? '',
        status: categoryData.status || 'publish',
      });
    }
  }, [categoryData, isEditMode]);

  const handleNameChange = (value: string) => {
    // Only auto-generate slug on create; in edit mode, keep existing slug
    if (!isEditMode && !isSlugEditable) {
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

  const handleFieldChange = (field: keyof CategoryFormData, value: any) => {
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

    if (formData.parent_id && categoryId && Number(formData.parent_id) === categoryId) {
      newErrors.parent_id = __('Category cannot be its own parent', 'Category cannot be its own parent');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const payload: any = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        icon: data.icon,
        parent_id: data.parent_id === '' ? null : Number(data.parent_id),
        status: data.status,
      };

      if (isEditMode && isSlugEditable) {
        payload.preserve_slug = true;
      }

      if (isEditMode && categoryId) {
        return await apiClient.put(`/trip-categories/${categoryId}`, payload);
      }
      return await apiClient.post('/trip-categories', payload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['trip-categories'] });
      queryClient.invalidateQueries({ queryKey: ['trip-category', categoryId] });
      showToast(
        isEditMode
          ? __('Category updated successfully', 'Category updated successfully')
          : __('Category created successfully', 'Category created successfully'),
        'success'
      );
      setIsSubmitting(false);

      if (!isEditMode) {
        const newId = response?.id;
        if (newId) {
          window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=categories&action=edit&id=${newId}`;
        } else {
          window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=categories`;
        }
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving the category', 'An error occurred while saving the category');
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
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=categories`;
  };

  if (isEditMode && isLoadingCategory) {
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
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
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
        title={isEditMode ? __('Edit Category', 'Edit Category') : __('Add New Category', 'Add New Category')}
        description={isEditMode ? __('Update category information', 'Update category information') : __('Create a new trip category', 'Create a new trip category')}
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
                      placeholder={__('Enter category name', 'Enter category name')}
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

                  <RichTextEditor
                    label={__('Description', 'Description')}
                    value={formData.description || ''}
                    onChange={(value) => handleFieldChange('description', value)}
                    placeholder={__('Write a rich description (supports formatting, lists, links...)', 'Write a rich description (supports formatting, lists, links...)')}
                    helperText={__('Use formatting, bullet lists, and links to describe this category. HTML is supported.', 'Use formatting, bullet lists, and links to describe this category. HTML is supported.')}
                    minHeight={260}
                    maxHeight={600}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Hierarchy', 'Hierarchy')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Parent Category', 'Parent Category')}
                    </label>
                    <Select
                      id="parent_id"
                      value={formData.parent_id === '' ? '' : String(formData.parent_id)}
                      onChange={(e) => handleFieldChange('parent_id', e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full h-10"
                    >
                      <option value="">{__('None (Top Level)', 'None (Top Level)')}</option>
                      {parentOptions.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </Select>
                    {errors.parent_id && <p className="mt-1 text-sm text-red-500">{errors.parent_id}</p>}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {__('Assign a parent category to create subcategories.', 'Assign a parent category to create subcategories.')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Status', 'Status')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                      className="w-full h-10"
                    >
                    <option value="draft">{__('Draft', 'Draft')}</option>
                    <option value="publish">{__('Publish', 'Publish')}</option>
                    <option value="trash">{__('Trash', 'Trash')}</option>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Category Icon or Image', 'Category Icon or Image')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <IconPicker
                    value={formData.icon}
                    onChange={(value) => handleFieldChange('icon', value)}
                    label={__('Select Icon or Upload Image', 'Select Icon or Upload Image')}
                    helpText={__('Choose a library icon or upload a custom image for this category.', 'Choose a library icon or upload a custom image for this category.')}
                    allowImageUpload={true}
                    allowIconSelection={true}
                    size="md"
                  />
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
                            {isEditMode ? __('Update Category', 'Update Category') : __('Create Category', 'Create Category')}
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

export default CategoryForm;

