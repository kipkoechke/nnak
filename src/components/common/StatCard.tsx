
import React from "react";
import Link from "next/link";

interface StatCardProps {
  title: string | React.ReactNode;
  mainValue: string | number;
  subtitle?: string | React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  percentage?: number | React.ReactNode;
  percentageLabel?: string | React.ReactNode;
  percentageColor?: "green" | "blue" | "yellow" | "red";
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  mainValue,
  subtitle,
  href,
  onClick,
  className = "",
  children,
  percentage,
  percentageLabel,
  percentageColor = "green",
}) => {
  // Define color classes for percentage badges - more subtle
  const percentageColorClasses = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-primary",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
  };

  const CardContent = (
    <div
      className={`bg-white rounded-lg shadow py-2 px-2 md:px-4 items-center flex flex-col justify-center hover:shadow-lg transition-shadow h-full ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between w-full h-full">
        <div className="w-full flex flex-col justify-between h-full">
          <div>
            <h3 className="text-[10px] md:text-sm text-gray-800 mb-1 font-bold line-clamp-2">
              {title}
            </h3>

            <div className="flex gap-2 md:gap-4 items-center">
              {children}
              <div className="text-lg md:text-3xl font-bold text-gray-950">
                {mainValue}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {subtitle && (
                <div className="text-[10px] md:text-xs text-blue-900 font-bold mt-1">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          {/* Percentage area - always present to maintain consistent spacing */}
          <div className="mt-1 flex items-end">
            {percentage !== undefined ? (
              typeof percentage === "number" ? (
                <div
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-semibold ${percentageColorClasses[percentageColor]}`}
                >
                  <span>{percentage.toFixed(1)}%</span>
                  {percentageLabel && (
                    <span className="opacity-75">{percentageLabel}</span>
                  )}
                </div>
              ) : (
                percentage
              )
            ) : (
              <div className=""></div> // Placeholder to maintain consistent height
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // If href is provided, wrap the content in a Link
  if (href) {
    return (
      <Link href={href} className="block h-full">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
};

export default StatCard;
