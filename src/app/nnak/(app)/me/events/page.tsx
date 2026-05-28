"use client";
import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useNnakMe } from "@/hooks/use-auth";
import { useMember } from "@/hooks/use-members";
import { useEvents, useRegisterForEvent, useMyRegistrations } from "@/hooks/use-events";
import { useCategories } from "@/hooks/use-categories";
import { useStkPush } from "@/hooks/use-payments";
import type { NnakEvent, NnakMembershipCategory } from "@/types/nnak";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const feeFor = (ev: NnakEvent, code: NnakMembershipCategory | undefined): number => {
  if (!code) return ev.pricing.find((p) => p.category_code === "non_member")?.fee ?? 0;
  return (
    ev.pricing.find((p) => p.category_code === code)?.fee ??
    ev.pricing.find((p) => p.category_code === "individual")?.fee ??
    0
  );
};

export default function MyEventsPage() {
  const { data: me } = useNnakMe();
  const { data: member } = useMember(me?.id ?? "");
  const { data: cats = [] } = useCategories();
  const { data: eventsPage } = useEvents({ status: "published", per_page: 50 });
  const { data: myRegs = [] } = useMyRegistrations(me?.id);
  const register = useRegisterForEvent();
  const stk = useStkPush();
  const [phoneByEvent, setPhoneByEvent] = useState<Record<string, string>>({});

  const myCategoryCode = useMemo<NnakMembershipCategory | undefined>(() => {
    if (me?.role === "student") return "student";
    return cats.find((c) => c.id === member?.profile.member_category_id)?.code;
  }, [cats, member, me]);

  const events = eventsPage?.data ?? [];
  const registeredIds = new Set(myRegs.map((r) => r.event_id));

  const upcoming = events.filter((e) => new Date(e.starts_at) >= new Date() && !registeredIds.has(e.id));
  const upcomingMine = myRegs.filter((r) => r.event && new Date(r.event.starts_at) >= new Date());
  const pastMine = myRegs.filter((r) => r.event && new Date(r.event.starts_at) < new Date());

  const registerAndPay = async (ev: NnakEvent) => {
    if (!me) return;
    const phone = phoneByEvent[ev.id];
    if (!phone) return alert("Enter your M-Pesa phone");
    const fee = feeFor(ev, myCategoryCode);
    await register.mutateAsync({ eventId: ev.id, userId: me.id, fee });
    if (fee > 0) {
      await stk.mutateAsync({
        user_id: me.id,
        amount: fee,
        purpose: "event",
        related_id: ev.id,
        phone,
      });
    }
    setPhoneByEvent((s) => ({ ...s, [ev.id]: "" }));
  };

  if (!me) return null;

  return (
    <div className="px-4 py-4 flex flex-col gap-5">
      <PageHeader
        title="Events"
        description="Browse upcoming events and manage your registrations (FR-EM-005, FR-EM-006)"
      />

      {/* My upcoming registrations */}
      {upcomingMine.length > 0 && (
        <Section title="My upcoming events" count={upcomingMine.length}>
          {upcomingMine.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{r.event?.name}</div>
                <div className="text-xs text-slate-500">{r.event && fmtDate(r.event.starts_at)} · {r.event?.venue}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Registration: <span className={r.payment_status === "successful" ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>
                    {r.payment_status === "successful" ? "Paid · ready for check-in" : "Pending payment"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded">
                  QR: {r.qr_token.slice(0, 8)}…
                </span>
                <span className="text-xs text-slate-500">KES {r.fee.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Browse new events */}
      <Section title="Upcoming events open for registration" count={upcoming.length}>
        {upcoming.length === 0 ? (
          <Empty text="No upcoming events to register for right now." />
        ) : (
          upcoming.map((ev) => {
            const fee = feeFor(ev, myCategoryCode);
            return (
              <div key={ev.id} className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                      {ev.type}
                    </span>
                    <div className="text-sm font-semibold text-slate-900">{ev.name}</div>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{fmtDate(ev.starts_at)} · {ev.venue}</div>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{ev.description}</p>
                  <div className="text-[11px] text-slate-500 mt-2">
                    Your fee ({myCategoryCode || "non-member"}): <span className="font-semibold text-slate-900">KES {fee.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:w-64">
                  <input
                    value={phoneByEvent[ev.id] ?? ""}
                    onChange={(e) => setPhoneByEvent((s) => ({ ...s, [ev.id]: e.target.value }))}
                    placeholder="M-Pesa phone"
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                  <button
                    onClick={() => registerAndPay(ev)}
                    disabled={register.isPending || stk.isPending}
                    className="bg-primary text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {register.isPending || stk.isPending ? "Processing…" : fee > 0 ? `Register & pay KES ${fee.toLocaleString()}` : "Register (free)"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </Section>

      {/* Past events / certificates */}
      <Section title="Past events" count={pastMine.length}>
        {pastMine.length === 0 ? (
          <Empty text="You haven't attended any events yet." />
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Event</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Attended</th>
                  <th className="px-3 py-2">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastMine.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 font-medium text-slate-900">{r.event?.name}</td>
                    <td className="px-3 py-2 text-slate-600">{r.event && fmtDate(r.event.starts_at)}</td>
                    <td className="px-3 py-2">
                      {r.attended ? (
                        <span className="text-emerald-700 text-xs font-medium">Yes</span>
                      ) : (
                        <span className="text-slate-500 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {r.certificate_issued ? (
                        <a
                          href={r.certificate_url || "#"}
                          onClick={(e) => {
                            if (!r.certificate_url || r.certificate_url.startsWith("/api/mock")) {
                              e.preventDefault();
                              alert("Certificate download is a mock until the backend is live.");
                            }
                          }}
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

const Section = ({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) => (
  <section className="space-y-2">
    <div className="flex items-center gap-2">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {typeof count === "number" && (
        <span className="text-[11px] text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">{count}</span>
      )}
    </div>
    <div className="flex flex-col gap-2">{children}</div>
  </section>
);

const Empty = ({ text }: { text: string }) => (
  <div className="bg-white border border-dashed border-slate-200 rounded-lg p-6 text-center text-sm text-slate-500">
    {text}
  </div>
);
