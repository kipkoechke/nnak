"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MdReceiptLong,
  MdConfirmationNumber,
  MdHowToReg,
  MdCheckCircle,
} from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { usePublicEvent } from "@/hooks/use-public-events";
import {
  useAttendanceReport,
  useEventAttendees,
  useEventBookings,
} from "@/hooks/use-event-operations";
import type { AttendanceType } from "@/types/nnak";

/** Finance sees the same payloads as admin, read-only. */
const SCOPE = "finance" as const;

const TABS = [
  { key: "bookings", label: "Bookings", icon: MdReceiptLong },
  { key: "attendees", label: "Attendees", icon: MdConfirmationNumber },
  { key: "attendance", label: "Attendance", icon: MdHowToReg },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const BOOKING_STATUSES = [
  { value: "", label: "All" },
  { value: "pending_payment", label: "Awaiting payment" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

const statusTone = (s?: string | null) => {
  const v = (s || "").toLowerCase();
  if (v === "paid") return "bg-emerald-50 text-emerald-700";
  if (v === "pending_payment") return "bg-amber-50 text-amber-700";
  if (["cancelled", "expired"].includes(v)) return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function FinanceEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("bookings");
  const { data: event } = usePublicEvent(id);

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title={event?.title || "Event"}
        description="Read-only bookings, attendees and attendance"
        back={() => router.back()}
      />

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "bookings" && <BookingsView eventId={id} />}
      {tab === "attendees" && <AttendeesView eventId={id} />}
      {tab === "attendance" && <AttendanceView eventId={id} />}
    </div>
  );
}

const TableShell = ({
  head,
  children,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  </div>
);

const Empty = ({ message }: { message: string }) => (
  <div className="bg-white border border-dashed border-slate-300 rounded-xl py-12 text-center text-sm text-slate-500">
    {message}
  </div>
);

function BookingsView({ eventId }: { eventId: string }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useEventBookings(
    eventId,
    {
      page,
      per_page: 20,
      status: status || undefined,
      search: search.trim() || undefined,
    },
    SCOPE,
  );
  const bookings = data?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search reference, name or email…"
          className="flex-1 max-w-md px-3 py-2 border border-slate-300 rounded-md text-sm"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {BOOKING_STATUSES.map((opt) => (
            <button
              key={opt.value || "all"}
              onClick={() => {
                setStatus(opt.value);
                setPage(1);
              }}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                status === opt.value
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-40 bg-white border border-slate-200 rounded-xl animate-pulse" />
      ) : bookings.length === 0 ? (
        <Empty message="No bookings match." />
      ) : (
        <>
          <TableShell
            head={
              <>
                <th className="px-4 py-2">Reference</th>
                <th className="px-4 py-2">Booker</th>
                <th className="px-4 py-2">Ticket</th>
                <th className="px-4 py-2 text-right">Attendees</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Invoice</th>
              </>
            }
          >
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs text-slate-700">
                  {b.reference_code}
                </td>
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-900">
                    {b.contact_name || b.user?.name || "—"}
                  </div>
                  {(b.contact_email || b.user?.email) && (
                    <div className="text-xs text-slate-500">
                      {b.contact_email || b.user?.email}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {b.package_name || "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  {b.attendees_count ?? "—"}
                </td>
                <td className="px-4 py-2 text-right text-slate-900">
                  KES {Number(b.total_amount ?? 0).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${statusTone(
                      b.status,
                    )}`}
                  >
                    {String(b.status).replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-slate-600 capitalize">
                  {b.invoice_status || "—"}
                </td>
              </tr>
            ))}
          </TableShell>
          {data?.pagination && data.pagination.last_page > 1 && (
            <Pagination
              currentPage={page}
              totalPages={data.pagination.last_page}
              totalItems={data.pagination.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

function AttendeesView({ eventId }: { eventId: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useEventAttendees(
    eventId,
    { page, per_page: 50, search: search.trim() || undefined },
    SCOPE,
  );
  const attendees = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row md:items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search attendees…"
          className="flex-1 max-w-md px-3 py-2 border border-slate-300 rounded-md text-sm"
        />
        {meta && (
          <div className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              {meta.scanned_in}
            </span>{" "}
            of {meta.total} scanned in
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="h-40 bg-white border border-slate-200 rounded-xl animate-pulse" />
      ) : attendees.length === 0 ? (
        <Empty message="No attendees yet." />
      ) : (
        <>
          <TableShell
            head={
              <>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">Ticket</th>
              </>
            }
          >
            {attendees.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">
                  {a.name}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  <div>{a.email || "—"}</div>
                  {a.phone && (
                    <div className="text-xs text-slate-400">{a.phone}</div>
                  )}
                </td>
                <td className="px-4 py-2">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {a.type || "booked"}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-slate-600">
                  <div className="capitalize">{a.source || "—"}</div>
                  {a.booking_reference && (
                    <div className="font-mono text-slate-400">
                      {a.booking_reference}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-slate-600">
                  {a.ticket_number || "—"}
                </td>
              </tr>
            ))}
          </TableShell>
          {meta && meta.last_page > 1 && (
            <Pagination
              currentPage={page}
              totalPages={meta.last_page}
              totalItems={meta.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

const ATTENDANCE_TYPES: AttendanceType[] = ["arrival", "session", "departure"];

function AttendanceView({ eventId }: { eventId: string }) {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<"" | AttendanceType>("");

  const { data, isLoading } = useAttendanceReport(
    eventId,
    { page, per_page: 50, type: type || undefined },
    SCOPE,
  );
  const records = data?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-1.5">
        {[{ value: "", label: "All" }, ...ATTENDANCE_TYPES.map((t) => ({ value: t, label: t }))].map(
          (opt) => (
            <button
              key={opt.value || "all"}
              onClick={() => {
                setType(opt.value as "" | AttendanceType);
                setPage(1);
              }}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium capitalize transition-colors ${
                type === opt.value
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              {opt.label}
            </button>
          ),
        )}
      </div>

      {isLoading ? (
        <div className="h-40 bg-white border border-slate-200 rounded-xl animate-pulse" />
      ) : records.length === 0 ? (
        <Empty message="No attendance recorded yet." />
      ) : (
        <>
          <TableShell
            head={
              <>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Ticket</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Session</th>
                <th className="px-4 py-2">Scanned</th>
              </>
            }
          >
            {records.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">
                  {a.name}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-slate-600">
                  {a.ticket_number}
                </td>
                <td className="px-4 py-2 text-slate-600 capitalize">{a.type}</td>
                <td className="px-4 py-2 text-slate-600">{a.agenda || "—"}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                    <MdCheckCircle className="w-4 h-4" />
                    {fmtTime(a.scanned_at)}
                  </span>
                  {a.scanned_by && (
                    <div className="text-[11px] text-slate-400">
                      by {a.scanned_by}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </TableShell>
          {data?.pagination && data.pagination.last_page > 1 && (
            <Pagination
              currentPage={page}
              totalPages={data.pagination.last_page}
              totalItems={data.pagination.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
