"use client";

import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface PhoneFieldProps {
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  defaultCountry?: string;
}

export const PhoneField = ({
  label,
  value,
  onChange,
  placeholder = "Enter phone number",
  error,
  required = false,
  disabled = false,
  defaultCountry = "GB",
}: PhoneFieldProps) => {
  return (
    <div>
      <label className="text-gray-700 mb-2 flex text-xs sm:text-sm font-semibold">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <PhoneInput
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry as "GB"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="phone-field-input border-gray-300 focus-within:border-primary focus-within:ring-primary hover:border-gray-400 w-full rounded-lg border px-4 py-3 text-sm transition-all duration-300 focus-within:ring-1 disabled:cursor-not-allowed disabled:bg-gray-100"
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default PhoneField;
