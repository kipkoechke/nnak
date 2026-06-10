"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import { useEvent, useDeleteEvent } from "@/hooks/use-events";
import { useAgendas, useCreateAgenda, useUpdateAgenda, useDeleteAgenda } from "@/hooks/use-agendas";
import { useSpeakers, useCreateSpeaker, useDeleteSpeaker } from "@/hooks/use-speakers";
import { useBreakoutRooms, useCreateBreakoutRoom, useUpdateBreakoutRoom, useDeleteBreakoutRoom } from "@/hooks/use-breakout-rooms";
import { useAgendaSpeakers, useCreateAgendaSpeaker, useDeleteAgendaSpeaker } from "@/hooks/use-agenda-speakers";
import { useBreakoutSpeakers, useCreateBreakoutSpeaker, useDeleteBreakoutSpeaker } from "@/hooks/use-breakout-speakers";
import { useSponsors, useCreateSponsor, useDeleteSponsor } from "@/hooks/use-sponsors";
import { useExhibitors, useCreateExhibitor, useDeleteExhibitor } from "@/hooks/use-exhibitors";

const TABS = [
  "Overview",
  "Agendas",
  "Speakers",
  "Agenda Speakers",
  "Breakout Rooms",
  "Breakout Speakers",
  "Sponsors & Partners",
  "Exhibitors",
] as const;

type Tab = (typeof TABS)[number];

export default function EventTabsPage({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Overview");
  const { data: event, isLoading } = useEvent(eventId);

  if (isLoading) return <div className="p-4 text-sm text-slate-500">Loading…</div>;
  if (!event) return <div className="p-4 text-sm">Not found</div>;

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title={event.title}
        description={`${event.type} · ${event.location}`}
        back={() => router.back()}
      />

      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab event={event} eventId={eventId} />}
      {tab === "Agendas" && <AgendasTab eventId={eventId} />}
      {tab === "Speakers" && <SpeakersTab eventId={eventId} />}
      {tab === "Agenda Speakers" && <AgendaSpeakersTab eventId={eventId} />}
      {tab === "Breakout Rooms" && <BreakoutRoomsTab eventId={eventId} />}
      {tab === "Breakout Speakers" && <BreakoutSpeakersTab eventId={eventId} />}
      {tab === "Sponsors & Partners" && <SponsorsTab eventId={eventId} />}
      {tab === "Exhibitors" && <ExhibitorsTab eventId={eventId} />}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────
function OverviewTab({ event }: { event: NonNullable<ReturnType<typeof useEvent>["data"]>; eventId: string }) {
  const deleteEvent = useDeleteEvent();
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
        <div><b>Code:</b> {event.code}</div>
        {event.theme && <div><b>Theme:</b> {event.theme}</div>}
        <div><b>Status:</b> <span className="capitalize">{event.status}</span></div>
        <div><b>Starts:</b> {new Date(event.start_date).toLocaleString()}</div>
        <div><b>Ends:</b> {new Date(event.end_date).toLocaleString()}</div>
        <div><b>Registrants:</b> {event.registrants_count || 0}</div>
        <div><b>Attended:</b> {event.attended_count || 0}</div>
        <div><b>Revenue:</b> KES {(event.revenue_total || 0).toLocaleString()}</div>
        {event.pricing && event.pricing.length > 0 && (
          <div className="pt-2">
            <div className="font-semibold mb-1">Pricing</div>
            <ul className="text-xs space-y-0.5">
              {event.pricing.map((p, i) => <li key={i}>{p.category_code} — KES {p.fee}</li>)}
            </ul>
          </div>
        )}
        <div className="pt-2 flex gap-2">
          <button
            onClick={() => router.push(`/nnak/events/new?id=${event.id}`)}
            className="text-xs text-primary hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm("Delete this event?")) {
                deleteEvent.mutate(event.id, { onSuccess: () => router.push("/nnak/events") });
              }
            }}
            className="text-xs text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4">
        <div className="font-semibold text-sm mb-2">Description</div>
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{event.description}</p>
        {event.metadata && (
          <>
            <div className="font-semibold text-sm mt-4 mb-2">Metadata</div>
            <pre className="text-xs text-slate-500 bg-slate-50 p-2 rounded overflow-auto">
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          </>
        )}
        {event.banner_image_url && (
          <img src={event.banner_image_url} alt="Banner" className="mt-4 rounded-lg w-full max-h-48 object-cover" />
        )}
      </div>
    </div>
  );
}

