import React from "react";
import { FaArrowLeft } from "react-icons/fa";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = "Back",
  className = "",
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-2 px-4 py-2
        text-sm font-medium text-gray-700
        bg-white border border-gray-300 rounded-lg
        hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer disabled:hover:bg-white
        ${className}
      `}
    >
      <FaArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
};

export default BackButton;
