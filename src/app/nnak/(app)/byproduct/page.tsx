"use client";
import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import { useByProductUploads, useUploadByProduct } from "@/hooks/use-byproduct";
import { useNnakBranches } from "@/hooks/use-branches";
import { useNnakMe } from "@/hooks/use-auth";

/** Parse simple CSV: national_id,name,amount */
function parseCsv(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l, i) => !(i === 0 && /national_?id/i.test(l)))
    .map((line) => {
      const [national_id, name, amount] = line.split(",").map((s) => s.trim());
      return { national_id, name, amount: Number(amount) || 0 };
    });
}

export default function ByProductPage() {
  const { data: me } = useNnakMe();
  const { data: branches = [] } = useNnakBranches();
  const { data: uploads = [] } = useByProductUploads();
  const upload = useUploadByProduct();
  const [branchId, setBranchId] = useState("");
  const [period, setPeriod] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [csvText, setCsvText] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId || !me) return;
    const lines = parseCsv(csvText);
    if (!lines.length) { alert("CSV has no lines"); return; }
    await upload.mutateAsync({ branch_id: branchId, period_month: period, uploaded_by: me.id, lines });
    setCsvText("");
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    setCsvText(await f.text());
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="By-Product Reconciliation" description="Upload branch monthly remittance (FR-MP-010)" />
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Branch</label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
            <option value="">— Select —</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Period (YYYY-MM)</label>
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">CSV File (national_id,name,amount)</label>
          <input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} className="w-full text-sm" />
        </div>
        <div className="md:col-span-3">
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={6}
            placeholder="Paste CSV here:&#10;national_id,name,amount&#10;12345678,Jane Doe,500"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono"
          />
        </div>
        <div className="md:col-span-3 flex justify-end">
          <button disabled={upload.isPending} className="bg-primary text-white px-4 py-2 rounded text-sm">
            {upload.isPending ? "Processing..." : "Upload & Reconcile"}
          </button>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-3 text-sm font-semibold border-b">Recent uploads</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-3 py-2">Period</th><th className="px-3 py-2">Branch</th><th className="px-3 py-2">Records</th><th className="px-3 py-2">Matched</th><th className="px-3 py-2">Flagged</th><th className="px-3 py-2">Amount</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {uploads.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-500 text-sm">No uploads yet</td></tr>
            )}
            {uploads.map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-2">{u.period_month}</td>
                <td className="px-3 py-2">{branches.find((b) => b.id === u.branch_id)?.name || "—"}</td>
                <td className="px-3 py-2">{u.total_records}</td>
                <td className="px-3 py-2 text-emerald-700">{u.matched}</td>
                <td className="px-3 py-2 text-red-700">{u.flagged}</td>
                <td className="px-3 py-2">KES {u.total_amount.toLocaleString()}</td>
                <td className="px-3 py-2"><Link href={`/nnak/byproduct/${u.id}`} className="text-xs text-primary">Details</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
