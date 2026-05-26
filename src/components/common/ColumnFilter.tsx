"use client";

import { useState } from "react";
import { MdFilterList } from "react-icons/md";
import { useOutsideClick } from "../../hooks/useOutsideClick";

interface ColumnFilterOption {
  value: string;
  label: string;
}

interface ColumnFilterProps {
  /** Header label rendered next to the filter icon */
  label: string;
  /** Currently selected value ("" means no filter / all) */
  value: string;
  onChange: (value: string) => void;
  options: ColumnFilterOption[];
  /** Label for the "all" / clear option */
  allLabel?: string;
}

export function ColumnFilter({
  label,
  value,
  onChange,
  options,
  allLabel = "All",
}: ColumnFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useOutsideClick(() => setOpen(false));
  const active = value !== "";

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        title={`Filter by ${label.toLowerCase()}`}
        aria-label={`Filter by ${label.toLowerCase()}`}
        className={`inline-flex items-center gap-1 px-1 py-0.5 rounded transition-colors ${
          active ? "text-primary" : "text-slate-500 hover:text-primary"
        }`}
      >
        <span className="font-medium">{label}</span>
        <MdFilterList className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[12rem] bg-white border border-slate-200 rounded-lg shadow-lg py-1 normal-case">
          <button
            type="button"
            onClick={() => select("")}
            className={`w-full text-left px-3 py-2 text-sm ${
              value === ""
                ? "bg-primary-subtle text-primary font-medium"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {allLabel}
          </button>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => select(o.value)}
              className={`w-full text-left px-3 py-2 text-sm ${
                value === o.value
                  ? "bg-primary-subtle text-primary font-medium"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ColumnFilter;
