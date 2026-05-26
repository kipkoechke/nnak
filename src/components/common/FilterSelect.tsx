"use client";

interface FilterSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "All",
  className = "",
  size = "md",
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 bg-white ${
          size === "sm" ? "px-3 py-1 text-sm" : "px-4 py-3"
        }`}
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
    </div>
  );
};
