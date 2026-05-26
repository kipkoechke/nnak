import React, { useState, useRef, useEffect } from "react";

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  error?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "Select date",
  minDate,
  maxDate,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return new Date(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2]),
      );
    }
    return new Date(dateStr);
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const date = parseDate(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysInMonth = (date: Date): (number | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const isDateDisabled = (day: number | null): boolean => {
    if (day === null) return false;
    const currentDate = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      day,
    );

    if (minDate) {
      const min = parseDate(minDate);
      if (currentDate < min) return true;
    }
    if (maxDate) {
      const max = parseDate(maxDate);
      if (currentDate > max) return true;
    }
    return false;
  };

  const isSelected = (day: number | null): boolean => {
    if (day === null || !value) return false;
    const selected = parseDate(value);
    return (
      day === selected.getDate() &&
      viewDate.getMonth() === selected.getMonth() &&
      viewDate.getFullYear() === selected.getFullYear()
    );
  };

  const handleSelect = (day: number | null) => {
    if (day === null || isDateDisabled(day)) return;
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(formatDateForInput(newDate));
    setIsOpen(false);
  };

  const goToPrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  useEffect(() => {
    if (value) {
      setViewDate(parseDate(value));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="text-gray-700 mb-2 flex text-xs sm:text-sm font-semibold">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value ? formatDisplayDate(value) : ""}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            const inputValue = e.target.value;
            const datePattern = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/;
            const match = inputValue.match(datePattern);
            if (match) {
              const day = match[1].padStart(2, "0");
              const month = match[2].padStart(2, "0");
              let year = match[3];
              if (year.length === 2) {
                year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
              }
              const formatted = `${year}-${month}-${day}`;
              if (!isNaN(new Date(formatted).getTime())) {
                onChange(formatted);
              }
            } else if (inputValue === "") {
              onChange("");
            }
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          className="border-gray-300 focus:border-primary text-gray-900 focus:ring-primary hover:border-gray-400 w-full rounded-lg border px-4 py-3 text-sm transition-all duration-300 focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 text-left"
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-64"
          style={{
            top: containerRef.current
              ? containerRef.current.getBoundingClientRect().bottom + 4 + "px"
              : "auto",
            left: containerRef.current
              ? containerRef.current.getBoundingClientRect().left + "px"
              : "auto",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="text-xs font-semibold">
              {months[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {getDaysInMonth(viewDate).map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(day)}
                disabled={isDateDisabled(day)}
                className={`
                  p-1.5 text-xs rounded transition-colors
                  ${day === null ? "invisible" : ""}
                  ${isSelected(day) ? "bg-accent text-white" : ""}
                  ${!isSelected(day) && !isDateDisabled(day) ? "hover:bg-gray-100 text-gray-700" : ""}
                  ${isDateDisabled(day) ? "text-gray-300 cursor-not-allowed" : ""}
                `}
              >
                {day}
              </button>
            ))}
          </div>

          {value && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
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
