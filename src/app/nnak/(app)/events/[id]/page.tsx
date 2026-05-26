"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import { useEvent, useEventRegistrants, useIssueCertificate, useRegisterForEvent } from "@/hooks/nnak/use-events";
import { useMembers } from "@/hooks/nnak/use-members";
import { useStkPush } from "@/hooks/nnak/use-payments";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: event, isLoading } = useEvent(id);
  const { data: regs = [] } = useEventRegistrants(id);
  const { data: members } = useMembers({ per_page: 1000 });
  const register = useRegisterForEvent();
  const stk = useStkPush();
  const certificate = useIssueCertificate();

  if (isLoading) return <div className="p-4 text-sm text-slate-500">Loading…</div>;
  if (!event) return <div className="p-4 text-sm">Not found</div>;

  const registerAndPay = async (userId: string) => {
    const m = members?.data.find((x) => x.id === userId);
    const cat = event.pricing.find((p) => p.category_code === (m?.profile.member_category_id ? "individual" : "non_member"));
    const fee = cat?.fee || event.pricing[0]?.fee || 0;
    await register.mutateAsync({ eventId: id, userId, fee });
    if (fee > 0) {
      stk.mutate({ user_id: userId, amount: fee, purpose: "event", related_id: id, phone: m?.profile.phone || "" });
    }
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title={event.name} description={`${event.type} · ${event.venue}`} back={() => router.back()} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
          <div><b>Status:</b> <span className="capitalize">{event.status}</span></div>
          <div><b>Starts:</b> {new Date(event.starts_at).toLocaleString()}</div>
          <div><b>Ends:</b> {new Date(event.ends_at).toLocaleString()}</div>
          <div><b>Capacity:</b> {event.registrants_count || 0}/{event.capacity}</div>
          <div><b>Revenue:</b> KES {(event.revenue_total || 0).toLocaleString()}</div>
          <div><b>Attendance:</b> {event.attended_count || 0}</div>
          <div className="pt-2">
            <div className="font-semibold mb-1">Tiered Pricing</div>
            <ul className="text-xs space-y-0.5">
              {event.pricing.map((p, i) => (
                <li key={i}>{p.category_code} — KES {p.fee}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-3 border-b text-sm font-semibold flex items-center justify-between">
            <span>Registrants ({regs.length})</span>
            <select onChange={(e) => e.target.value && registerAndPay(e.target.value)} className="text-xs px-2 py-1 border border-slate-300 rounded" defaultValue="">
              <option value="">+ Register member</option>
              {members?.data.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-3 py-2">Member</th><th className="px-3 py-2">Fee</th><th className="px-3 py-2">Payment</th><th className="px-3 py-2">Attended</th><th className="px-3 py-2">Cert</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regs.map((r) => {
                const m = members?.data.find((x) => x.id === r.user_id);
                return (
                  <tr key={r.id}>
                    <td className="px-3 py-2">{m?.name || r.user_id}</td>
                    <td className="px-3 py-2">KES {r.fee}</td>
                    <td className="px-3 py-2 capitalize">{r.payment_status}</td>
                    <td className="px-3 py-2">{r.attended ? "✓" : "—"}</td>
                    <td className="px-3 py-2">
                      {r.certificate_issued ? <span className="text-emerald-600 text-xs">Issued</span> : (
                        r.attended && (
                          <button onClick={() => certificate.mutate(r.id)} className="text-xs text-primary">Issue</button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
              {regs.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">No registrants yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
