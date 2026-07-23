"use client";
import { useCallback, useState } from "react";
import {
  MdAdd,
  MdClose,
  MdPerson,
  MdSearch,
  MdWarningAmber,
} from "react-icons/md";

/* ─────────────────────────────────────────────────────────────────────────
 *  Formatters
 * ────────────────────────────────────────────────────────────────────── */

export const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const fmtTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

export const fmtDateTime = (iso?: string | null) =>
  iso ? `${fmtDate(iso)} · ${fmtTime(iso)}` : "—";

export const fmtRange = (start?: string | null, end?: string | null) => {
  if (!start || !end) return "—";
  const s = new Date(start);
  const e = new Date(end);
  if (s.toDateString() === e.toDateString()) return fmtDate(start);
  const sameYear = s.getFullYear() === e.getFullYear();
  if (sameYear && s.getMonth() === e.getMonth())
    return `${s.getDate()}–${e.getDate()} ${s.toLocaleString("en-GB", {
      month: "short",
      year: "numeric",
    })}`;
  return `${fmtDate(start)} → ${fmtDate(end)}`;
};

export const fmtMoney = (v?: number | string | null) =>
  `KES ${Number(v ?? 0).toLocaleString()}`;

/** Day key used to group agenda items into a timeline. */
export const dayKey = (iso: string) => new Date(iso).toDateString();

export const fmtDayHeading = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

/* ─────────────────────────────────────────────────────────────────────────
 *  Modal
 * ────────────────────────────────────────────────────────────────────── */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) => {
  if (!open) return null;
  const maxW =
    size === "sm" ? "max-w-md" : size === "lg" ? "max-w-2xl" : "max-w-lg";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1 shrink-0"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

/**
 * Slides in from the right for read-heavy detail (a booking and its invoice,
 * attendees and tickets) that would feel cramped in a centred dialog.
 */
export const Drawer = ({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-lg h-full shadow-2xl overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-3 z-10">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1 shrink-0"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-5">{children}</div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
 *  Confirmation
 * ────────────────────────────────────────────────────────────────────── */

interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel?: string;
  tone?: "danger" | "default";
}

/**
 * Replaces the browser `confirm()`, which blocks the tab and cannot be styled.
 * Returns a promise so call sites keep reading top-to-bottom.
 */
export function useConfirm() {
  const [pending, setPending] = useState<
    (ConfirmOptions & { resolve: (v: boolean) => void }) | null
  >(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  );

  const settle = (value: boolean) =>
    setPending((current) => {
      current?.resolve(value);
      return null;
    });

  const danger = pending?.tone !== "default";

  const dialog = (
    <Modal
      open={!!pending}
      onClose={() => settle(false)}
      title={pending?.title ?? ""}
      size="sm"
    >
      <div className="flex gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            danger ? "bg-red-50 text-red-600" : "bg-primary/10 text-primary"
          }`}
        >
          <MdWarningAmber className="w-5 h-5" />
        </div>
        <p className="text-sm text-slate-600 leading-relaxed pt-2">
          {pending?.body ?? "This action cannot be undone."}
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-5">
        <button
          onClick={() => settle(false)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={() => settle(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
            danger
              ? "bg-red-600 hover:bg-red-700"
              : "bg-primary hover:bg-primary/90"
          }`}
        >
          {pending?.confirmLabel ?? "Delete"}
        </button>
      </div>
    </Modal>
  );

  return { confirm, dialog };
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Form controls
 * ────────────────────────────────────────────────────────────────────── */

const controlClass =
  "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow";

export const Field = ({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
}) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 mb-1">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className={controlClass}
    />
    {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

export const TextArea = ({
  label,
  value,
  onChange,
  rows = 3,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  required?: boolean;
  placeholder?: string;
}) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 mb-1">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      required={required}
      placeholder={placeholder}
      className={`${controlClass} resize-y`}
    />
  </div>
);

export const Select = ({
  label,
  value,
  onChange,
  children,
  required,
  className = "",
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) => (
  <div className={className}>
    {label && (
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className={controlClass}
    >
      {children}
    </select>
  </div>
);

export const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="rounded border-slate-300 text-primary focus:ring-primary/30"
    />
    {label}
  </label>
);

export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) => (
  <div className={`relative ${className}`}>
    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${controlClass} pl-9`}
    />
  </div>
);

/** Row of round filter buttons — used for booking status, approval, etc. */
export const FilterPills = <T extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) => (
  <div className="flex flex-wrap items-center gap-1.5">
    {options.map((opt) => (
      <button
        key={opt.value || "all"}
        onClick={() => onChange(opt.value)}
        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
          value === opt.value
            ? "bg-primary text-white border-primary"
            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

/** Wraps the search + filter controls that sit above every listing. */
export const Toolbar = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row md:items-center gap-3">
    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
 *  Layout & display
 * ────────────────────────────────────────────────────────────────────── */

export const SectionHeader = ({
  title,
  description,
  count,
  action,
}: {
  title: string;
  description?: string;
  count?: number;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {typeof count === "number" && (
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 rounded-full px-2 py-0.5 tabular-nums">
            {count}
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      )}
    </div>
    {action}
  </div>
);

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <div className="bg-white border border-dashed border-slate-300 rounded-xl py-12 px-6 text-center">
    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    {description && (
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
        {description}
      </p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const AddBtn = ({
  onClick,
  label = "Add",
}: {
  onClick: () => void;
  label?: string;
}) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-primary/90 shadow-sm transition-colors"
  >
    <MdAdd className="w-4 h-4" /> {label}
  </button>
);

export const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white border border-slate-200 rounded-xl p-4 ${className}`}
  >
    {children}
  </div>
);

export const Row = ({
  label,
  value,
  mono,
  cap,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  cap?: boolean;
}) => (
  <div className="flex items-center justify-between gap-3 border-b border-slate-100 last:border-0 pb-2 last:pb-0">
    <span className="text-xs text-slate-500 shrink-0">{label}</span>
    <span
      className={`text-sm text-slate-900 font-medium text-right min-w-0 truncate ${
        mono ? "font-mono text-xs" : ""
      } ${cap ? "capitalize" : ""}`}
    >
      {value}
    </span>
  </div>
);

export const StatTile = ({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: string | number;
  tone?: "default" | "ok" | "warn";
  hint?: string;
}) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4">
    <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
      {label}
    </div>
    <div
      className={`text-2xl font-bold mt-1 tabular-nums ${
        tone === "ok"
          ? "text-emerald-600"
          : tone === "warn"
            ? "text-amber-600"
            : "text-slate-900"
      }`}
    >
      {value}
    </div>
    {hint && <div className="text-[11px] text-slate-400 mt-0.5">{hint}</div>}
  </div>
);

