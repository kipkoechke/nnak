"use client";
import { useMemo, useState } from "react";
import {
  MdAdd,
  MdClose,
  MdDelete,
  MdEdit,
  MdExpandMore,
  MdLocationOn,
  MdMeetingRoom,
  MdSchedule,
} from "react-icons/md";
import {
  useAgendas,
  useCreateAgenda,
  useDeleteAgenda,
  useUpdateAgenda,
} from "@/hooks/use-agendas";
import { useSpeakers } from "@/hooks/use-speakers";
import {
  useBreakoutRooms,
  useCreateBreakoutRoom,
  useDeleteBreakoutRoom,
  useUpdateBreakoutRoom,
} from "@/hooks/use-breakout-rooms";
import {
  useAgendaSpeakers,
  useCreateAgendaSpeaker,
  useDeleteAgendaSpeaker,
} from "@/hooks/use-agenda-speakers";
import {
  useBreakoutSpeakers,
  useCreateBreakoutSpeaker,
  useDeleteBreakoutSpeaker,
} from "@/hooks/use-breakout-speakers";
import type { Agenda, Speaker } from "@/types/nnak";
import {
  AddBtn,
  Badge,
  EmptyState,
  Field,
  FormActions,
  IconButton,
  Modal,
  RowActions,
  SectionHeader,
  SkeletonList,
  TextArea,
  dayKey,
  fmtDayHeading,
  fmtTime,
  useConfirm,
} from "./shared";

const emptyAgenda = {
  title: "",
  description: "",
  start_time: "",
  end_time: "",
  location: "",
};

const emptyRoom = { name: "", description: "", location: "" };

/**
 * The API takes `role` as a free-form string, but leaving it as a text box
 * produced inconsistent values ("Speaker", "speaker", "spkr"). These are the
 * roles the programme actually uses.
 */
const SPEAKER_ROLES = [
  "speaker",
  "keynote",
  "moderator",
  "panelist",
  "chair",
  "facilitator",
  "discussant",
  "rapporteur",
] as const;

const DEFAULT_ROLE = SPEAKER_ROLES[0];

/**
 * The API nests agenda-speakers and breakout rooms (which nest their own
 * speakers) under an agenda, so they are edited in place rather than in
 * separate tabs that would make you re-pick the parent each time.
 */
