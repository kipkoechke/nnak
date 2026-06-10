"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import * as Flags from "country-flag-icons/react/3x2";
import { getCountryCallingCode, type Country } from "react-phone-number-input";
import { MdSearch, MdExpandMore, MdCheck } from "react-icons/md";

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
        {value && Flags[value as keyof typeof Flags] ? (
          (() => {
            const FlagIcon = Flags[value as keyof typeof Flags];
            return (
              <FlagIcon
                className="w-5.5 h-4 shrink-0 rounded-sm overflow-hidden"
                title={value}
              />
            );
          })()
        ) : (
          <span className="w-5 h-3.5 rounded-sm bg-gray-200 shrink-0" />
        )}
        <MdExpandMore
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Thin divider between dial-code button and phone input */}
      <span className="w-px h-5 bg-gray-200 shrink-0" aria-hidden="true" />

      {isOpen &&
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
            className="bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden"
          >
            {/* Search */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search countries…"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink text-sm text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-3 py-3 text-sm text-gray-500 text-center">
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
                          ? "bg-brand-pink-light text-brand-pink"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {(() => {
                        const FlagIcon =
                          Flags[option.value as keyof typeof Flags];
                        return FlagIcon ? (
                          <FlagIcon
                            className="w-5 h-[0.9rem] shrink-0 rounded-sm overflow-hidden"
                            title={option.label}
                          />
                        ) : (
                          <span className="w-5 h-3.5 rounded-sm bg-gray-200 shrink-0" />
                        );
                      })()}
                      <span className="flex-1 truncate">{option.label}</span>
                      <span className="text-gray-400 text-xs tabular-nums shrink-0">
                        {dial}
                      </span>
                      {isSelected && (
                        <MdCheck className="w-4 h-4 shrink-0 text-brand-pink" />
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
