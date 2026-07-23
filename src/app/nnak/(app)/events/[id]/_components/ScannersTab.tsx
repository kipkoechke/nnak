"use client";
import { useMemo, useState } from "react";
import { MdAdd, MdDelete, MdQrCodeScanner } from "react-icons/md";
import { useAdmins } from "@/hooks/use-admins";
import {
  useCreateEventScanner,
  useDeleteEventScanner,
  useEventScanners,
} from "@/hooks/use-event-operations";
import type { EventScanner } from "@/types/nnak";
import {
  Avatar,
  EmptyState,
  IconButton,
  SearchInput,
  SectionHeader,
  SkeletonList,
  fmtDateTime,
  useConfirm,
} from "./shared";

export default function ScannersTab({ eventId }: { eventId: string }) {
  const { data, isLoading } = useEventScanners(eventId);
  const { data: adminsData, isLoading: adminsLoading } = useAdmins();
  const createScanner = useCreateEventScanner();
  const deleteScanner = useDeleteEventScanner();
  const { confirm, dialog } = useConfirm();
  const [query, setQuery] = useState("");

  const scanners = useMemo(() => data ?? [], [data]);

  // The API nominates by user id, so offer the staff directory rather than
  // asking an admin to paste a UUID. Anyone already nominated drops out.
  const candidates = useMemo(() => {
    const taken = new Set(scanners.map((s) => s.user.id));
    const q = query.trim().toLowerCase();
    return (adminsData ?? [])
      .filter((u) => !taken.has(u.id))
      .filter(
        (u) =>
          !q ||
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q),
      );
  }, [adminsData, scanners, query]);

  const remove = async (s: EventScanner) => {
    const ok = await confirm({
      title: `Remove ${s.user.name} as a scanner?`,
      body: "They lose the ability to check attendees in for this event.",
      confirmLabel: "Remove",
    });
    if (ok) deleteScanner.mutate({ eventId, scannerId: s.id });
  };

  return (
    <div className="space-y-4">
      {dialog}

      <SectionHeader
        title="Scanners"
        description="Staff who can scan tickets and check attendees in at the door"
        count={scanners.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* ── Nominate ── */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-900">
              Nominate a scanner
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Pick a staff member to give ticket-scanning access.
            </p>
          </div>

          <div className="p-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search staff by name or email…"
            />
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border-t border-slate-100">
            {adminsLoading ? (
              <div className="p-4 text-sm text-slate-500">Loading staff…</div>
            ) : candidates.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                {query
                  ? "No staff match that search."
                  : "Everyone available has already been nominated."}
              </div>
            ) : (
              candidates.map((u) => (
                <button
                  key={u.id}
                  onClick={() =>
                    createScanner.mutate({ eventId, input: { user_id: u.id } })
                  }
                  disabled={createScanner.isPending}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-primary/5 disabled:opacity-50 transition-colors"
                >
                  <Avatar name={u.name || u.email} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {u.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {u.email}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary shrink-0">
                    <MdAdd className="w-4 h-4" /> Nominate
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Nominated ── */}
        <div>
          {isLoading ? (
            <SkeletonList />
          ) : scanners.length === 0 ? (
            <EmptyState
              icon={MdQrCodeScanner}
              title="No scanners nominated"
              description="Pick staff from the list to let them check attendees in."
            />
          ) : (
            <div className="space-y-2">
              {scanners.map((s) => (
                <div
                  key={s.id}
                  className="group bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3"
                >
                  <Avatar name={s.user.name || s.user.email} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {s.user.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {s.user.email}
                    </div>
                    {s.nominated_at && (
                      <div className="text-[11px] text-slate-400 truncate">
                        Nominated {fmtDateTime(s.nominated_at)}
                        {s.nominated_by ? ` by ${s.nominated_by}` : ""}
                      </div>
                    )}
                  </div>
                  <IconButton
                    onClick={() => remove(s)}
                    title="Remove scanner"
                    tone="danger"
                  >
                    <MdDelete className="w-4 h-4" />
                  </IconButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
