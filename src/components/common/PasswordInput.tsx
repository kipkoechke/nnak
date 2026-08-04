"use client";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

/**
 * Password field with a show/hide toggle, for the pages that use plain
 * controlled inputs. Forms built on react-hook-form use `InputField`, which
 * carries the same toggle.
 *
 * `className` is the caller's own input styling — the wrapper only reserves
 * room on the right for the eye button.
 */
export default function PasswordInput({
  className = "",
  ...rest
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        {...rest}
        type={show ? "text" : "password"}
        className={`${className} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        title={show ? "Hide password" : "Show password"}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none"
      >
        {show ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
      </button>
    </div>
  );
}
