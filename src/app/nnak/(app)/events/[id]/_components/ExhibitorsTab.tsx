"use client";
import { useState } from "react";
import { MdCampaign, MdDelete, MdEdit, MdStore } from "react-icons/md";
import {
  useCreateExhibitor,
  useDeleteExhibitor,
  useExhibitors,
  useUpdateExhibitor,
} from "@/hooks/use-exhibitors";
import type { Exhibitor } from "@/types/nnak";
import {
  AddBtn,
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

const empty = { name: "", description: "", logo_url: "", booth_number: "" };

export default function ExhibitorsTab({ eventId }: { eventId: string }) {
  const { data, isLoading } = useExhibitors(eventId);
  const createExhibitor = useCreateExhibitor();
  const updateExhibitor = useUpdateExhibitor();
  const deleteExhibitor = useDeleteExhibitor();
  const { confirm, dialog } = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const exhibitors = data?.data ?? [];

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

  const openEdit = (ex: Exhibitor) => {
    setEditId(ex.id);
    setForm({
      name: ex.name,
      description: ex.description ?? "",
      logo_url: ex.logo_url ?? "",
      booth_number: ex.booth_number ?? "",
    });
    setModalOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = {
      name: form.name,
      description: form.description || null,
      logo_url: form.logo_url || null,
      booth_number: form.booth_number || null,
    };
    if (editId)
      updateExhibitor.mutate(
        { eventId, id: editId, input },
        { onSuccess: reset },
      );
    else createExhibitor.mutate({ eventId, input }, { onSuccess: reset });
  };

  const remove = async (ex: Exhibitor) => {
    const ok = await confirm({ title: `Delete exhibitor ${ex.name}?` });
    if (ok) deleteExhibitor.mutate({ eventId, id: ex.id });
  };

  return (
    <div className="space-y-4">
      {dialog}

      <SectionHeader
        title="Exhibitors"
        description="Vendors and organisations with stands on the event floor"
        count={exhibitors.length}
        action={<AddBtn onClick={openNew} label="New exhibitor" />}
      />

      {isLoading ? (
        <SkeletonGrid />
      ) : exhibitors.length === 0 ? (
        <EmptyState
          icon={MdStore}
          title="No exhibitors yet"
          description="Add the organisations that will have stands at the event."
          action={<AddBtn onClick={openNew} label="Add an exhibitor" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {exhibitors.map((ex) => (
            <div
              key={ex.id}
              className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all flex gap-3"
            >
              <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {ex.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ex.logo_url}
                    alt={ex.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <MdStore className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 truncate">
                  {ex.name}
                </h4>
                {ex.booth_number && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <MdCampaign className="w-3.5 h-3.5" />
                    Booth {ex.booth_number}
                  </div>
                )}
                {ex.description && (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                    {ex.description}
                  </p>
                )}
              </div>
              <RowActions>
                <IconButton onClick={() => openEdit(ex)} title="Edit">
                  <MdEdit className="w-4 h-4" />
                </IconButton>
                <IconButton
                  onClick={() => remove(ex)}
                  title="Delete"
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
        title={editId ? "Edit exhibitor" : "New exhibitor"}
        size="lg"
      >
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              required
            />
            <Field
              label="Booth"
              value={form.booth_number}
              onChange={(v) => setForm({ ...form, booth_number: v })}
              placeholder="A12"
            />
          </div>
          <Field
            label="Logo URL"
            value={form.logo_url}
            onChange={(v) => setForm({ ...form, logo_url: v })}
            placeholder="https://…"
          />
          <TextArea
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
          />
          <FormActions
            onCancel={reset}
            saving={createExhibitor.isPending || updateExhibitor.isPending}
            submitLabel={editId ? "Save changes" : "Add exhibitor"}
          />
        </form>
      </Modal>
    </div>
  );
}