export default function ProgrammeTab({ eventId }: { eventId: string }) {
  const [page, setPage] = useState(1);
  const { data: agendasData, isLoading } = useAgendas(eventId, {
    page,
    per_page: 10,
  });
  const createAgenda = useCreateAgenda();
  const updateAgenda = useUpdateAgenda();
  const deleteAgenda = useDeleteAgenda();
  const { confirm, dialog } = useConfirm();

  const { data: speakersData } = useSpeakers(eventId);
  const speakers = speakersData?.data ?? [];

  const [expanded, setExpanded] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyAgenda);

  const agendas = useMemo(() => agendasData?.data ?? [], [agendasData]);
  const pagination = agendasData?.pagination;

  /** Sessions read as a timeline, so they are bucketed by calendar day. */
  const days = useMemo(() => {
    const buckets = new Map<string, Agenda[]>();
    [...agendas]
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .forEach((a) => {
        const k = dayKey(a.start_time);
        buckets.set(k, [...(buckets.get(k) ?? []), a]);
      });
    return Array.from(buckets.values());
  }, [agendas]);

  const reset = () => {
    setForm(emptyAgenda);
    setEditId(null);
    setModalOpen(false);
  };

  const openNew = () => {
    setForm(emptyAgenda);
    setEditId(null);
    setModalOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = {
      title: form.title,
      description: form.description || null,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      location: form.location || null,
    };
    if (editId)
      updateAgenda.mutate({ eventId, id: editId, input }, { onSuccess: reset });
    else createAgenda.mutate({ eventId, input }, { onSuccess: reset });
  };

  const removeAgenda = async (a: Agenda) => {
    const ok = await confirm({
      title: `Delete "${a.title}"?`,
      body: "Its speakers and breakout rooms are removed with it.",
    });
    if (ok) deleteAgenda.mutate({ eventId, id: a.id });
  };

  return (
    <div className="space-y-4">
      {dialog}

      <SectionHeader
        title="Programme"
        description="Sessions, panels and workshops — with their speakers and breakout rooms"
        count={pagination?.total ?? agendas.length}
        action={<AddBtn onClick={openNew} label="New session" />}
      />

      {isLoading ? (
        <SkeletonList />
      ) : agendas.length === 0 ? (
        <EmptyState
          icon={MdSchedule}
          title="No programme items yet"
          description="Build your event timeline by adding sessions, panels and workshops."
          action={<AddBtn onClick={openNew} label="Add the first session" />}
        />
      ) : (
        <div className="space-y-6">
          {days.map((sessions) => (
            <div key={dayKey(sessions[0].start_time)}>
              {/* Sits just under the tab bar, which is ~50px tall for
                  Programme (a single-panel group, so no sub-tab row). */}
              <div className="sticky top-[50px] z-[5] -mx-4 px-4 py-1.5 bg-slate-50/95 backdrop-blur border-y border-slate-200/70">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {fmtDayHeading(sessions[0].start_time)}
                  <span className="text-slate-400 font-normal ml-2">
                    {sessions.length} session
                    {sessions.length === 1 ? "" : "s"}
                  </span>
                </h4>
              </div>

              <div className="space-y-2 mt-2">
                {sessions.map((a) => (
                  <AgendaCard
                    key={a.id}
                    eventId={eventId}
                    agenda={a}
                    speakers={speakers}
                    expanded={expanded === a.id}
                    onToggle={() =>
                      setExpanded(expanded === a.id ? null : a.id)
                    }
                    onEdit={() => {
                      setEditId(a.id);
                      setForm({
                        title: a.title,
                        description: a.description || "",
                        start_time: a.start_time?.slice(0, 16) ?? "",
                        end_time: a.end_time?.slice(0, 16) ?? "",
                        location: a.location || "",
                      });
                      setModalOpen(true);
                    }}
                    onDelete={() => removeAgenda(a)}
                    confirm={confirm}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between text-sm pt-1">
          <span className="text-slate-500">
            {pagination.from}–{pagination.to} of {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              disabled={page >= pagination.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={reset}
        title={editId ? "Edit session" : "New session"}
        description="Sessions make up the event timeline."
        size="lg"
      >
        <form onSubmit={submit} className="space-y-3">
          <Field
            label="Title"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            required
            placeholder="e.g. Opening Keynote"
          />
          <TextArea
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder="What is this session about?"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Start"
              type="datetime-local"
              value={form.start_time}
              onChange={(v) => setForm({ ...form, start_time: v })}
              required
            />
            <Field
              label="End"
              type="datetime-local"
              value={form.end_time}
              onChange={(v) => setForm({ ...form, end_time: v })}
              required
            />
          </div>
          <Field
            label="Location"
            value={form.location}
            onChange={(v) => setForm({ ...form, location: v })}
            placeholder="Main Hall"
          />
          <FormActions
            onCancel={reset}
            saving={createAgenda.isPending || updateAgenda.isPending}
            submitLabel={editId ? "Save changes" : "Create session"}
          />
        </form>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Agenda card
 * ────────────────────────────────────────────────────────────────────── */

type ConfirmFn = ReturnType<typeof useConfirm>["confirm"];

function AgendaCard({
  eventId,
  agenda,
  speakers,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  confirm,
}: {
  eventId: string;
  agenda: Agenda;
  speakers: Speaker[];
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  confirm: ConfirmFn;
}) {
  // Children are only fetched for the open card — collapsed cards fall back to
  // the counts the agenda payload already embeds.
  const { data: roomsData, isLoading: roomsLoading } = useBreakoutRooms(
    eventId,
    expanded ? agenda.id : "",
  );
  const { data: agendaSpeakersData, isLoading: speakersLoading } =
    useAgendaSpeakers(eventId, expanded ? agenda.id : "");

  const rooms = roomsData?.data ?? [];
  const agendaSpeakers = agendaSpeakersData?.data ?? [];

  const createAgendaSpeaker = useCreateAgendaSpeaker();
  const deleteAgendaSpeaker = useDeleteAgendaSpeaker();
  const createRoom = useCreateBreakoutRoom();
  const updateRoom = useUpdateBreakoutRoom();
  const deleteRoom = useDeleteBreakoutRoom();

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [roomEditId, setRoomEditId] = useState<string | null>(null);
  const [roomForm, setRoomForm] = useState(emptyRoom);

  const speakerCount = expanded
    ? agendaSpeakers.length
    : (agenda.speakers ?? []).length;
  const roomCount = expanded ? rooms.length : (agenda.breakout_rooms ?? []).length;

  const resetRoom = () => {
    setRoomForm(emptyRoom);
    setRoomEditId(null);
    setRoomModalOpen(false);
  };

  const submitRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const input = {
      name: roomForm.name,
      description: roomForm.description || null,
      location: roomForm.location || null,
    };
    if (roomEditId)
      updateRoom.mutate(
        { eventId, agendaId: agenda.id, id: roomEditId, input },
        { onSuccess: resetRoom },
      );
    else
      createRoom.mutate(
        { eventId, agendaId: agenda.id, input },
        { onSuccess: resetRoom },
      );
  };

  return (
    <div
      className={`group bg-white border rounded-xl overflow-hidden transition-all ${
        expanded
          ? "border-primary/40 shadow-sm ring-1 ring-primary/10"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex items-start gap-3 flex-1 min-w-0 text-left"
        >
          <div className="shrink-0 w-16 rounded-lg bg-slate-50 border border-slate-100 py-1.5 text-center">
            <div className="text-sm font-bold text-slate-900 leading-tight tabular-nums">
              {fmtTime(agenda.start_time)}
            </div>
            <div className="text-[11px] text-slate-500 tabular-nums">
              {fmtTime(agenda.end_time)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-slate-900">{agenda.title}</h4>
              {agenda.location && <Badge>{agenda.location}</Badge>}
              {speakerCount > 0 && (
                <Badge tone="blue">
                  {speakerCount} speaker{speakerCount === 1 ? "" : "s"}
                </Badge>
              )}
              {roomCount > 0 && (
                <Badge tone="primary">
                  {roomCount} breakout{roomCount === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
            {agenda.description && (
              <p
                className={`text-sm text-slate-600 mt-1.5 ${
                  expanded ? "" : "line-clamp-2"
                }`}
              >
                {agenda.description}
              </p>
            )}
          </div>
        </button>

        <RowActions>
          <IconButton onClick={onEdit} title="Edit session">
            <MdEdit className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={onDelete} title="Delete session" tone="danger">
            <MdDelete className="w-4 h-4" />
          </IconButton>
        </RowActions>

        <button
          onClick={onToggle}
          aria-label={expanded ? "Collapse" : "Expand"}
          className="p-1.5 text-slate-400 hover:text-slate-700 shrink-0"
        >
          <MdExpandMore
            className={`w-5 h-5 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 divide-y divide-slate-100">
          {/* ── Speakers on this session ── */}
          <section className="px-4 py-3 space-y-2">
            <h5 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
              Speakers
            </h5>

            {speakersLoading ? (
              <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
            ) : agendaSpeakers.length === 0 ? (
              <p className="text-xs text-slate-500">No speakers assigned yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {agendaSpeakers.map((as) => (
                  <SpeakerChip
                    key={as.id}
                    name={
                      (as.speaker ?? speakers.find((s) => s.id === as.speaker_id))
                        ?.name ?? as.speaker_id
                    }
                    role={as.role}
                    onRemove={async () => {
                      const ok = await confirm({
                        title: "Remove speaker?",
                        body: "They stay in the speaker directory — only this session link is removed.",
                        confirmLabel: "Remove",
                      });
                      if (ok)
                        deleteAgendaSpeaker.mutate({
                          eventId,
                          agendaId: agenda.id,
                          id: as.id,
                        });
                    }}
                  />
                ))}
              </div>
            )}

            <LinkSpeakerForm
              speakers={speakers}
              taken={agendaSpeakers.map((as) => as.speaker_id)}
              pending={createAgendaSpeaker.isPending}
              onLink={(speaker_id, role, done) =>
                createAgendaSpeaker.mutate(
                  {
                    eventId,
                    agendaId: agenda.id,
                    input: { speaker_id, role: role || null },
                  },
                  { onSuccess: done },
                )
              }
            />
          </section>

          {/* ── Breakout rooms ── */}
          <section className="px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                Breakout rooms
              </h5>
              <button
                onClick={() => {
                  setRoomEditId(null);
                  setRoomForm(emptyRoom);
                  setRoomModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
              >
                <MdAdd className="w-3.5 h-3.5" /> Add room
              </button>
            </div>

            {roomsLoading ? (
              <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ) : rooms.length === 0 ? (
              <p className="text-xs text-slate-500">No breakout rooms yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {rooms.map((r) => (
                  <BreakoutRoomCard
                    key={r.id}
                    eventId={eventId}
                    agendaId={agenda.id}
                    room={r}
                    speakers={speakers}
                    confirm={confirm}
                    onEdit={() => {
                      setRoomEditId(r.id);
                      setRoomForm({
                        name: r.name,
                        description: r.description ?? "",
                        location: r.location ?? "",
                      });
                      setRoomModalOpen(true);
                    }}
                    onDelete={async () => {
                      const ok = await confirm({
                        title: `Delete room "${r.name}"?`,
                        body: "Speakers linked to this room are unlinked.",
                      });
                      if (ok)
                        deleteRoom.mutate({
                          eventId,
                          agendaId: agenda.id,
                          id: r.id,
                        });
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <Modal
        open={roomModalOpen}
        onClose={resetRoom}
        title={roomEditId ? "Edit breakout room" : "New breakout room"}
        description={agenda.title}
      >
        <form onSubmit={submitRoom} className="space-y-3">
          <Field
            label="Name"
            value={roomForm.name}
            onChange={(v) => setRoomForm({ ...roomForm, name: v })}
            required
          />
          <Field
            label="Location"
            value={roomForm.location}
            onChange={(v) => setRoomForm({ ...roomForm, location: v })}
            placeholder="Room 3, Wing B"
          />
          <TextArea
            label="Description"
            value={roomForm.description}
            onChange={(v) => setRoomForm({ ...roomForm, description: v })}
          />
          <FormActions
            onCancel={resetRoom}
            saving={createRoom.isPending || updateRoom.isPending}
            submitLabel={roomEditId ? "Save changes" : "Add room"}
          />
        </form>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Breakout room card
 * ────────────────────────────────────────────────────────────────────── */

function BreakoutRoomCard({
  eventId,
  agendaId,
  room,
  speakers,
  confirm,
  onEdit,
  onDelete,
}: {
  eventId: string;
  agendaId: string;
  room: { id: string; name: string; description?: string | null; location?: string | null };
  speakers: Speaker[];
  confirm: ConfirmFn;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { data } = useBreakoutSpeakers(eventId, agendaId, room.id);
  const createSpeaker = useCreateBreakoutSpeaker();
  const deleteSpeaker = useDeleteBreakoutSpeaker();
  const links = data?.data ?? [];

  return (
    <div className="group/room bg-white border border-slate-200 rounded-lg p-3 hover:border-primary/50 transition-colors space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <MdMeetingRoom className="w-4 h-4 text-primary shrink-0" />
            <h6 className="text-sm font-semibold text-slate-900 truncate">
              {room.name}
            </h6>
          </div>
          {room.location && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              <MdLocationOn className="w-3 h-3 shrink-0" />
              <span className="truncate">{room.location}</span>
            </div>
          )}
          {room.description && (
            <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
              {room.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0 opacity-100 md:opacity-0 md:group-hover/room:opacity-100 transition-opacity">
          <IconButton onClick={onEdit} title="Edit room">
            <MdEdit className="w-3.5 h-3.5" />
          </IconButton>
          <IconButton onClick={onDelete} title="Delete room" tone="danger">
            <MdDelete className="w-3.5 h-3.5" />
          </IconButton>
        </div>
      </div>

      {links.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {links.map((bs) => (
            <SpeakerChip
              key={bs.id}
              size="sm"
              name={
                (bs.speaker ?? speakers.find((s) => s.id === bs.speaker_id))
                  ?.name ?? bs.speaker_id
              }
              role={bs.role}
              onRemove={async () => {
                const ok = await confirm({
                  title: "Remove speaker from room?",
                  confirmLabel: "Remove",
                });
                if (ok)
                  deleteSpeaker.mutate({
                    eventId,
                    agendaId,
                    breakoutRoomId: room.id,
                    id: bs.id,
                  });
              }}
            />
          ))}
        </div>
      )}

      <LinkSpeakerForm
        compact
        speakers={speakers}
        taken={links.map((l) => l.speaker_id)}
        pending={createSpeaker.isPending}
        onLink={(speaker_id, role, done) =>
          createSpeaker.mutate(
            {
              eventId,
              agendaId,
              breakoutRoomId: room.id,
              input: { speaker_id, role: role || null },
            },
            { onSuccess: done },
          )
        }
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Shared speaker-linking bits
 * ────────────────────────────────────────────────────────────────────── */

const SpeakerChip = ({
  name,
  role,
  onRemove,
  size = "md",
}: {
  name: string;
  role?: string | null;
  onRemove: () => void;
  size?: "sm" | "md";
}) => (
  <span
    className={`inline-flex items-center gap-1 bg-white border border-slate-200 rounded-full pl-2.5 pr-1 py-0.5 ${
      size === "sm" ? "text-[11px]" : "text-xs"
    }`}
  >
    <span className="font-medium text-slate-800 max-w-32 truncate">{name}</span>
    {role && <span className="text-[10px] text-slate-400">· {role}</span>}
    <button
      onClick={onRemove}
      aria-label={`Remove ${name}`}
      className="p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
    >
      <MdClose className="w-3 h-3" />
    </button>
  </span>
);

/** Speakers already linked drop out of the picker, so you cannot double-add. */
function LinkSpeakerForm({
  speakers,
  taken,
  pending,
  onLink,
  compact,
}: {
  speakers: Speaker[];
  taken: string[];
  pending: boolean;
  onLink: (speakerId: string, role: string, done: () => void) => void;
  compact?: boolean;
}) {
  const [speakerId, setSpeakerId] = useState("");
  const [role, setRole] = useState<string>(DEFAULT_ROLE);

  const available = speakers.filter((s) => !taken.includes(s.id));
  const control = compact
    ? "text-[11px] px-2 py-1 rounded"
    : "text-xs px-2.5 py-1.5 rounded-md";

  if (available.length === 0)
    return (
      <p className="text-[11px] text-slate-400">
        {speakers.length === 0
          ? "Add speakers in the Line-up tab first."
          : "Every speaker is already linked here."}
      </p>
    );

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={speakerId}
        onChange={(e) => setSpeakerId(e.target.value)}
        className={`flex-1 min-w-0 border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 ${control}`}
      >
        <option value="">+ Add speaker…</option>
        {available.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        aria-label="Role"
        className={`w-28 shrink-0 border border-slate-200 bg-white text-slate-700 capitalize focus:outline-none focus:ring-2 focus:ring-primary/30 ${control}`}
      >
        {SPEAKER_ROLES.map((r) => (
          <option key={r} value={r} className="capitalize">
            {r}
          </option>
        ))}
      </select>
      <button
        disabled={!speakerId || pending}
        onClick={() =>
          onLink(speakerId, role, () => {
            setSpeakerId("");
            setRole(DEFAULT_ROLE);
          })
        }
        className="shrink-0 text-xs font-medium text-primary hover:text-primary/80 disabled:text-slate-300 px-1"
      >
        {pending ? "…" : "Link"}
      </button>
    </div>
  );
}
