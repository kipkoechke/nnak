"use client";
import { useMemo, useState } from "react";
import {
  MdBusinessCenter,
  MdDelete,
  MdEdit,
  MdHandshake,
  MdOpenInNew,
} from "react-icons/md";
import {
  useCreateSponsor,
  useDeleteSponsor,
  useSponsors,
  useUpdateSponsor,
} from "@/hooks/use-sponsors";
import ImageUpload from "@/components/common/ImageUpload";
import type { Sponsor } from "@/types/nnak";
import {
  AddBtn,
  EmptyState,
  Field,
  FormActions,
  IconButton,
  Modal,
  RowActions,
  SectionHeader,
  Select,
  SkeletonGrid,
  useConfirm,
} from "./shared";

/** Tier is free-form on the API; these are the ones we style and rank. */
const TIERS = [
  "Platinum",
  "Gold",
  "Silver",
  "Bronze",
  "Partner",
  "Media",
  "Other",
];

const TIER_ORDER = TIERS.map((t) => t.toLowerCase());

const TIER_TONE: Record<string, string> = {
  platinum: "bg-slate-100 text-slate-800 border-slate-300",
  gold: "bg-amber-50 text-amber-800 border-amber-200",
  silver: "bg-zinc-100 text-zinc-700 border-zinc-200",
  bronze: "bg-orange-50 text-orange-700 border-orange-200",
  partner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  media: "bg-violet-50 text-violet-700 border-violet-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
};

const empty = { name: "", website: "", tier: "Platinum" };

export default function SponsorsTab({ eventId }: { eventId: string }) {
  const { data, isLoading } = useSponsors(eventId);
  const createSponsor = useCreateSponsor();
  const updateSponsor = useUpdateSponsor();
  const deleteSponsor = useDeleteSponsor();
  const { confirm, dialog } = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  // Logos are uploaded, not linked. `logoUrl` is the stored image kept for
  // preview; it is left alone when no new file is picked.
  const [logoFile, setLogoFile] = useState<File | undefined>();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const sponsors = useMemo(() => data?.data ?? [], [data]);

  /** Grouped by tier so the pecking order is visible at a glance. */
  const grouped = useMemo(() => {
    const buckets = new Map<string, Sponsor[]>();
    sponsors.forEach((s) => {
      const key = s.tier || "Other";
      buckets.set(key, [...(buckets.get(key) ?? []), s]);
    });
    return Array.from(buckets.entries()).sort(
      ([a], [b]) =>
        TIER_ORDER.indexOf(a.toLowerCase()) -
        TIER_ORDER.indexOf(b.toLowerCase()),
    );
  }, [sponsors]);

  const reset = () => {
    setForm(empty);
    setEditId(null);
    setLogoFile(undefined);
    setLogoUrl(null);
    setModalOpen(false);
  };

  const openNew = () => {
    setForm(empty);
    setEditId(null);
    setLogoFile(undefined);
    setLogoUrl(null);
    setModalOpen(true);
  };

  const openEdit = (s: Sponsor) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      website: s.website ?? "",
      tier: s.tier ?? "Other",
    });
    setLogoFile(undefined);
    setLogoUrl(s.logo_url ?? null);
    setModalOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only send the logo when a new one was picked; omitting it keeps the
    // stored image.
    const input = { ...form, ...(logoFile ? { logo_url: logoFile } : {}) };
    if (editId)
      updateSponsor.mutate({ eventId, id: editId, input }, { onSuccess: reset });
    else createSponsor.mutate({ eventId, input }, { onSuccess: reset });
  };

  const remove = async (s: Sponsor) => {
    const ok = await confirm({ title: `Delete sponsor ${s.name}?` });
    if (ok) deleteSponsor.mutate({ eventId, id: s.id });
  };

  return (
    <div className="space-y-4">
      {dialog}

      <SectionHeader
        title="Sponsors & partners"
        description="The organisations backing this event, ranked by tier"
        count={sponsors.length}
        action={<AddBtn onClick={openNew} label="New sponsor" />}
      />

      {isLoading ? (
        <SkeletonGrid />
      ) : sponsors.length === 0 ? (
        <EmptyState
          icon={MdHandshake}
          title="No sponsors or partners yet"
          description="Add the organisations supporting this event so they show on the public page."
          action={<AddBtn onClick={openNew} label="Add a sponsor" />}
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(([tier, items]) => (
            <div key={tier}>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-xs uppercase font-semibold text-slate-500 tracking-wide">
                  {tier}
                </h4>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {items.length}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map((s) => (
                  <div
                    key={s.id}
                    className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all flex gap-3"
                  >
                    <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {s.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.logo_url}
                          alt={s.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <MdBusinessCenter className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 truncate">
                        {s.name}
                      </h4>
                      {s.tier && (
                        <span
                          className={`inline-block mt-1 text-[10px] uppercase font-semibold tracking-wide px-2 py-0.5 rounded-full border ${
                            TIER_TONE[s.tier.toLowerCase()] || TIER_TONE.other
                          }`}
                        >
                          {s.tier}
                        </span>
                      )}
                      {s.website && (
                        <a
                          href={s.website}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline truncate"
                        >
                          Visit website <MdOpenInNew className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <RowActions>
                      <IconButton onClick={() => openEdit(s)} title="Edit">
                        <MdEdit className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        onClick={() => remove(s)}
                        title="Delete"
                        tone="danger"
                      >
                        <MdDelete className="w-4 h-4" />
                      </IconButton>
                    </RowActions>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={reset}
        title={editId ? "Edit sponsor" : "New sponsor / partner"}
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
            <Select
              label="Tier"
              value={form.tier}
              onChange={(v) => setForm({ ...form, tier: v })}
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <Field
            label="Website"
            value={form.website}
            onChange={(v) => setForm({ ...form, website: v })}
            placeholder="https://…"
          />
          <ImageUpload
            label="Logo"
            currentUrl={logoUrl}
            file={logoFile}
            onChange={setLogoFile}
            helperText="A transparent PNG sits best on the sponsor wall."
          />
          <FormActions
            onCancel={reset}
            saving={createSponsor.isPending || updateSponsor.isPending}
            submitLabel={editId ? "Save changes" : "Add sponsor"}
          />
        </form>
      </Modal>
    </div>
  );
}
