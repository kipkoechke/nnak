import React from "react";

interface DateTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder,
}) => {
  return (
    <div>
      <label className="text-gray-700 mb-2 flex text-xs sm:text-sm font-semibold">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="border-gray-300 focus:border-primary text-gray-900 focus:ring-primary hover:border-gray-400 w-full rounded-lg placeholder:text-gray-500 border px-4 py-3 text-sm transition-all duration-300 focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
      />
    </div>
  );
};
