"use client";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useCheckIn } from "@/hooks/use-events";

export default function CheckInPage() {
  const [token, setToken] = useState("");
  const m = useCheckIn();
  const [last, setLast] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await m.mutateAsync(token).catch(() => null);
    if (r) { setLast(`${r.user_id} · ${new Date(r.attended_at!).toLocaleTimeString()}`); setToken(""); }
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="Event Check-In" description="Scan/enter QR token to mark attendance (FR-EM-009)" />
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-4 max-w-md space-y-3">
        <label className="text-xs text-slate-500">QR Token</label>
        <input value={token} onChange={(e) => setToken(e.target.value)} required autoFocus className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono" />
        <button disabled={m.isPending} className="w-full bg-primary text-white px-4 py-2 rounded text-sm">
          {m.isPending ? "Checking in..." : "Check In"}
        </button>
        {last && <div className="text-xs text-emerald-700">✓ Last checked: {last}</div>}
      </form>
    </div>
  );
}
