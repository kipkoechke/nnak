"use client";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MdSearch } from "react-icons/md";
import { ModalShell } from "@/components/common/Modal";

interface BranchOption {
  id: string;
  name: string;
}

interface GenerateBatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: BranchOption[];
  isPending: boolean;
  /** Resolves once the generation job has been queued. */
  onSubmit: (input: { period: string; branch_ids?: string[] }) => Promise<void>;
}

/** Defaults to the previous month, which is the period the scheduled job
 *  batches on the 16th. */
const previousMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function GenerateBatchesModal({
  isOpen,
  onClose,
  branches,
  isPending,
  onSubmit,
}: GenerateBatchesModalProps) {
  const [period, setPeriod] = useState(previousMonth);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? branches.filter((b) => b.name.toLowerCase().includes(q)) : branches;
  }, [branches, search]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const close = () => {
    setSelected([]);
    setSearch("");
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}-\d{2}$/.test(period)) {
      toast.error("Pick a period first");
      return;
    }
    // An empty selection means every branch, which is what the API does when
    // `branch_ids` is omitted.
    await onSubmit({
      period,
      branch_ids: selected.length ? selected : undefined,
    });
    close();
  };

  return (
    <ModalShell isOpen={isOpen} onClose={close} size="lg">
      <form onSubmit={submit} className="space-y-4 p-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Generate Batches
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Existing batches for this period and these branches are deleted and
            rebuilt in the background. Batches already marked paid keep their
            payments only if you leave their branch out.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Period <span className="text-red-500">*</span>
          </label>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Branches
            </label>
            <span className="text-[11px] text-slate-500">
              {selected.length
                ? `${selected.length} selected`
                : "All branches"}
            </span>
          </div>

          <div className="relative mb-2">
            <MdSearch className="absolute left-2.5 top-2.5 text-slate-400 w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter branches…"
              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-md divide-y divide-slate-100">
            {visible.length === 0 ? (
              <div className="p-4 text-xs text-center text-slate-500">
                No branches match.
              </div>
            ) : (
              visible.map((b) => (
                <label
                  key={b.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(b.id)}
                    onChange={() => toggle(b.id)}
                    className="accent-primary"
                  />
                  <span>{b.name}</span>
                </label>
              ))
            )}
          </div>

          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="text-[11px] text-primary font-semibold mt-2 hover:underline"
            >
              Clear selection (generate for all branches)
            </button>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={close}
            disabled={isPending}
            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Queueing…" : "Generate"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
