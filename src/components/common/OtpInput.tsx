"use client";
import {
  ClipboardEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  label?: string;
  hint?: string;
  error?: string;
  onComplete?: (v: string) => void;
}

/**
 * Segmented OTP input with paste handling and auto-advance. Renders
 * `length` boxes; the visible value is a single digit string of that length.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus = true,
  disabled,
  label,
  hint,
  error,
  onComplete,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = useMemo(() => {
    const arr = (value || "").replace(/\D/g, "").slice(0, length).split("");
    while (arr.length < length) arr.push("");
    return arr;
  }, [value, length]);

  useEffect(() => {
    if (autoFocus && refs.current[0] && !value) refs.current[0].focus();
  }, [autoFocus, value]);

  useEffect(() => {
    if (value.length === length && onComplete) onComplete(value);
  }, [value, length, onComplete]);

  const setAt = (idx: number, ch: string) => {
    const arr = [...digits];
    arr[idx] = ch;
    const next = arr.join("").replace(/\s+/g, "");
    onChange(next);
  };

  const handleChange = (idx: number, raw: string) => {
    const ch = raw.replace(/\D/g, "").slice(-1);
    if (!ch) {
      setAt(idx, "");
      return;
    }
    setAt(idx, ch);
    if (idx < length - 1) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        setAt(idx, "");
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus();
        setAt(idx - 1, "");
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && idx > 0) {
      refs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const txt = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!txt) return;
    e.preventDefault();
    const next = txt.slice(0, length);
    onChange(next);
    const target = Math.min(next.length, length - 1);
    refs.current[target]?.focus();
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="flex gap-2 justify-between">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            disabled={disabled}
            className={`w-full max-w-[52px] h-12 sm:h-14 text-center text-lg sm:text-xl font-semibold rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${
              error
                ? "border-red-300 focus:border-red-500"
                : "border-slate-300 focus:border-primary"
            } disabled:bg-slate-100 disabled:text-slate-400`}
          />
        ))}
      </div>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

interface OtpCountdownProps {
  seconds: number;
  onResend: () => void;
  resendLabel?: string;
  pending?: boolean;
  /** When the parent restarts, change this key (e.g. an incrementing nonce). */
  restartKey?: number;
}

/**
 * Resend countdown helper. Disables the resend button until `seconds`
 * elapse, then becomes a clickable "Resend code" link. Reset by bumping
 * `restartKey`.
 */
export function OtpCountdown({
  seconds,
  onResend,
  resendLabel = "Resend code",
  pending,
  restartKey = 0,
}: OtpCountdownProps) {
  const ref = useRef<number>(seconds);
  const [, force] = useTick();

  useEffect(() => {
    ref.current = seconds;
    force();
    const id = window.setInterval(() => {
      if (ref.current > 0) {
        ref.current -= 1;
        force();
      } else {
        window.clearInterval(id);
      }
    }, 1000);
    return () => window.clearInterval(id);
    // restart on key change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartKey, seconds]);

  const remaining = ref.current;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="flex items-center justify-between text-xs text-slate-500">
      <span>
        {remaining > 0 ? (
          <>
            Code expires in{" "}
            <span className="font-mono font-semibold text-slate-700">
              {mm}:{ss}
            </span>
          </>
        ) : (
          <span className="text-slate-500">Didn&apos;t get the code?</span>
        )}
      </span>
      <button
        type="button"
        onClick={onResend}
        disabled={remaining > 0 || pending}
        className="text-primary font-semibold hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
      >
        {pending ? "Sending…" : resendLabel}
      </button>
    </div>
  );
}

function useTick(): [number, () => void] {
  const [n, setN] = useState(0);
  return [n, () => setN((x) => x + 1)];
}
