/**
 * Icon Picker: Yatra library (icons.json / Lucide SVG) + Font Awesome 6 Free + image upload.
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Upload,
  X,
  Search,
  Image as ImageLucide,
  Sparkles,
  Check,
} from "lucide-react";
import { getIconOptions } from "../../lib/icons";
import {
  FA_FREE_SOLID_PICKER,
  FA_FREE_REGULAR_PICKER,
} from "../../lib/fa-free-picker-icons";
import type {
  IconPickerValue,
  IconProvider,
} from "../../lib/icon-picker-types";

export type {
  IconPickerValue,
  IconProvider,
} from "../../lib/icon-picker-types";

import { __ } from "../../lib/i18n";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";
import { Modal } from "./modal";
import { useWordPressMedia } from "../../hooks/useWordPressMedia";

const categoryLabels: Record<string, string> = {
  activity: "Activities",
  travel: "Travel",
  food: "Food & Dining",
  accommodation: "Accommodation",
  transport: "Transportation",
  general: "General",
  media: "Media",
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
  size?: "sm" | "md" | "lg";
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
  size = "md",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"icons" | "upload">("icons");
  const [iconLibrary, setIconLibrary] = useState<IconProvider>("yatra");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const yatraIconOptions = useMemo(() => getIconOptions(), []);

  const [imagePreview, setImagePreview] = useState<string | null>(
    value?.type === "image"
      ? value.value.startsWith("http")
        ? value.value
        : null
      : null,
  );

  useEffect(() => {
    if (value?.type === "image") {
      if (
        value.value.startsWith("http://") ||
        value.value.startsWith("https://")
      ) {
        setImagePreview(value.value);
      } else if (/^\d+$/.test(value.value) && window.yatraAdmin?.apiUrl) {
        const apiUrl = window.yatraAdmin.apiUrl.replace("/yatra/v1", "");
        fetch(`${apiUrl}/wp/v2/media/${value.value}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.source_url) {
              setImagePreview(data.source_url);
            }
          })
          .catch(() => {});
      }
    } else {
      setImagePreview(null);
    }
  }, [value]);

  const { openMediaLibrary } = useWordPressMedia({
    title: __("Select or Upload Image", "yatra"),
    buttonText: __("Use this image", "yatra"),
    multiple: false,
    library: { type: "image" },
  });

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const filteredYatraIcons = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return yatraIconOptions.filter((icon) => {
      const matchesSearch =
        icon.label.toLowerCase().includes(q) ||
        icon.name.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === "all" || icon.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [yatraIconOptions, searchTerm, selectedCategory]);

  const faSourceList =
    iconLibrary === "fa-regular"
      ? FA_FREE_REGULAR_PICKER
      : FA_FREE_SOLID_PICKER;

  const filteredFaIcons = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return faSourceList.filter(
      (row) =>
        row.label.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q),
    );
  }, [faSourceList, searchTerm]);

  const categories = useMemo(
    () => [
      "all",
      ...Array.from(new Set(yatraIconOptions.map((icon) => icon.category))),
    ],
    [yatraIconOptions],
  );

  const selectYatraIcon = (name: string) => {
    onChange({ type: "icon", value: name, provider: "yatra" });
    setIsOpen(false);
    setSearchTerm("");
  };

  const selectFaIcon = (name: string, style: "fa-solid" | "fa-regular") => {
    onChange({ type: "icon", value: name, provider: style });
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleWordPressMediaSelect = useCallback(() => {
    openMediaLibrary((attachment) => {
      if (attachment && !Array.isArray(attachment)) {
        const attachmentId = String(attachment.id);
        setImagePreview(attachment.url);
        onChange({ type: "image", value: attachmentId });
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
      onChange({ type: "image", value: url.trim() });
    } else {
      handleRemoveImage();
    }
  };

  const selectionSummary = (): string => {
    if (!value) {
      return __("Select Icon or Upload Image", "yatra");
    }
    if (value.type === "image") {
      return __("Custom Image", "yatra");
    }
    const p = value.provider ?? "yatra";
    if (p === "fa-solid") {
      return `${__("Font Awesome Solid", "yatra")}: ${value.value}`;
    }
    if (p === "fa-regular") {
      return `${__("Font Awesome Regular", "yatra")}: ${value.value}`;
    }
    const meta = yatraIconOptions.find((o) => o.name === value.value);
    return `${__("Yatra", "yatra")}: ${meta?.label || value.value}`;
  };

  const renderIconPreview = () => {
    if (!value || value.type !== "icon") {
      return (
        <ImageLucide className={`${iconSizeClasses[size]} text-gray-400`} />
      );
    }
    const p = value.provider ?? "yatra";
    if (p === "fa-solid" || p === "fa-regular") {
      const prefix = p === "fa-regular" ? "fa-regular" : "fa-solid";
      return (
        <i
          className={`${prefix} fa-${value.value} ${iconSizeClasses[size]} text-gray-700 dark:text-gray-300 inline-flex items-center justify-center`}
          aria-hidden="true"
        />
      );
    }
    const opt = yatraIconOptions.find((o) => o.name === value.value);
    if (opt?.svg) {
      return (
        <span
          className={`inline-flex items-center justify-center ${iconSizeClasses[size]} text-gray-700 dark:text-gray-300 [&>svg]:w-full [&>svg]:h-full`}
          dangerouslySetInnerHTML={{ __html: opt.svg }}
        />
      );
    }
    return <ImageLucide className={`${iconSizeClasses[size]} text-gray-400`} />;
  };

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

      <div className="flex items-center gap-3">
        <div
          className={`${sizeClasses[size]} rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden`}
        >
          {value?.type === "image" && imagePreview ? (
            <img
              src={imagePreview}
              alt="Selected"
              className="w-full h-full object-cover"
            />
          ) : (
            renderIconPreview()
          )}
        </div>

        <div className="flex-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full justify-start"
          >
            {selectionSummary()}
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

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={__("Select Icon or Upload Image", "yatra")}
        size="xl"
        showCloseButton={true}
        customZIndex={99999}
      >
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {allowIconSelection && (
            <button
              type="button"
              onClick={() => setActiveTab("icons")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "icons"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              {__("Icons", "yatra")}
            </button>
          )}
          {allowImageUpload && (
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "upload"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              {__("Upload Image", "yatra")}
            </button>
          )}
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {activeTab === "icons" && allowIconSelection && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <Badge
                  variant={iconLibrary === "yatra" ? "info" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setIconLibrary("yatra")}
                >
                  {__("Yatra library", "yatra")}
                </Badge>
                <Badge
                  variant={iconLibrary === "fa-solid" ? "info" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setIconLibrary("fa-solid")}
                >
                  {__("Font Awesome Solid", "yatra")}
                </Badge>
                <Badge
                  variant={iconLibrary === "fa-regular" ? "info" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setIconLibrary("fa-regular")}
                >
                  {__("Font Awesome Regular", "yatra")}
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={__("Search icons...", "yatra")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {(iconLibrary === "fa-solid" || iconLibrary === "fa-regular") && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {__(
                    "Tip: use search to filter the full Font Awesome Free library (1000+ solid, 150+ regular).",
                    "yatra",
                  )}
                </p>
              )}

              {iconLibrary === "yatra" && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={
                        selectedCategory === category ? "info" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category === "all"
                        ? __("All", "yatra")
                        : categoryLabels[category] || category}
                    </Badge>
                  ))}
                </div>
              )}

              {iconLibrary === "yatra" && (
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
                  {filteredYatraIcons.map((icon) => {
                    const isSelected =
                      value?.type === "icon" &&
                      (value.provider ?? "yatra") === "yatra" &&
                      value.value === icon.name;
                    return (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() => selectYatraIcon(icon.name)}
                        className={`relative p-3 rounded-lg border-2 transition-all hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                          isSelected
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                        title={icon.label}
                      >
                        <span
                          className="w-6 h-6 mx-auto text-gray-700 dark:text-gray-300 flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6"
                          dangerouslySetInnerHTML={{ __html: icon.svg }}
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-blue-600 rounded-full p-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {(iconLibrary === "fa-solid" || iconLibrary === "fa-regular") && (
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
                  {filteredFaIcons.map((row) => {
                    const isSelected =
                      value?.type === "icon" &&
                      value.provider === row.style &&
                      value.value === row.name;
                    return (
                      <button
                        key={`${row.style}-${row.name}`}
                        type="button"
                        onClick={() => selectFaIcon(row.name, row.style)}
                        className={`relative p-3 rounded-lg border-2 transition-all hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                          isSelected
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                        title={row.label}
                      >
                        <i
                          className={`${row.style} fa-${row.name} w-6 h-6 mx-auto text-gray-700 dark:text-gray-300 inline-flex items-center justify-center`}
                          aria-hidden="true"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-blue-600 rounded-full p-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {iconLibrary === "yatra" && filteredYatraIcons.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {__("No icons found", "yatra")}
                </div>
              )}
              {(iconLibrary === "fa-solid" || iconLibrary === "fa-regular") &&
                filteredFaIcons.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {__("No icons found", "yatra")}
                  </div>
                )}
            </div>
          )}

          {activeTab === "upload" && allowImageUpload && (
            <div className="space-y-6 p-2">
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
                          {__("Change Image", "yatra")}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="bg-red-500/90 hover:bg-red-600"
                        >
                          <X className="w-4 h-4 mr-2" />
                          {__("Remove", "yatra")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
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
                          {__("Upload Image", "yatra")}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {__("Click to open WordPress Media Library", "yatra")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-gray-900 px-3 text-gray-500 dark:text-gray-400">
                        {__("Or", "yatra")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {__("Enter Image URL", "yatra")}
                    </label>
                    <Input
                      type="url"
                      placeholder={__("https://example.com/image.png", "yatra")}
                      value={value?.type === "image" ? value.value : ""}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            {__("Close", "yatra")}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default IconPicker;
