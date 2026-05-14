import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X, Search } from "lucide-react";
import { __ } from "../../lib/i18n";
import { Input } from "./input";

export interface SearchableSelectOption {
  value: string;
  label: string;
  icon?: string;
}

export interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  showValueId?: boolean; // Show "ID: value" next to label
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = __("Select an option...", "yatra"),
  searchPlaceholder = __("Search...", "yatra"),
  className = "",
  error = false,
  disabled = false,
  showValueId = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Dropdown is portaled to document.body so it escapes parent stacking
  // contexts (each itinerary entry row is `position: relative` with its
  // own z-index — without portaling, later sibling rows would render
  // their content ABOVE this dropdown panel regardless of z-index).
  const [menuRect, setMenuRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  // Filter options based on search term (search by both label and value)
  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Get selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside. Because the menu is portaled
  // to document.body, we check membership against BOTH the trigger
  // container and the portal node — a click on the menu itself must
  // not count as "outside".
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && containerRef.current.contains(target)) {
        return;
      }
      const portalRoot = document.getElementById(
        "yatra-searchable-select-portal",
      );
      if (portalRoot && portalRoot.contains(target)) {
        return;
      }
      setIsOpen(false);
      setSearchTerm("");
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Measure trigger so the portaled menu can position under it. We
  // re-measure on open, on scroll, and on resize so the menu tracks
  // the trigger when the page scrolls under it.
  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuRect(null);
      return;
    }
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setMenuRect({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ zIndex: isOpen ? 9999 : "auto" }}
    >
      <div
        className={`flex h-11 w-full rounded-md border-2 ${
          error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
        } bg-white dark:bg-gray-800 px-4 py-2.5 text-base ring-offset-white focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-offset-gray-900 dark:focus-within:ring-blue-400 transition-colors`}
      >
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex-1 flex items-center justify-between text-left ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          <span
            className={
              selectedOption
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }
          >
            {selectedOption ? (
              <div className="flex items-center justify-between w-full">
                <span>{selectedOption.label}</span>
                {showValueId &&
                  selectedOption.value &&
                  selectedOption.value !== "" && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 font-medium">
                      ID: {selectedOption.value}
                    </span>
                  )}
              </div>
            ) : (
              placeholder
            )}
          </span>
          <div className="flex items-center gap-1">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                aria-label={__("Clear selection", "yatra")}
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </div>

      {isOpen &&
        menuRect &&
        createPortal(
          <div
            id="yatra-searchable-select-portal"
            style={{
              position: "fixed",
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
              zIndex: 999999,
            }}
            className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-visible"
          >
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto overflow-x-visible">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                  {__("No options found", "yatra")}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      value === option.value
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {showValueId && option.value && option.value !== "" && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 font-medium">
                          ID: {option.value}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
