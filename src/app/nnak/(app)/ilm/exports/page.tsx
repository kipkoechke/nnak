"use client";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useDataExports, useDecideExport, useRequestExport } from "@/hooks/use-ilm";
import { useNnakMe } from "@/hooks/use-auth";

export default function ExportsPage() {
  const { data: me } = useNnakMe();
  const { data = [] } = useDataExports();
  const req = useRequestExport();
  const decide = useDecideExport();
  const [form, setForm] = useState({ scope: "members", reason: "", destination: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return;
    await req.mutateAsync({ requested_by: me.id, ...form });
    setForm({ scope: "members", reason: "", destination: "" });
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="Data Export Requests" description="Bulk personal-data export approval (ILM-007)" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
          <div className="text-sm font-semibold">Request New Export</div>
          <select value={form.scope} onChange={(e) => setForm({...form, scope: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
            <option value="members">All members</option><option value="payments">All payments</option><option value="events">Event registrants</option>
          </select>
          <textarea value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} required placeholder="Reason" rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <input value={form.destination} onChange={(e) => setForm({...form, destination: e.target.value})} required placeholder="Destination (email / system)" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <button className="w-full bg-primary text-white text-sm px-3 py-2 rounded">Submit Request</button>
        </form>
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-3 py-2">When</th><th className="px-3 py-2">Scope</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-sm text-slate-500">No export requests</td></tr>}
              {data.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2 text-xs">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{e.scope}</td>
                  <td className="px-3 py-2 capitalize">{e.status}</td>
                  <td className="px-3 py-2">
                    {e.status === "pending" && me && (
                      <>
                        <button onClick={() => decide.mutate({ id: e.id, approver: me.id, approve: true })} className="text-xs bg-emerald-600 text-white px-2 py-1 rounded mr-1">Approve</button>
                        <button onClick={() => decide.mutate({ id: e.id, approver: me.id, approve: false })} className="text-xs bg-red-600 text-white px-2 py-1 rounded">Reject</button>
                      </>
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
