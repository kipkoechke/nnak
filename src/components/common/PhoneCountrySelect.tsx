"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { getCountryCallingCode, type Country } from "react-phone-number-input";
import { MdSearch, MdExpandMore, MdCheck } from "react-icons/md";
import * as Flags from "country-flag-icons/react/3x2";

type FlagComponent = React.ComponentType<{
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}>;

type CountryCode = Country;

interface Option {
  value: CountryCode | undefined;
  label: string;
  divider?: boolean;
}

// Props injected by react-phone-number-input
export interface PhoneCountrySelectProps {
  value?: CountryCode;
  onChange: (value: CountryCode | undefined) => void;
  options: Option[];
  disabled?: boolean;
  readOnly?: boolean;
  tabIndex?: number;
  className?: string;
  unicodeFlags?: boolean;
}

/**
 * Look up the SVG flag for an ISO 3166-1 alpha-2 country code (e.g. "KE").
 * Unicode flag emojis don't render on most Windows + ChromeOS browsers,
 * so we ship inline SVGs from `country-flag-icons` instead.
 */
const Flag = ({ code, className }: { code?: Country; className?: string }) => {
  if (!code) return <span className={`bg-slate-200 rounded-sm ${className ?? ""}`} />;
  const FlagIcon = (Flags as unknown as Record<string, FlagComponent | undefined>)[code];
  if (!FlagIcon) {
    return (
      <span
        className={`inline-flex items-center justify-center bg-slate-100 text-[10px] font-semibold text-slate-700 rounded-sm ${className ?? ""}`}
      >
        {code}
      </span>
    );
  }
  return <FlagIcon title={code} className={`rounded-sm overflow-hidden ${className ?? ""}`} />;
};

export function PhoneCountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
  tabIndex,
}: PhoneCountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Exclude dividers and "International" (undefined value)
  const countryOptions = options.filter(
    (o): o is Option & { value: CountryCode } => !!o.value && !o.divider,
  );

  const filtered = countryOptions.filter((o) =>
    o.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return;
      setIsOpen(false);
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  // Position portal below the button
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 240),
      });
    }
  }, [isOpen]);

  // Focus search on open
  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled || readOnly}
        tabIndex={tabIndex}
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Select phone country code"
        className="flex items-center gap-1.5 pr-2 shrink-0 cursor-pointer disabled:cursor-not-allowed"
      >
        <Flag code={value} className="w-6 h-4 shrink-0" />
        <MdExpandMore
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Thin divider between dial-code button and phone input */}
      <span className="w-px h-5 bg-slate-200 shrink-0" aria-hidden="true" />

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999,
              minWidth: 240,
            }}
            className="bg-white border border-slate-300 rounded-lg shadow-lg max-h-64 overflow-hidden"
          >
            {/* Search */}
            <div className="p-2 border-b border-slate-200">
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search countries…"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm text-slate-900 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-3 py-3 text-sm text-slate-500 text-center">
                  No countries found
                </p>
              ) : (
                filtered.map((option) => {
                  const isSelected = option.value === value;
                  const dial = `+${getCountryCallingCode(option.value)}`;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Flag code={option.value} className="w-5 h-3.5 shrink-0" />
                      <span className="flex-1 truncate">{option.label}</span>
                      <span className="text-slate-400 text-xs tabular-nums shrink-0">
                        {dial}
                      </span>
                      {isSelected && (
                        <MdCheck className="w-4 h-4 shrink-0 text-primary" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
