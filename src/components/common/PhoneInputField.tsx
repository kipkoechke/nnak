"use client";

import PhoneInput, {
  type Country as CountryCode,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { PhoneCountrySelect } from "./PhoneCountrySelect";

interface PhoneInputFieldProps {
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  required?: boolean;
  error?: string;
  defaultCountry?: CountryCode;
  onCountryChange?: (country: CountryCode | undefined) => void;
}

export function PhoneInputField({
  label,
  value,
  onChange,
  required,
  error,
  defaultCountry = "GB",
  onCountryChange,
}: PhoneInputFieldProps) {
  return (
    <div>
      <label className="text-gray-700 mb-2 flex text-xs font-semibold">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div
        className={`booking-phone-input h-10 rounded-lg border bg-white transition-all duration-300 hover:border-gray-400 focus-within:border-brand-pink focus-within:ring-1 focus-within:ring-brand-pink ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        <PhoneInput
          key={defaultCountry}
          international
          defaultCountry={defaultCountry}
          onCountryChange={onCountryChange}
          value={value}
          onChange={onChange}
          countrySelectComponent={PhoneCountrySelect}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