export const Badge = ({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "primary" | "emerald" | "amber" | "red" | "blue";
}) => {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

export const Avatar = ({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md";
}) => {
  const dim = size === "sm" ? "w-9 h-9 text-xs" : "w-12 h-12 text-sm";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${dim} rounded-full object-cover border border-slate-200 shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0`}
    >
      {initials || <MdPerson className="w-5 h-5" />}
    </div>
  );
};

/**
 * Row actions sit inside a card that is itself hoverable, so they fade in on
 * pointer devices but stay visible where hover does not exist (touch).
 */
export const RowActions = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-0.5 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
    {children}
  </div>
);

export const IconButton = ({
  onClick,
  title,
  tone = "default",
  children,
}: {
  onClick: () => void;
  title: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    title={title}
    aria-label={title}
    className={`p-1.5 rounded-lg transition-colors ${
      tone === "danger"
        ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
        : "text-slate-400 hover:text-primary hover:bg-slate-100"
    }`}
  >
    {children}
  </button>
);

/* ─────────────────────────────────────────────────────────────────────────
 *  Table
 * ────────────────────────────────────────────────────────────────────── */

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  className?: string;
  render: (row: T) => React.ReactNode;
}

/** Shared table shell so every listing gets the same header, zebra and hover. */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-2.5 font-semibold whitespace-nowrap ${
                    c.align === "right" ? "text-right" : ""
                  }`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`odd:bg-white even:bg-slate-50/40 hover:bg-primary/5 transition-colors ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-2.5 align-middle ${
                      c.align === "right" ? "text-right" : ""
                    } ${c.className ?? ""}`}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Skeletons
 * ────────────────────────────────────────────────────────────────────── */

export const SkeletonList = () => (
  <div className="space-y-2">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse"
      >
        <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    ))}
  </div>
);

export const SkeletonGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse"
      >
        <div className="flex gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-2/3" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
 *  Form footer
 * ────────────────────────────────────────────────────────────────────── */

export const FormActions = ({
  onCancel,
  saving,
  submitLabel,
}: {
  onCancel: () => void;
  saving?: boolean;
  submitLabel: string;
}) => (
  <div className="flex justify-end gap-2 pt-2">
    <button
      type="button"
      onClick={onCancel}
      className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={saving}
      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
    >
      {saving ? "Saving…" : submitLabel}
    </button>
  </div>
);
