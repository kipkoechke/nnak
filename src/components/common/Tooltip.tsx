"use client";

import React from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  /** Tooltip position relative to children */
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const sideStyles: Record<NonNullable<TooltipProps["side"]>, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export function Tooltip({
  content,
  children,
  side = "top",
  className = "",
}: TooltipProps) {
  return (
    <span className={`relative inline-flex group ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 ${sideStyles[side]} whitespace-nowrap px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-200 shadow-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 transition duration-150 origin-center`}
      >
        {content}
      </span>
    </span>
  );
}

export default Tooltip;
