import React, { forwardRef } from "react";

interface CheckboxProps {
  label: string;
  name: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  helperText?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      name,
      checked,
      onChange,
      error,
      disabled = false,
      className = "",
      helperText,
    },
    ref
  ) => {
    return (
      <div className={`flex flex-col ${className}`}>
        <label className="flex items-center cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            name={name}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className={`w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              error ? "border-red-500" : ""
            }`}
          />
          <span
            className={`ml-2 text-sm font-medium ${
              disabled ? "text-gray-400" : "text-gray-700"
            } ${error ? "text-red-500" : ""}`}
          >
            {label}
          </span>
        </label>
        {helperText && !error && (
          <p className="mt-1 text-xs text-gray-500 ml-6">{helperText}</p>
        )}
        {error && <p className="mt-1 text-xs text-red-500 ml-6">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
