"use client";
import { useState } from "react";
import { MdDelete, MdEdit, MdMic } from "react-icons/md";
import {
  useCreateSpeaker,
  useDeleteSpeaker,
  useSpeakers,
  useUpdateSpeaker,
} from "@/hooks/use-speakers";
import type { Speaker } from "@/types/nnak";
import {
  AddBtn,
  Avatar,
  EmptyState,
  Field,
  FormActions,
  IconButton,
  Modal,
  RowActions,
  SectionHeader,
  SkeletonGrid,
  TextArea,
  useConfirm,
} from "./shared";

const empty = {
  name: "",
  title: "",
  organization: "",
  bio: "",
  photo_url: "",
};

export default function SpeakersTab({ eventId }: { eventId: string }) {
  const { data, isLoading } = useSpeakers(eventId);
  const createSpeaker = useCreateSpeaker();
  const updateSpeaker = useUpdateSpeaker();
  const deleteSpeaker = useDeleteSpeaker();
  const { confirm, dialog } = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const speakers = data?.data ?? [];

  const reset = () => {
    setForm(empty);
    setEditId(null);
    setModalOpen(false);
  };

  const openNew = () => {
    setForm(empty);
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (s: Speaker) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      title: s.title ?? "",
      organization: s.organization ?? "",
      bio: s.bio ?? "",
      photo_url: s.photo_url ?? "",
    });
    setModalOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId)
      updateSpeaker.mutate(
        { eventId, id: editId, input: form },
        { onSuccess: reset },
      );
    else createSpeaker.mutate({ eventId, input: form }, { onSuccess: reset });
  };

  const remove = async (s: Speaker) => {
    const ok = await confirm({
      title: `Delete ${s.name}?`,
      body: "They are unlinked from every session and breakout room they appear in.",
    });
    if (ok) deleteSpeaker.mutate({ eventId, id: s.id });
  };

  return (
    <div className="space-y-4">
      {dialog}

      <SectionHeader
        title="Speaker directory"
        description="The people who present at this event — link them to sessions in Programme"
        count={speakers.length}
        action={<AddBtn onClick={openNew} label="New speaker" />}
      />

      {isLoading ? (
        <SkeletonGrid />
      ) : speakers.length === 0 ? (
        <EmptyState
          icon={MdMic}
          title="No speakers yet"
          description="Add speakers here first, then assign them to sessions and breakout rooms in the Programme tab."
          action={<AddBtn onClick={openNew} label="Add the first speaker" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {speakers.map((s) => (
            <div
              key={s.id}
              className="group bg-white border border-slate-200 rounded-xl p-4 flex gap-3 hover:border-primary hover:shadow-sm transition-all"
            >
              <Avatar name={s.name} src={s.photo_url} />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 truncate">
                  {s.name}
                </h4>
                {s.title && (
                  <div className="text-xs text-slate-600 truncate">
                    {s.title}
                  </div>
                )}
                {s.organization && (
                  <div className="text-[11px] text-slate-500 truncate">
                    {s.organization}
                  </div>
                )}
                {s.bio && (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                    {s.bio}
                  </p>
                )}
              </div>
              <RowActions>
                <IconButton onClick={() => openEdit(s)} title="Edit speaker">
                  <MdEdit className="w-4 h-4" />
                </IconButton>
                <IconButton
                  onClick={() => remove(s)}
                  title="Delete speaker"
                  tone="danger"
                >
                  <MdDelete className="w-4 h-4" />
                </IconButton>
              </RowActions>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={reset}
        title={editId ? "Edit speaker" : "New speaker"}
        size="lg"
      >
        <form onSubmit={submit} className="space-y-3">
          <Field
            label="Name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Title"
              value={form.title}
              onChange={(v) => setForm({ ...form, title: v })}
              placeholder="Chief Nursing Officer"
            />
            <Field
              label="Organization"
              value={form.organization}
              onChange={(v) => setForm({ ...form, organization: v })}
            />
          </div>
          <Field
            label="Photo URL"
            value={form.photo_url}
            onChange={(v) => setForm({ ...form, photo_url: v })}
            placeholder="https://…"
          />
          <TextArea
            label="Bio"
            value={form.bio}
            onChange={(v) => setForm({ ...form, bio: v })}
            rows={4}
          />
          <FormActions
            onCancel={reset}
            saving={createSpeaker.isPending || updateSpeaker.isPending}
            submitLabel={editId ? "Save changes" : "Add speaker"}
          />
        </form>
      </Modal>
    </div>
  );
}
