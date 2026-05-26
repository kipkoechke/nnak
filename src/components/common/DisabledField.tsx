import React from "react";

interface DisabledFieldProps {
  label: string;
  message: string;
  className?: string;
}

export const DisabledField: React.FC<DisabledFieldProps> = ({
  label,
  message,
  className = "",
}) => {
  return (
    <div className={className}>
      <label className="block mb-2 text-sm font-semibold text-gray-700">
        {label}
      </label>
      <div className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-gray-50 flex items-center cursor-not-allowed">
        <span className="text-sm text-gray-500">{message}</span>
      </div>
    </div>
  );
};
