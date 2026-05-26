"use client";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { useAuditLog } from "@/hooks/use-ilm";

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const { data } = useAuditLog({ page, per_page: 20 });
  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="Audit Log" description="Immutable record of personal-data access (ILM-004)" />
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-3 py-2">When</th><th className="px-3 py-2">User</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">Resource</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-sm text-slate-500">No audit events yet</td></tr>}
            {data?.data.map((e) => (
              <tr key={e.id}>
                <td className="px-3 py-2 text-xs">{new Date(e.occurred_at).toLocaleString()}</td>
                <td className="px-3 py-2 text-xs">{e.user_email || e.user_id}</td>
                <td className="px-3 py-2 font-mono text-xs">{e.action}</td>
                <td className="px-3 py-2 text-xs">{e.resource} {e.resource_id ? `#${e.resource_id.slice(0,8)}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && <Pagination currentPage={data.meta.current_page} totalPages={data.meta.last_page} totalItems={data.meta.total} onPageChange={setPage} />}
      </div>
    </div>
  );
}
