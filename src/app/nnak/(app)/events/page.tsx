"use client";
import { useState } from "react";
import Link from "next/link";
import { MdAdd } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import { useEvents } from "@/hooks/use-events";

const STATUS: Record<string, string> = {
  draft: "bg-slate-50 text-slate-700",
  published: "bg-emerald-50 text-emerald-700",
  closed: "bg-amber-50 text-amber-700",
  completed: "bg-blue-50 text-blue-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function EventsPage() {
  const [status, setStatus] = useState("");
  const { data, isLoading } = useEvents({ status: status || undefined });

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Events"
        description="NNAK event management"
        action={
          <Link href="/nnak/events/new" className="inline-flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-sm">
            <MdAdd className="w-4 h-4" /> New Event
          </Link>
        }
      />
      <div className="flex gap-2">
        {["", "draft", "published", "completed", "cancelled"].map((s) => (
          <button key={s || "all"} onClick={() => setStatus(s)} className={`text-xs px-3 py-1.5 rounded-full border ${status === s ? "bg-primary text-white border-primary" : "bg-white text-slate-700 border-slate-200"}`}>
            {s || "All"}
          </button>
        ))}
      </div>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : !data?.data.length ? (
          <div className="p-6 text-sm text-slate-500 text-center">No events yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-3 py-2">Event</th><th className="px-3 py-2">When</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Registrants</th><th className="px-3 py-2">Revenue</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link href={`/nnak/events/${e.id}`} className="font-semibold text-primary hover:underline">{e.title}</Link>
                    <div className="text-xs text-slate-500 capitalize">{e.type} · {e.location}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{new Date(e.start_date).toLocaleDateString()}</td>
                  <td className="px-3 py-2"><span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS[e.status]}`}>{e.status}</span></td>
                  <td className="px-3 py-2">{e.registrants_count || 0}{e.registrants_count != null ? "" : ""}</td>
                  <td className="px-3 py-2">KES {(e.revenue_total || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
