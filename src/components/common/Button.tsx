"use client";

import Link from "next/link";
import clsx from "clsx";
import React from "react";

type ButtonType =
  | "primary"
  | "secondary"
  | "small"
  | "small-secondary"
  | "round";
type HtmlButtonType = "button" | "submit" | "reset";

interface ButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  to?: string;
  type?: ButtonType;
  htmlType?: HtmlButtonType;
  onClick?: () => void;
  className?: string;
}

const baseStyles =
  "inline-flex items-center justify-center rounded-lg font-semibold uppercase tracking-wide transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed cursor-pointer";

const types: Record<ButtonType, string> = {
  primary: clsx(
    baseStyles,
    "bg-primary text-white hover:bg-primary/90 focus:bg-primary focus:ring-primary px-6 py-3 sm:px-8 sm:py-4 md:px-6 md:py-3",
  ),
  secondary: clsx(
    baseStyles,
    "border-2 border-primary text-primary bg-white hover:bg-primary-subtle focus:bg-primary-subtle focus:ring-primary px-6 py-3",
  ),
  small: clsx(
    baseStyles,
    "bg-primary text-white hover:bg-primary/90 focus:bg-primary focus:ring-primary px-4 py-2 md:px-3 md:py-1.5 text-xs",
  ),
  "small-secondary": clsx(
    baseStyles,
    "border-2 border-primary text-primary bg-white hover:bg-primary-subtle focus:bg-primary-subtle focus:ring-primary px-4 py-2 md:px-3 md:py-1 text-xs",
  ),
  round: clsx(
    baseStyles,
    "bg-primary text-white hover:bg-primary/90 focus:bg-primary focus:ring-primary px-2.5 py-1 md:px-3.5 md:py-2 text-sm rounded-full",
  ),
};

const Button = ({
  children,
  disabled = false,
  to,
  type = "primary",
  htmlType = "button",
  onClick,
  className: additionalClassName,
}: ButtonProps) => {
  const className = clsx(types[type], additionalClassName);

  if (to) {
    return (
      <Link href={to} className={className} aria-disabled={disabled}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={htmlType}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
};

export default Button;
