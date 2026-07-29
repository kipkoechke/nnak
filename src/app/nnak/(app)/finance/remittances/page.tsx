"use client";
import { filterOptions, humanizeFilter } from "@/lib/available-filters";
import { useMemo, useState } from "react";
import { MdSwapHoriz } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import DownloadButton from "@/components/common/DownloadButton";
import { useFinanceRemittances, useFinanceBranches } from "@/hooks/use-finance";
import { financeService } from "@/services/finance.service";
import { collectAllPages, type ExcelColumn } from "@/lib/export-excel";
import { fmtKes } from "@/lib/commission";
import type { FinanceRemittanceItem } from "@/types/nnak";

const toISO = (d: Date) => d.toISOString().slice(0, 10);

const fmtDate = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const PERIOD_PRESETS: { label: string; getDates: () => { start: string; end: string } }[] = [
  {
    label: "This month",
    getDates: () => {
      const today = new Date();
      return {
        start: toISO(new Date(today.getFullYear(), today.getMonth(), 1)),
        end: toISO(today),
      };
    },
  },
  {
    label: "Last month",
    getDates: () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: toISO(start), end: toISO(end) };
    },
  },
  {
    label: "This year",
    getDates: () => {
      const today = new Date();
      return {
        start: toISO(new Date(today.getFullYear(), 0, 1)),
        end: toISO(today),
      };
    },
  },
];

export default function FinanceRemittancesPage() {
  const init = useMemo(() => PERIOD_PRESETS[0].getDates(), []);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");
  const [branchId, setBranchId] = useState("");
  const [startDate, setStartDate] = useState(init.start);
  const [endDate, setEndDate] = useState(init.end);

  // The route advertises the categories it accepts.
  const CATEGORY_FALLBACK = [
    { value: "", label: "All categories" },
    { value: "mpesa", label: "M-Pesa" },
    { value: "batch", label: "Batch" },
  ];

  const { data, isLoading } = useFinanceRemittances({
    page,
    per_page: 15,
    category: category !== "all" ? category : undefined,
    branch_id: branchId || undefined,
    start_date: startDate,
    end_date: endDate,
  });

  const { data: branchesData } = useFinanceBranches({ per_page: 100 });
  const branches = branchesData?.data ?? [];
  const categoryOptions = filterOptions(
    data?.listing?.available_filters?.category,
    CATEGORY_FALLBACK,
    "All categories",
    (v) => (v === "mpesa" ? "M-Pesa" : humanizeFilter(v)),
  );

  const remittances = data?.data ?? [];
  const meta = data?.meta;
  // Absent when the whole result set fits on one page.
  const pagination = data?.pagination;

  const exportColumns: ExcelColumn<FinanceRemittanceItem>[] = [
    { header: "Type", value: (r) => r.type },
    { header: "Payer", value: (r) => r.payer_name ?? "" },
    { header: "Phone", value: (r) => r.phone ?? "" },
    { header: "Reference", value: (r) => r.reference ?? "" },
    { header: "Receipt", value: (r) => r.receipt ?? "" },
    { header: "Amount", value: (r) => Number(r.amount ?? 0) },
    { header: "Date", value: (r) => fmtDate(r.created_at) },
  ];

  const fetchExportRows = () =>
    collectAllPages<FinanceRemittanceItem>((p) =>
      financeService.remittances({
        page: p,
        per_page: 100,
        category: category !== "all" ? category : undefined,
        branch_id: branchId || undefined,
        start_date: startDate,
        end_date: endDate,
      }),
    );

  return (
    <div className="absolute inset-0 flex flex-col px-4 py-4 gap-3 overflow-hidden">
      <PageHeader
        title="Remittances"
        description="Track M-Pesa and batch remittance history"
        action={
          <DownloadButton
            filename="remittances"
            sheetName="Remittances"
            columns={exportColumns}
            fetchRows={fetchExportRows}
          />
        }
      />

      {/* Summary */}
      {meta?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <SummaryCard label="Total" value={fmtKes(meta.summary.total)} />
          <SummaryCard label="M-Pesa" value={fmtKes(meta.summary.mpesa)} accent="emerald" />
          <SummaryCard label="Batch" value={fmtKes(meta.summary.batch)} accent="blue" />
          <SummaryCard label="Count" value={String(meta.summary.count)} accent="slate" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center shrink-0">
        {/* Period presets */}
        {PERIOD_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              const { start, end } = p.getDates();
              setStartDate(start);
              setEndDate(end);
              setPage(1);
            }}
            className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors bg-white text-slate-700 border-slate-200 hover:border-primary hover:text-primary"
          >
            {p.label}
          </button>
        ))}
        <div className="flex items-center gap-1 ml-1">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-2 py-1.5 border border-slate-300 rounded-md text-sm"
          />
          <span className="text-slate-400 text-sm">→</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-2 py-1.5 border border-slate-300 rounded-md text-sm"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          {categoryOptions.map((o) => (
            <option key={o.value || "all"} value={o.value || "all"}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={branchId}
          onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {meta?.date_range && (
        <div className="text-xs text-slate-500 shrink-0">
          Showing {fmtDate(meta.date_range.start)} → {fmtDate(meta.date_range.end)}
        </div>
      )}

      <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-lg overflow-auto">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : remittances.length === 0 ? (
          <div className="p-12 text-center">
            <MdSwapHoriz className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No remittances for this period.</p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[580px]">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 sticky top-0">
              <tr>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Payer</th>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {remittances.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        r.type === "mpesa"
                          ? "bg-emerald-50 text-emerald-700"
                          : r.type === "batch"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {r.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div className="text-slate-900">{r.payer_name || "—"}</div>
                    {r.phone && (
                      <div className="text-[11px] text-slate-400">{r.phone}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">
                    <div>{r.reference || "—"}</div>
                    {/* Batch remittances mirror the reference into `receipt`. */}
                    {r.receipt && r.receipt !== r.reference && (
                      <div className="text-[11px] text-slate-400">
                        {r.receipt}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-900">
                    {fmtKes(r.amount)}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{fmtDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination && pagination.last_page > 1 ? (
        <div className="shrink-0">
          <Pagination
            currentPage={page}
            totalPages={pagination.last_page}
            totalItems={pagination.total}
            onPageChange={setPage}
          />
        </div>
      ) : (
        remittances.length > 0 && (
          <div className="shrink-0 text-xs text-slate-500">
            Showing {remittances.length} remittance
            {remittances.length === 1 ? "" : "s"}
            {meta?.summary ? ` of ${meta.summary.count}` : ""}
          </div>
        )
      )}
    </div>
  );
}

const SummaryCard = ({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: string;
  accent?: "slate" | "emerald" | "blue";
}) => {
  const accentCls: Record<string, string> = {
    slate: "text-slate-900",
    emerald: "text-emerald-700",
    blue: "text-blue-700",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-lg font-bold mt-1 ${accentCls[accent]}`}>{value}</div>
    </div>
  );
};
