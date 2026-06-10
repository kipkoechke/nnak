"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MdExpandMore,
  MdSearch,
  MdClose,
  MdChevronLeft,
  MdChevronRight,
} from "react-icons/md";
import { useOutsideClick } from "../../hooks/useOutsideClick";

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

interface SearchableSelectProps {
  label: string;
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  onSearchChange?: (search: string) => void;
  isLoading?: boolean;
  showSearchHint?: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  required = false,
  onSearchChange,
  isLoading = false,
  showSearchHint = false,
  pagination,
  onPageChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useOutsideClick(() => setIsOpen(false));
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Notify parent of search changes (for backend search)
  // Only trigger search when dropdown is open
  useEffect(() => {
    if (onSearchChange && isOpen) {
      onSearchChange(searchQuery);
    }
  }, [searchQuery, onSearchChange, isOpen]);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen && onSearchChange) {
      setSearchQuery("");
    }
  }, [isOpen, onSearchChange]);

  // Track if we've notified parent of initial open
  const hasNotifiedOnOpen = useRef(false);

  // Notify parent when dropdown first opens (for initial data fetch)
  useEffect(() => {
    if (isOpen && onSearchChange && !hasNotifiedOnOpen.current) {
      hasNotifiedOnOpen.current = true;
      onSearchChange("");
    }
    if (!isOpen) {
      hasNotifiedOnOpen.current = false;
    }
  }, [isOpen, onSearchChange]);

  // Filter options based on search query (client-side or backend)
  const filteredOptions = onSearchChange
    ? options // Backend search: use options as-is
    : options.filter((option) =>
        option?.label?.toLowerCase().includes(searchQuery.toLowerCase()),
      );

  // Get selected option label
  const selectedOption = options.find((opt) => opt?.value === value);
  const selectedLabel = selectedOption?.label || "";

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-bold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {showSearchHint && (
        <p className="mb-1 text-xs text-gray-500">
          Start typing to search all customers. The list below shows only a few.
        </p>
      )}
      {/* Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-3 border rounded-lg shadow-sm text-left
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? "border-red-500" : "border-gray-300"}
          ${isOpen ? "ring-2 ring-primary border-primary" : ""}
        `}
      >
        <div className="flex items-center justify-between">
          <span
            className={`block truncate text-sm ${
              selectedLabel ? "text-gray-900" : "text-gray-500"
            }`}
          >
            {selectedLabel || placeholder}
          </span>
          <div className="flex items-center space-x-1">
            {value && !disabled && (
              <MdClose
                className="w-4 h-4 text-gray-400 hover:text-gray-600 shrink-0"
                onClick={handleClear}
              />
            )}
            <MdExpandMore
              className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${
                isOpen ? "transform rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </button>

      {/* Description below selected item */}
      {selectedOption?.description && (
        <p className="mt-1 text-xs text-gray-600 italic">
          {selectedOption.description}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 bg-white">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-4 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading...
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option?.value || Math.random()}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full text-left px-3 py-2.5 hover:bg-primary-subtle transition-colors text-sm font-semibold
                    ${
                      value === option.value
                        ? "bg-primary-muted text-slate-900"
                        : "text-gray-900"
                    }
                  `}
                >
                  {option?.label || option?.value || "Unknown"}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-gray-500 text-sm">
                {onSearchChange && !searchQuery
                  ? "Start typing to search..."
                  : "No results found"}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => onPageChange?.(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MdChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-xs text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => onPageChange?.(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MdChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