// ── Agendas Tab ───────────────────────────────────────────
function AgendasTab({ eventId }: { eventId: string }) {
  const { data: agendasData, isLoading } = useAgendas({ event_id: eventId });
  const createAgenda = useCreateAgenda();
  const updateAgenda = useUpdateAgenda();
  const deleteAgenda = useDeleteAgenda();
  const { data: brData } = useBreakoutRooms({ agenda_id: "" });
  const createBR = useCreateBreakoutRoom();
  const deleteBR = useDeleteBreakoutRoom();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", start_time: "", end_time: "", type: "general" as string });
  const [expandedAgenda, setExpandedAgenda] = useState<string | null>(null);
  const [brForm, setBrForm] = useState({ name: "", description: "", tag: "", location: "" });

  const resetForm = () => { setForm({ title: "", description: "", start_time: "", end_time: "", type: "general" }); setEditId(null); setShowForm(false); };

  const agendas = agendasData?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Agendas ({agendas.length})</h3>
        <button onClick={() => setShowForm(!showForm)} className="text-xs bg-primary text-white px-3 py-1.5 rounded-md">
          {showForm ? "Cancel" : "+ Add Agenda"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const payload = {
            event_id: eventId,
            title: form.title,
            description: form.description,
            start_time: new Date(form.start_time).toISOString(),
            end_time: new Date(form.end_time).toISOString(),
            type: form.type,
          };
          if (editId) {
            updateAgenda.mutate({ id: editId, input: payload }, { onSuccess: resetForm });
          } else {
            createAgenda.mutate(payload, { onSuccess: resetForm });
          }
        }} className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-2">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" required className="col-span-2 px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="col-span-2 px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
            {["keynote","panel","workshop","breakout","general"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button type="submit" className="bg-primary text-white text-sm px-4 py-2 rounded-md">{editId ? "Update" : "Save"}</button>
        </form>
      )}

      {isLoading ? <div className="text-sm text-slate-500">Loading…</div> : agendas.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-lg border border-slate-200">No agendas yet</div>
      ) : (
        <div className="space-y-2">
          {agendas.map((a) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-lg">
              <div className="p-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setExpandedAgenda(expandedAgenda === a.id ? null : a.id)} className="text-xs text-slate-400 hover:text-slate-600">
                      {expandedAgenda === a.id ? "▼" : "▶"}
                    </button>
                    <span className="font-semibold text-sm">{a.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{a.type}</span>
                  </div>
                  <div className="text-xs text-slate-500 ml-5 mt-1">
                    {new Date(a.start_time).toLocaleString()} — {new Date(a.end_time).toLocaleTimeString()}
                  </div>
                  {a.description && <div className="text-xs text-slate-600 ml-5 mt-1">{a.description}</div>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditId(a.id); setForm({ title: a.title, description: a.description, start_time: a.start_time?.slice(0, 16) || "", end_time: a.end_time?.slice(0, 16) || "", type: a.type }); setShowForm(true); }} className="text-[10px] text-primary hover:underline">Edit</button>
                  <button onClick={() => { if (confirm("Delete?")) deleteAgenda.mutate(a.id); }} className="text-[10px] text-red-600 hover:underline">Delete</button>
                </div>
              </div>

              {expandedAgenda === a.id && (
                <div className="border-t border-slate-100 p-3 ml-5 space-y-3">
                  <div>
                    <div className="text-xs font-semibold mb-2">Breakout Rooms</div>
                    {brData?.data.filter((b) => b.agenda_id === a.id).length === 0 && (
                      <div className="text-xs text-slate-400">No breakout rooms</div>
                    )}
                    {brData?.data.filter((b) => b.agenda_id === a.id).map((br) => (
                      <div key={br.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                        <div>
                          <span className="font-medium">{br.name}</span>
                          <span className="text-slate-500 ml-2">{br.location}</span>
                          {br.tag && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded ml-2">{br.tag}</span>}
                        </div>
                        <button onClick={() => { if (confirm("Delete?")) deleteBR.mutate(br.id); }} className="text-red-600 hover:underline">×</button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); createBR.mutate({ agenda_id: a.id, ...brForm }, { onSuccess: () => setBrForm({ name: "", description: "", tag: "", location: "" }) }); }} className="flex gap-1">
                    <input value={brForm.name} onChange={(e) => setBrForm({ ...brForm, name: e.target.value })} placeholder="Room name" required className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-xs" />
                    <input value={brForm.location} onChange={(e) => setBrForm({ ...brForm, location: e.target.value })} placeholder="Location" className="w-32 px-2 py-1.5 border border-slate-300 rounded text-xs" />
                    <input value={brForm.tag} onChange={(e) => setBrForm({ ...brForm, tag: e.target.value })} placeholder="Tag" className="w-24 px-2 py-1.5 border border-slate-300 rounded text-xs" />
                    <button type="submit" className="bg-primary text-white text-xs px-2 py-1 rounded">+</button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Speakers Tab ──────────────────────────────────────────
function SpeakersTab({ eventId }: { eventId: string }) {
  const { data: speakersData, isLoading } = useSpeakers({ event_id: eventId });
  const createSpeaker = useCreateSpeaker();
  const deleteSpeaker = useDeleteSpeaker();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", title: "", organization: "", bio: "", photo_url: "" });

  const reset = () => { setForm({ name: "", title: "", organization: "", bio: "", photo_url: "" }); setShowForm(false); };
  const speakers = speakersData?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Speakers ({speakers.length})</h3>
        <button onClick={() => setShowForm(!showForm)} className="text-xs bg-primary text-white px-3 py-1.5 rounded-md">
          {showForm ? "Cancel" : "+ Add Speaker"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); createSpeaker.mutate({ event_id: eventId, ...form, links: {} }, { onSuccess: reset }); }} className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-2">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" required className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title (e.g. Chief Nursing Officer)" className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="Organization" className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="Photo URL" className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Bio" rows={2} className="col-span-2 px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <button type="submit" className="col-span-2 bg-primary text-white text-sm px-4 py-2 rounded-md">Save Speaker</button>
        </form>
      )}

      {isLoading ? <div className="text-sm text-slate-500">Loading…</div> : speakers.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-lg border border-slate-200">No speakers yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {speakers.map((s) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-lg p-3 flex gap-3">
              {s.photo_url && <img src={s.photo_url} alt={s.name} className="w-12 h-12 rounded-full object-cover" />}
              <div className="flex-1">
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="text-xs text-slate-500">{s.title}{s.organization ? ` · ${s.organization}` : ""}</div>
                {s.bio && <div className="text-xs text-slate-600 mt-1 line-clamp-2">{s.bio}</div>}
              </div>
              <button onClick={() => { if (confirm("Delete?")) deleteSpeaker.mutate(s.id); }} className="text-xs text-red-600 hover:underline self-start">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sponsors Tab ──────────────────────────────────────────
function SponsorsTab({ eventId }: { eventId: string }) {
  const { data: sponsorsData, isLoading } = useSponsors({ event_id: eventId });
  const createSponsor = useCreateSponsor();
  const deleteSponsor = useDeleteSponsor();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", website_url: "", category: "platinum", is_partner: false, description: "", logo_url: "" });

  const reset = () => { setForm({ name: "", website_url: "", category: "platinum", is_partner: false, description: "", logo_url: "" }); setShowForm(false); };
  const sponsors = sponsorsData?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Sponsors & Partners ({sponsors.length})</h3>
        <button onClick={() => setShowForm(!showForm)} className="text-xs bg-primary text-white px-3 py-1.5 rounded-md">
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); createSponsor.mutate({ event_id: eventId, ...form, metadata: {} }, { onSuccess: reset }); }} className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-2">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" required className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
            {["platinum","gold","silver","bronze","partner","media","other"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="Website URL" className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="Logo URL" className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_partner} onChange={(e) => setForm({ ...form, is_partner: e.target.checked })} /> Is Partner</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="col-span-2 px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <button type="submit" className="col-span-2 bg-primary text-white text-sm px-4 py-2 rounded-md">Save</button>
        </form>
      )}

      {isLoading ? <div className="text-sm text-slate-500">Loading…</div> : sponsors.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-lg border border-slate-200">No sponsors yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sponsors.map((s) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-lg p-3 flex gap-3">
              {s.logo_url && <img src={s.logo_url} alt={s.name} className="w-10 h-10 rounded object-contain bg-slate-100" />}
              <div className="flex-1">
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="flex gap-1 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{s.category}</span>
                  {s.is_partner && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Partner</span>}
                </div>
                {s.description && <div className="text-xs text-slate-600 mt-1 line-clamp-2">{s.description}</div>}
              </div>
              <button onClick={() => { if (confirm("Delete?")) deleteSponsor.mutate(s.id); }} className="text-xs text-red-600 hover:underline self-start">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Agenda Speakers Tab ───────────────────────────────────
function AgendaSpeakersTab({ eventId }: { eventId: string }) {
  const { data: agendasData } = useAgendas({ event_id: eventId });
  const { data: speakersData } = useSpeakers({ event_id: eventId });
  const agendas = agendasData?.data ?? [];
  const speakers = speakersData?.data ?? [];

  const [agendaId, setAgendaId] = useState<string>("");
  const [speakerId, setSpeakerId] = useState<string>("");
  const [role, setRole] = useState<string>("speaker");

  const { data: linksData, isLoading } = useAgendaSpeakers({ agenda_id: agendaId });
  const createLink = useCreateAgendaSpeaker();
  const deleteLink = useDeleteAgendaSpeaker();

  const links = linksData?.data ?? [];
  const speakerName = (id: string) =>
    speakers.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Agenda Speakers</h3>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select
            value={agendaId}
            onChange={(e) => setAgendaId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">— Pick an agenda —</option>
            {agendas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
          <select
            value={speakerId}
            onChange={(e) => setSpeakerId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            disabled={!agendaId}
          >
            <option value="">— Pick a speaker —</option>
            {speakers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role (speaker, moderator…)"
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            disabled={!agendaId}
          />
          <button
            type="button"
            disabled={!agendaId || !speakerId || createLink.isPending}
            onClick={() =>
              createLink.mutate(
                { agenda_id: agendaId, speaker_id: speakerId, role },
                {
                  onSuccess: () => {
                    setSpeakerId("");
                    setRole("speaker");
                  },
                },
              )
            }
            className="bg-primary text-white text-sm px-4 py-2 rounded-md disabled:opacity-50"
          >
            {createLink.isPending ? "Linking…" : "Link speaker"}
          </button>
        </div>
        <div className="text-[11px] text-slate-500">
          POST /agenda-speakers · GET /agenda-speakers?agenda_id=
        </div>
      </div>

      {!agendaId ? (
        <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-lg border border-slate-200">
          Pick an agenda to view its speakers.
        </div>
      ) : isLoading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : links.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-lg border border-slate-200">
          No speakers linked to this agenda yet.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Speaker</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {links.map((l) => (
                <tr key={l.id}>
                  <td className="px-3 py-2">{l.speaker?.name ?? speakerName(l.speaker_id)}</td>
                  <td className="px-3 py-2 capitalize text-slate-700">{l.role}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => {
                        if (confirm("Unlink this speaker?")) deleteLink.mutate(l.id);
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Unlink
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Breakout Rooms Tab ───────────────────────────────────
function BreakoutRoomsTab({ eventId }: { eventId: string }) {
  const { data: agendasData } = useAgendas({ event_id: eventId });
  const agendas = agendasData?.data ?? [];

  const [agendaId, setAgendaId] = useState<string>("");
  const { data: roomsData, isLoading } = useBreakoutRooms({ agenda_id: agendaId });
  const createRoom = useCreateBreakoutRoom();
  const updateRoom = useUpdateBreakoutRoom();
  const deleteRoom = useDeleteBreakoutRoom();

  const empty = { name: "", description: "", tag: "", location: "" };
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const reset = () => {
    setEditId(null);
    setForm(empty);
  };

  const rooms = roomsData?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Breakout Rooms</h3>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
        <select
          value={agendaId}
          onChange={(e) => {
            setAgendaId(e.target.value);
            reset();
          }}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">— Pick an agenda —</option>
          {agendas.map((a) => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>

        {agendaId && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editId) {
                updateRoom.mutate(
                  { id: editId, input: form },
                  { onSuccess: reset },
                );
              } else {
                createRoom.mutate({ agenda_id: agendaId, ...form }, { onSuccess: reset });
              }
            }}
            className="grid grid-cols-1 md:grid-cols-5 gap-2"
          >
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Room name"
              required
              className="px-3 py-2 border border-slate-300 rounded-md text-sm md:col-span-2"
            />
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Location"
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
            <input
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              placeholder="Tag"
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
            <button
              type="submit"
              disabled={createRoom.isPending || updateRoom.isPending}
              className="bg-primary text-white text-sm px-3 py-2 rounded-md disabled:opacity-50"
            >
              {editId ? "Update" : "Add"}
            </button>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              rows={2}
              className="md:col-span-5 px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
            {editId && (
              <button
                type="button"
                onClick={reset}
                className="md:col-span-5 text-[11px] text-slate-500 hover:underline self-start"
              >
                Cancel edit
              </button>
            )}
          </form>
        )}
      </div>

      {!agendaId ? (
        <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-lg border border-slate-200">
          Pick an agenda to view its breakout rooms.
        </div>
      ) : isLoading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : rooms.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-lg border border-slate-200">
          No breakout rooms yet for this agenda.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Room</th>
                <th className="px-3 py-2 hidden md:table-cell">Location</th>
                <th className="px-3 py-2 hidden md:table-cell">Tag</th>
                <th className="px-3 py-2 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-900">{r.name}</div>
                    {r.description && (
                      <div className="text-[11px] text-slate-500 line-clamp-2">{r.description}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-700 hidden md:table-cell">{r.location || "—"}</td>
                  <td className="px-3 py-2 hidden md:table-cell">
                    {r.tag && (
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded">{r.tag}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditId(r.id);
                        setForm({
                          name: r.name,
                          description: r.description,
                          tag: r.tag,
                          location: r.location,
                        });
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this breakout room?")) deleteRoom.mutate(r.id);
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Breakout Speakers Tab ────────────────────────────────
function BreakoutSpeakersTab({ eventId }: { eventId: string }) {
  const { data: agendasData } = useAgendas({ event_id: eventId });
  const { data: speakersData } = useSpeakers({ event_id: eventId });
  const agendas = agendasData?.data ?? [];
  const speakers = speakersData?.data ?? [];

  const [agendaId, setAgendaId] = useState<string>("");
  const { data: roomsData } = useBreakoutRooms({ agenda_id: agendaId });
  const rooms = roomsData?.data ?? [];

  const [roomId, setRoomId] = useState<string>("");
  const [speakerId, setSpeakerId] = useState<string>("");
  const [role, setRole] = useState<string>("speaker");

  const { data: linksData, isLoading } = useBreakoutSpeakers({ breakout_room_id: roomId });
  const createLink = useCreateBreakoutSpeaker();
  const deleteLink = useDeleteBreakoutSpeaker();

  const links = linksData?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Breakout Speakers</h3>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select
            value={agendaId}
            onChange={(e) => {
              setAgendaId(e.target.value);
              setRoomId("");
            }}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">— Agenda —</option>
            {agendas.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={!agendaId}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">— Breakout room —</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <select
            value={speakerId}
            onChange={(e) => setSpeakerId(e.target.value)}
            disabled={!roomId}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">— Speaker —</option>
            {speakers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role"
            disabled={!roomId}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          />
          <button
            type="button"
            disabled={!roomId || !speakerId || createLink.isPending}
            onClick={() =>
              createLink.mutate(
                { breakout_room_id: roomId, speaker_id: speakerId, role },
                {
                  onSuccess: () => {
                    setSpeakerId("");
                    setRole("speaker");
                  },
                },
              )
            }
            className="bg-primary text-white text-sm px-4 py-2 rounded-md md:col-span-1 disabled:opacity-50"
          >
            {createLink.isPending ? "Linking…" : "Link speaker"}
          </button>
        </div>
        <div className="text-[11px] text-slate-500">
          POST /breakout-speaker · GET /breakout-speakers?breakout_room_id=
        </div>
      </div>

      {!roomId ? (
        <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-lg border border-slate-200">
          Pick a breakout room to view its speakers.
        </div>
      ) : isLoading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : links.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-lg border border-slate-200">
          No speakers linked to this breakout room yet.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Speaker</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {links.map((l) => (
                <tr key={l.id}>
                  <td className="px-3 py-2">
                    {l.speaker?.name ??
                      speakers.find((s) => s.id === l.speaker_id)?.name ??
                      l.speaker_id}
                  </td>
                  <td className="px-3 py-2 capitalize text-slate-700">{l.role}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => {
                        if (confirm("Unlink this speaker?")) deleteLink.mutate(l.id);
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Unlink
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Exhibitors Tab ────────────────────────────────────────
function ExhibitorsTab({ eventId }: { eventId: string }) {
  const { data: exhibitorsData, isLoading } = useExhibitors({ event_id: eventId });
  const createExhibitor = useCreateExhibitor();
  const deleteExhibitor = useDeleteExhibitor();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", logo_url: "" });

  const reset = () => { setForm({ name: "", description: "", logo_url: "" }); setShowForm(false); };
  const exhibitors = exhibitorsData?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Exhibitors ({exhibitors.length})</h3>
        <button onClick={() => setShowForm(!showForm)} className="text-xs bg-primary text-white px-3 py-1.5 rounded-md">
          {showForm ? "Cancel" : "+ Add Exhibitor"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); createExhibitor.mutate({ event_id: eventId, ...form, metadata: {} }, { onSuccess: reset }); }} className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-2">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" required className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="Logo URL" className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="col-span-2 px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <button type="submit" className="col-span-2 bg-primary text-white text-sm px-4 py-2 rounded-md">Save Exhibitor</button>
        </form>
      )}

      {isLoading ? <div className="text-sm text-slate-500">Loading…</div> : exhibitors.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-lg border border-slate-200">No exhibitors yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {exhibitors.map((ex) => (
            <div key={ex.id} className="bg-white border border-slate-200 rounded-lg p-3 flex gap-3">
              {ex.logo_url && <img src={ex.logo_url} alt={ex.name} className="w-10 h-10 rounded object-contain bg-slate-100" />}
              <div className="flex-1">
                <div className="font-semibold text-sm">{ex.name}</div>
                {ex.metadata && typeof (ex.metadata as Record<string, unknown>).booth === "string" && (
                  <div className="text-[10px] text-slate-500">Booth: {String((ex.metadata as Record<string, unknown>).booth)}</div>
                )}
                {ex.description && <div className="text-xs text-slate-600 mt-1 line-clamp-2">{ex.description}</div>}
              </div>
              <button onClick={() => { if (confirm("Delete?")) deleteExhibitor.mutate(ex.id); }} className="text-xs text-red-600 hover:underline self-start">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
