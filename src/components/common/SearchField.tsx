"use client";

import { FaSearch } from "react-icons/fa";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onEnter?: () => void;
  showSearchButton?: boolean;
  onSearchClick?: () => void;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  disabled = false,
  className = "",
  onEnter,
  showSearchButton = false,
  onSearchClick,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnter) {
      onEnter();
    }
  };

  return (
    <div className={`relative flex-1 ${className}`}>
      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        className={`w-full pl-10 ${
          showSearchButton ? "pr-20" : "pr-4"
        } py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-500 text-gray-900`}
      />
      {showSearchButton && (
        <button
          onClick={onSearchClick}
          disabled={disabled}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 cursor-pointer rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FaSearch className="w-3 h-3 mr-1" />
          Search
        </button>
      )}
    </div>
  );
};
