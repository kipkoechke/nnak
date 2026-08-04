"use client";
import { useState } from "react";
import { MdCheck, MdDelete, MdEdit, MdPayments } from "react-icons/md";
import {
  useCreateEventPackage,
  useDeleteEventPackage,
  useEventPackages,
  useUpdateEventPackage,
} from "@/hooks/use-event-packages";
import type { EventPackage } from "@/types/nnak";
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
  SkeletonGrid,
  TextArea,
  Toggle,
  fmtMoney,
  useConfirm,
} from "./shared";

const empty = {
  name: "",
  description: "",
  cost: "",
  benefits: "",
  is_member_only: false,
  has_limit: false,
  max_entries: "",
};

/** Benefits are edited one-per-line and sent as an array. */
const parseBenefits = (v: string) =>
  v
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);

/** Tolerates the API sending benefits as an array, a JSON string, or null. */
const toBenefitList = (b: EventPackage["benefits"]): string[] => {
  if (Array.isArray(b)) return b;
  if (typeof b === "string") {
    try {
      const parsed = JSON.parse(b);
      return Array.isArray(parsed) ? parsed.map(String) : [b];
    } catch {
      return [b];
    }
  }
  return [];
};

export default function PackagesTab({ eventId }: { eventId: string }) {
  const { data, isLoading } = useEventPackages(eventId);
  const createPackage = useCreateEventPackage();
  const updatePackage = useUpdateEventPackage();
  const deletePackage = useDeleteEventPackage();
  const { confirm, dialog } = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const packages = data?.data ?? [];

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

  const openEdit = (p: EventPackage) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      description: p.description || "",
      cost: String(p.cost ?? ""),
      // Benefits have come back as a JSON-encoded string as well as an array;
      // `.join` on a string would throw and leave the dialog unopened.
      benefits: toBenefitList(p.benefits).join("\n"),
      is_member_only: !!p.is_member_only,
      has_limit: !!p.has_limit,
      max_entries: p.max_entries != null ? String(p.max_entries) : "",
    });
    setModalOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Optional fields are validated by type when present, so an empty one is
    // sent as an empty string / empty array (which also clears it) rather
    // than as null, which the API rejects.
    const input = {
      name: form.name,
      description: form.description,
      cost: form.cost === "" ? 0 : Number(form.cost),
      benefits: parseBenefits(form.benefits),
      is_member_only: form.is_member_only,
      has_limit: form.has_limit,
      // The API requires max_entries whenever the tier is capped, and
      // ignores it otherwise.
      ...(form.has_limit && form.max_entries !== ""
        ? { max_entries: Number(form.max_entries) }
        : {}),
    };
    if (editId)
      updatePackage.mutate(
        { eventId, id: editId, input },
        { onSuccess: reset },
      );
    else createPackage.mutate({ eventId, input }, { onSuccess: reset });
  };

  const remove = async (p: EventPackage) => {
    const ok = await confirm({
      title: `Delete package "${p.name}"?`,
      body: "Existing bookings on this package are not removed, but nobody can book it again.",
    });
    if (ok) deletePackage.mutate({ eventId, id: p.id });
  };

  return (
    <div className="space-y-4">
      {dialog}

      <SectionHeader
        title="Packages"
        description="What attendees book and pay for"
        count={packages.length}
        action={<AddBtn onClick={openNew} label="New package" />}
      />

      {isLoading ? (
        <SkeletonGrid />
      ) : packages.length === 0 ? (
        <EmptyState
          icon={MdPayments}
          title="No packages yet"
          description="Add packages so members and the public can book and pay for this event."
          action={<AddBtn onClick={openNew} label="Add the first package" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {packages.map((p) => (
            <div
              key={p.id}
              className="group bg-white border border-slate-200 rounded-xl p-4 flex flex-col hover:border-primary hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-900 truncate">
                    {p.name}
                  </h4>
                  <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                    {fmtMoney(p.cost)}
                  </div>
                </div>
                <RowActions>
                  <IconButton onClick={() => openEdit(p)} title="Edit package">
                    <MdEdit className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    onClick={() => remove(p)}
                    title="Delete package"
                    tone="danger"
                  >
                    <MdDelete className="w-4 h-4" />
                  </IconButton>
                </RowActions>
              </div>

              {p.description && (
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                  {p.description}
                </p>
              )}

              {(() => {
                const benefits = toBenefitList(p.benefits);
                if (!benefits.length) return null;
                return (
                  <ul className="mt-3 space-y-1">
                    {benefits.slice(0, 4).map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-1.5 text-xs text-slate-600"
                      >
                        <MdCheck className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="min-w-0">{b}</span>
                      </li>
                    ))}
                    {benefits.length > 4 && (
                      <li className="text-[11px] text-slate-400 pl-5">
                        +{benefits.length - 4} more
                      </li>
                    )}
                  </ul>
                );
              })()}

              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                {p.is_member_only ? (
                  <Badge tone="primary">Members only</Badge>
                ) : (
                  <Badge>Open to all</Badge>
                )}
                {p.has_limit && p.max_entries != null && (
                  <Badge tone="amber">Cap {p.max_entries}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={reset}
        title={editId ? "Edit package" : "New package"}
        size="lg"
      >
        <form onSubmit={submit} className="space-y-3">
          <Field
            label="Name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            required
            placeholder="e.g. Early Bird"
          />
          <TextArea
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder="What's included in this package?"
          />
          <Field
            label="Cost (KES)"
            type="number"
            value={form.cost}
            onChange={(v) => setForm({ ...form, cost: v })}
            required
          />
          <TextArea
            label="Benefits (one per line)"
            value={form.benefits}
            onChange={(v) => setForm({ ...form, benefits: v })}
            placeholder={"Access to all sessions\nLunch"}
          />
          <div className="flex flex-wrap gap-4 pt-1">
            <Toggle
              label="Members only"
              checked={form.is_member_only}
              onChange={(v) => setForm({ ...form, is_member_only: v })}
            />
            <Toggle
              label="Cap total entries"
              checked={form.has_limit}
              onChange={(v) => setForm({ ...form, has_limit: v })}
            />
          </div>
          {form.has_limit && (
            <Field
              label="Max entries"
              type="number"
              value={form.max_entries}
              onChange={(v) => setForm({ ...form, max_entries: v })}
              required
            />
          )}
          <FormActions
            onCancel={reset}
            saving={createPackage.isPending || updatePackage.isPending}
            submitLabel={editId ? "Save changes" : "Create package"}
          />
        </form>
      </Modal>
    </div>
  );
}
