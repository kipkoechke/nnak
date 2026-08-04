"use client";
import Link from "next/link";

/**
 * Data Protection Act, 2019 consent gate shown on the registration and
 * account-claim forms. Ticking it is how the user authorizes processing, per
 * the Privacy Policy, so it is required before the form can be submitted.
 */
export function ConsentCheckbox({
  checked,
  onChange,
  error,
  id = "privacy-consent",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
  id?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-start gap-2.5 text-sm text-slate-600 cursor-pointer select-none"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={!!error}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/30"
        />
        <span className="leading-snug">
          I have read and agree to the{" "}
          <Link
            href="/nnak/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Privacy Policy
          </Link>
          , and I consent to NNAK processing my personal and professional data
          as described, in accordance with the Kenya Data Protection Act, 2019.
        </span>
      </label>
      {error && <p className="mt-1 text-xs text-red-600 ml-6">{error}</p>}
    </div>
  );
}
