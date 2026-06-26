"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  MdCalendarToday,
  MdEvent,
  MdLocationOn,
  MdPeople,
} from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import { useMemberEvent, useMemberEventPackages } from "@/hooks/use-member-events";
import {
  useInvoiceStkPush,
  useInvoiceStkQuery,
} from "@/hooks/use-member-payments";
import { PhoneInputField } from "@/components/common/PhoneInputField";
import { useNnakMe } from "@/hooks/use-auth";
import { nqk } from "@/lib/query-keys";
import type { MemberEventPackage } from "@/types/nnak";

const STATUS_TONE: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  draft: "bg-slate-100 text-slate-700 border-slate-200",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  if (s.toDateString() === e.toDateString()) return fmtDate(start);
  return `${fmtDate(start)} → ${fmtDate(end)}`;
};

export default function MemberEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me } = useNnakMe();
  const { data: event, isLoading } = useMemberEvent(id);
  const { data: packages = [], isLoading: packagesLoading } =
    useMemberEventPackages(id);

  const [tab, setTab] = useState<"details" | "packages">("details");
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPackage, setSelectedPackage] =
    useState<MemberEventPackage | null>(null);
  const [stkPhone, setStkPhone] = useState(me?.profile?.phone || "");
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const stkPush = useInvoiceStkPush();

  const isTerminal = (s?: string | null) =>
    !!s &&
    ["successful", "success", "failed", "cancelled", "timeout"].includes(
      String(s).toLowerCase(),
    );

  const stkQuery = useInvoiceStkQuery(activeInvoiceId, {
    enabled: !!activeInvoiceId,
    refetchInterval: (data) => {
      const s = data?.status?.toLowerCase();
      return isTerminal(s) ? false : 3000;
    },
  });

  const stkStatus = stkQuery.data?.status?.toLowerCase();
  const isSuccess = stkStatus === "successful" || stkStatus === "success";
  const isFailed =
    stkStatus === "failed" ||
    stkStatus === "cancelled" ||
    stkStatus === "timeout";

  useEffect(() => {
    if (!isSuccess) return;
    qc.invalidateQueries({ queryKey: nqk.memberEvents.detail(id) });
    qc.invalidateQueries({ queryKey: nqk.memberEvents.packages(id) });
    const t = setTimeout(() => {
      setShowPayModal(false);
      setActiveInvoiceId(null);
      setPaymentError(null);
      setSelectedPackage(null);
    }, 1500);
    return () => clearTimeout(t);
  }, [isSuccess, qc, id]);

  useEffect(() => {
    if (!isFailed) return;
    const reason =
      stkQuery.data?.ResultDesc ||
      stkQuery.data?.message ||
      "Payment was not completed.";
    setPaymentError(reason);
    setActiveInvoiceId(null);
    stkPush.reset();
  }, [isFailed, stkQuery.data, stkStatus, stkPush]);

  if (isLoading)
    return <div className="p-4 text-sm text-slate-500">Loading event…</div>;
  if (!event)
    return <div className="p-4 text-sm text-slate-500">Event not found.</div>;

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title={event.title}
        description={event.theme || undefined}
        back={() => router.back()}
        action={
          <span
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_TONE[event.status] || STATUS_TONE.draft}`}
          >
            {event.status}
          </span>
        }
      />

      {/* Cover */}
      {event.cover_image_url && (
        <div className="relative h-48 rounded-xl overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}

      {/* Key info */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <MdCalendarToday className="w-4 h-4 text-slate-400 shrink-0" />
            {fmtRange(event.start_date, event.end_date)}
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-slate-700">
              <MdLocationOn className="w-4 h-4 text-slate-400 shrink-0" />
              {event.location}
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-700">
            <MdEvent className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="capitalize">{event.type}</span>
          </div>
        </div>
        {event.is_registered && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
            <MdPeople className="w-3.5 h-3.5" /> You are registered for this event
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(["details", "packages"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Details tab */}
      {tab === "details" && (
        <div className="space-y-4">
          {event.description && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                About this event
              </h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {event.speakers && event.speakers.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Speakers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.speakers.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.photo_url}
                        alt={s.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {s.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {s.name}
                      </div>
                      {s.role && (
                        <div className="text-xs text-slate-500">{s.role}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.agenda && event.agenda.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Agenda
              </h3>
              <div className="space-y-2">
                {event.agenda.map((a) => (
                  <div
                    key={a.id}
                    className="flex gap-3 text-sm border-l-2 border-primary/30 pl-3 py-1"
                  >
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      {a.start_time} – {a.end_time}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{a.title}</div>
                      {a.description && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {a.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Packages tab */}
      {tab === "packages" && (
        <div>
          {packagesLoading ? (
            <div className="p-6 text-sm text-slate-500">Loading packages…</div>
          ) : packages.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl py-12 text-center">
              <MdEvent className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                No packages available for this event.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isRegistered={!!event.is_registered}
                  onSelect={() => {
                    setSelectedPackage(pkg);
                    setStkPhone(me?.profile?.phone || "");
                    setPaymentError(null);
                    setActiveInvoiceId(null);
                    setShowPayModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* M-Pesa Payment Modal */}
      {showPayModal && selectedPackage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowPayModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Register &amp; Pay
              </h3>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl"
              >
                &times;
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Package</span>
                <span className="font-semibold">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-600">Amount</span>
                <span className="font-semibold">
                  KES {Number(selectedPackage.price).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <PhoneInputField
                label="M-Pesa Phone Number"
                value={stkPhone || me?.profile?.phone || ""}
                onChange={(val) => setStkPhone(val || "")}
                defaultCountry="KE"
              />
            </div>

            {/* Note: the STK push here uses the invoice generated on package selection.
                When the backend returns an invoice_id we poll via stkQuery.
                For now we pass a placeholder — the backend should return invoice details
                upon event registration with package. */}
            <button
              onClick={() => {
                const phone = stkPhone || me?.profile?.phone || "";
                if (!phone || !selectedPackage) return;
                setPaymentError(null);
                // The backend returns an invoice_id after creating an event registration.
                // Initiate STK push once you have that invoice ID from the registration flow.
                toast("To pay, complete event registration first to receive an invoice.", { icon: "ℹ️" });
              }}
              disabled={
                stkPush.isPending ||
                (!!activeInvoiceId && !isFailed && !isSuccess)
              }
              className="w-full bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-emerald-700 disabled:opacity-50"
            >
              {stkPush.isPending
                ? "Sending..."
                : activeInvoiceId && !isFailed && !isSuccess
                  ? "Waiting for confirmation…"
                  : paymentError
                    ? "Retry Payment"
                    : "Pay via M-Pesa"}
            </button>

            {activeInvoiceId && !isSuccess && !isFailed && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                <span className="inline-block w-3 h-3 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                STK Push sent. Enter your M-Pesa PIN on your phone.
              </div>
            )}

            {isSuccess && (
              <div className="text-xs rounded-md px-3 py-2 text-center font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">
                Payment successful! Your registration is confirmed.
              </div>
            )}

            {paymentError && !activeInvoiceId && (
              <div className="text-xs rounded-md px-3 py-2 bg-red-50 border border-red-200 text-red-700">
                <div className="font-semibold mb-0.5">Payment failed</div>
                <div>{paymentError}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const PackageCard = ({
  pkg,
  isRegistered,
  onSelect,
}: {
  pkg: MemberEventPackage;
  isRegistered: boolean;
  onSelect: () => void;
}) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 hover:border-primary hover:shadow-sm transition-all">
    <div className="flex items-start justify-between gap-2">
      <h4 className="font-semibold text-slate-900">{pkg.name}</h4>
      {pkg.is_available === false && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 whitespace-nowrap">
          Sold out
        </span>
      )}
    </div>

    {pkg.description && (
      <p className="text-xs text-slate-500 leading-relaxed">{pkg.description}</p>
    )}

    {pkg.features && pkg.features.length > 0 && (
      <ul className="text-xs text-slate-600 space-y-1">
        {pkg.features.map((f, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    )}

    {pkg.capacity != null && (
      <div className="text-xs text-slate-500">
        Capacity: {pkg.available ?? "?"} / {pkg.capacity} available
      </div>
    )}

    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
      <div className="text-base font-bold text-slate-900">
        KES {Number(pkg.price).toLocaleString()}
      </div>
      <button
        onClick={onSelect}
        disabled={pkg.is_available === false || isRegistered}
        className="text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isRegistered ? "Registered" : "Select"}
      </button>
    </div>
  </div>
);
