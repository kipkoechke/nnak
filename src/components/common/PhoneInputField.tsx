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
      <label className="block text-sm font-bold text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div
        className={`booking-phone-input h-[46px] px-3 rounded-lg border bg-white flex items-center transition-colors shadow-sm hover:border-gray-400 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:shadow-none [&_.PhoneInputInput]:ring-0 ${
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
