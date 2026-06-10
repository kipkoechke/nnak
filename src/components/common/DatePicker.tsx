"use client";

import React, { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxDate?: Date;
  error?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "Select date",
  maxDate,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = value ? new Date(value + "T00:00:00") : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange("");
      setIsOpen(false);
      return;
    }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div ref={containerRef} className="relative">
      <label className="text-gray-700 mb-2 flex text-xs sm:text-sm font-semibold">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => !disabled && setIsOpen(true)}
          readOnly
          className="border-gray-300 focus:border-primary text-gray-900 focus:ring-primary hover:border-gray-400 w-full rounded-lg border px-4 py-3 text-sm transition-all duration-300 focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 cursor-pointer"
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect as (d: Date | undefined) => void}
            defaultMonth={selected || new Date()}
            disabled={maxDate ? { after: maxDate } : undefined}
            captionLayout="dropdown"
            startMonth={new Date(1900, 0)}
            endMonth={new Date()}
          />
          {value && (
            <div className="mt-2 pt-2 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={() => { onChange(""); setIsOpen(false); }}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Clear date
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};
