/**
 * Icon Picker Component
 * Reusable component for selecting SVG icons or uploading custom images
 * Supports both Lucide React icons and custom image uploads
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  X,
  Search,
  Image as ImageLucide,
  Sparkles,
  Check,
} from 'lucide-react';
import { getIconOptions, type IconName } from '../../lib/icons';
import { __ } from '../../lib/i18n';
import { Button } from './button';
import { Input } from './input';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { useWordPressMedia } from '../../hooks/useWordPressMedia';

// Use centralized icon system
const iconOptions = getIconOptions();

const categoryLabels: Record<string, string> = {
  activity: 'Activities',
  travel: 'Travel',
  food: 'Food & Dining',
  accommodation: 'Accommodation',
  transport: 'Transportation',
  general: 'General',
};

export type IconPickerValue = {
  type: 'icon' | 'image';
  value: string; // icon name for type 'icon', attachment ID for type 'image'
};

interface IconPickerProps {
  value?: IconPickerValue | null;
  onChange: (value: IconPickerValue | null) => void;
  label?: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  allowImageUpload?: boolean;
  allowIconSelection?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  label,
  helpText,
  error,
  required = false,
  allowImageUpload = true,
  allowIconSelection = true,
  size = 'md',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'icons' | 'upload'>('icons');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [imagePreview, setImagePreview] = useState<string | null>(
    value?.type === 'image' ? (value.value.startsWith('http') ? value.value : null) : null
  );
  
  // Update preview when value changes and fetch URL if it's an attachment ID
  useEffect(() => {
    if (value?.type === 'image') {
      // If it's already a URL, use it directly
      if (value.value.startsWith('http://') || value.value.startsWith('https://')) {
        setImagePreview(value.value);
      } else if (/^\d+$/.test(value.value) && window.yatraAdmin?.apiUrl) {
        // It's an attachment ID, fetch the URL from WordPress REST API
        const apiUrl = window.yatraAdmin.apiUrl.replace('/yatra/v1', '');
        fetch(`${apiUrl}/wp/v2/media/${value.value}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.source_url) {
              setImagePreview(data.source_url);
            }
          })
          .catch(() => {
            // Keep null if fetch fails
          });
      }
    } else {
      setImagePreview(null);
    }
  }, [value]);
  
  // WordPress media library hook
  const { openMediaLibrary } = useWordPressMedia({
    title: __('Select or Upload Image', 'yatra'),
    buttonText: __('Use this image', 'yatra'),
    multiple: false,
    library: { type: 'image' },
  });

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  // Filter icons by search and category
  const filteredIcons = iconOptions.filter(icon => {
    const matchesSearch = icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         icon.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || icon.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(iconOptions.map(icon => icon.category)))];

  const handleIconSelect = (iconName: IconName) => {
    onChange({ type: 'icon', value: iconName });
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleWordPressMediaSelect = useCallback(() => {
    openMediaLibrary((attachment) => {
      if (attachment && !Array.isArray(attachment)) {
        // Store attachment ID instead of URL
        const attachmentId = String(attachment.id);
        setImagePreview(attachment.url); // Use URL for preview
        onChange({ type: 'image', value: attachmentId });
        setIsOpen(false);
      }
    });
  }, [openMediaLibrary, onChange]);

  const handleRemoveImage = () => {
    setImagePreview(null);
    onChange(null);
  };

  const handleImageUrlChange = (url: string) => {
    if (url.trim()) {
      setImagePreview(url);
      onChange({ type: 'image', value: url.trim() });
    } else {
      handleRemoveImage();
    }
  };

  const getCurrentIcon = () => {
    if (!value || value.type !== 'icon') return null;
    const icon = iconOptions.find(opt => opt.name === value.value);
    return icon?.component || null;
  };

  const CurrentIcon = getCurrentIcon();

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}

      {/* Current Selection Display */}
      <div className="flex items-center gap-3">
        <div className={`${sizeClasses[size]} rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden`}>
          {value?.type === 'image' && imagePreview ? (
            <img 
              src={imagePreview} 
              alt="Selected" 
              className="w-full h-full object-cover"
            />
          ) : value?.type === 'icon' && CurrentIcon ? (
            <CurrentIcon className={`${iconSizeClasses[size]} text-gray-700 dark:text-gray-300`} />
          ) : (
            <ImageLucide className={`${iconSizeClasses[size]} text-gray-400`} />
          )}
        </div>

        <div className="flex-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full justify-start"
          >
            {value?.type === 'icon' 
              ? `${__('Icon', 'yatra')}: ${iconOptions.find(i => i.name === value.value)?.label || value.value}`
              : value?.type === 'image'
              ? __('Custom Image', 'yatra')
              : __('Select Icon or Upload Image', 'yatra')}
          </Button>
        </div>

        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              onChange(null);
              setImagePreview(null);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Icon Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsOpen(false)}>
          <Card 
            className="w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-0">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {allowIconSelection && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('icons')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'icons'
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    {__('Icons', 'yatra')}
                  </button>
                )}
                {allowImageUpload && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'upload'
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    {__('Upload Image', 'yatra')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {activeTab === 'icons' && allowIconSelection && (
                  <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder={__('Search icons...', 'yatra')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <Badge
                          key={category}
                          variant={selectedCategory === category ? 'info' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category === 'all' ? __('All', 'yatra') : categoryLabels[category] || category}
                        </Badge>
                      ))}
                    </div>

                    {/* Icons Grid */}
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
                      {filteredIcons.map(icon => {
                        const IconComponent = icon.component;
                        const isSelected = value?.type === 'icon' && value.value === icon.name;
                        return (
                          <button
                            key={icon.name}
                            type="button"
                            onClick={() => handleIconSelect(icon.name)}
                            className={`relative p-3 rounded-lg border-2 transition-all hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                            title={icon.label}
                          >
                            <IconComponent className="w-6 h-6 text-gray-700 dark:text-gray-300 mx-auto" />
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-blue-600 rounded-full p-0.5">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {filteredIcons.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {__('No icons found', 'yatra')}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'upload' && allowImageUpload && (
                  <div className="space-y-6 p-2">
                    {/* Image Preview or Upload Area */}
                    {imagePreview ? (
                      <div className="space-y-4">
                        <div className="relative group">
                          <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-64 object-contain"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleWordPressMediaSelect}
                                className="bg-white/90 hover:bg-white text-gray-900 border-white"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                {__('Change Image', 'yatra')}
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleRemoveImage}
                                className="bg-red-500/90 hover:bg-red-600"
                              >
                                <X className="w-4 h-4 mr-2" />
                                {__('Remove', 'yatra')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* WordPress Media Library Upload */}
                        <div
                          onClick={handleWordPressMediaSelect}
                          className="group cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl p-12 text-center transition-all duration-200 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                        >
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-base font-semibold text-gray-900 dark:text-white">
                                {__('Upload Image', 'yatra')}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {__('Click to open WordPress Media Library', 'yatra')}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {__('Select from library or upload new image', 'yatra')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-gray-900 px-3 text-gray-500 dark:text-gray-400">
                              {__('Or', 'yatra')}
                            </span>
                          </div>
                        </div>

                        {/* Image URL Input */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {__('Enter Image URL', 'yatra')}
                          </label>
                          <Input
                            type="url"
                            placeholder={__('https://example.com/image.png', 'yatra')}
                            value={value?.type === 'image' ? value.value : ''}
                            onChange={(e) => handleImageUrlChange(e.target.value)}
                            className="h-11"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  {__('Close', 'yatra')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default IconPicker;

