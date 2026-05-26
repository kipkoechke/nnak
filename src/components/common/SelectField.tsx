"use client";

import { UseFormRegisterReturn } from "react-hook-form";

interface SelectFieldProps {
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options: { value: string; label: string }[];
  className?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  register,
  error,
  required = false,
  disabled = false,
  placeholder = "Select an option",
  options,
  className = "",
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        {...register}
        disabled={disabled}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 bg-white"
      >
        <option value="" className="text-gray-500">
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="text-gray-900"
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
};
