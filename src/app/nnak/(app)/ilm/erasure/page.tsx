"use client";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useCompleteErasure, useErasures, useRequestErasure } from "@/hooks/nnak/use-ilm";
import { useMembers } from "@/hooks/nnak/use-members";

export default function ErasurePage() {
  const { data: members } = useMembers({ per_page: 1000 });
  const { data = [] } = useErasures();
  const request = useRequestErasure();
  const complete = useCompleteErasure();
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const m = members?.data.find((x) => x.id === userId);
    if (!m) return;
    await request.mutateAsync({ user_id: userId, user_email: m.email, reason });
    setUserId(""); setReason("");
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="Right to Erasure" description="DPA 2019 §40 (ILM-005) — anonymise after 30 days" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
          <div className="text-sm font-semibold">New Erasure Request</div>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
            <option value="">— Select member —</option>
            {members?.data.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
          </select>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="Reason for erasure" rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <button className="w-full bg-primary text-white text-sm px-3 py-2 rounded">Submit Request</button>
        </form>
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-3 py-2">When</th><th className="px-3 py-2">Member</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-sm text-slate-500">No erasure requests</td></tr>}
              {data.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2 text-xs">{new Date(e.requested_at).toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs">{e.user_email || e.user_id}</td>
                  <td className="px-3 py-2 capitalize">{e.status}</td>
                  <td className="px-3 py-2">
                    {e.status === "pending" && (
                      <button onClick={() => confirm("Anonymise this member's PII? Financial records retained per Tax Act.") && complete.mutate(e.id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                        Anonymise
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
