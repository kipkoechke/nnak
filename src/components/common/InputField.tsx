import { useState } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface InputFieldProps {
  label: string;
  type: string;
  placeholder: string;
  register: UseFormRegisterReturn;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const InputField = ({
  label,
  type,
  placeholder,
  register,
  error,
  required = false,
  disabled = false,
}: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";
  const inputType = isPasswordField
    ? showPassword
      ? "text"
      : "password"
    : type;

  return (
    <div>
      <label className="text-gray-700 mb-2 flex text-xs sm:text-sm font-semibold">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className={isPasswordField ? "relative" : ""}>
        <input
          {...register}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            border-gray-300 focus:border-primary text-gray-900 focus:ring-primary hover:border-gray-400 
            w-full rounded-lg placeholder:text-gray-500 border px-4 py-3 text-sm transition-all duration-300 
            focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
            ${type === "number" ? "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" : ""}
          `}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 focus:top-1/2 focus:-translate-y-1/2 focus:text-gray-700 focus:outline-none p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};
