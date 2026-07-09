"use client";
import { useEffect, useRef, useState } from "react";
import { MdClose, MdHeadsetMic, MdMailOutline, MdPhone } from "react-icons/md";

const SUPPORT_PHONE = "+254-725-072263";
const SUPPORT_EMAIL = "info@nnak.or.ke";

/**
 * Floating "Contact us" support button, pinned to the bottom-right. Clicking
 * it reveals NNAK's support phone and email.
 */
export default function SupportButton() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-3"
    >
      {open && (
        <div className="w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-slate-900">Contact us</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Close support"
            >
              <MdClose className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <a
              href={`tel:${SUPPORT_PHONE.replace(/[^+\d]/g, "")}`}
              className="flex items-center gap-2 text-slate-700 hover:text-primary"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-subtle text-primary shrink-0">
                <MdPhone className="w-4 h-4" />
              </span>
              <span>
                <span className="block text-[11px] text-slate-400">Phone</span>
                {SUPPORT_PHONE}
              </span>
            </a>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center gap-2 text-slate-700 hover:text-primary"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-subtle text-primary shrink-0">
                <MdMailOutline className="w-4 h-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] text-slate-400">Email</span>
                <span className="truncate">{SUPPORT_EMAIL}</span>
              </span>
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Contact support"
        aria-expanded={open}
      >
        {open ? (
          <MdClose className="w-6 h-6" />
        ) : (
          <MdHeadsetMic className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
