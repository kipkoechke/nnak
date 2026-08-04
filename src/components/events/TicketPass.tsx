"use client";
import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";
import {
  Document,
  Page,
  Text,
  View,
  Image as PdfImage,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { MdDownload } from "react-icons/md";

/**
 * The attendee's event ticket: the ticket number rendered as a QR code the
 * door scanner reads, plus a PDF the attendee can keep on their phone.
 *
 * The QR carries the bare ticket number — the same string the check-in screen
 * accepts when it is typed in, and what `extractTicketNumber` unwraps.
 */

const BRAND_GREEN = "#4a9d2f";
const BRAND_GREEN_DARK = "#2f6b1e";
const TEXT = "#0f172a";
const MUTED = "#64748b";

export interface TicketPassData {
  ticketNumber: string;
  attendeeName: string;
  eventTitle?: string | null;
  eventDate?: string | null;
  venue?: string | null;
  packageName?: string | null;
  bookingReference?: string | null;
}

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

/** 480px wide keeps the QR crisp when the PDF is printed or zoomed. */
const qrDataUrl = (value: string) =>
  QRCodeLib.toDataURL(value, {
    width: 480,
    margin: 1,
    errorCorrectionLevel: "M",
  }).catch(() => "");

const pdfStyles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, color: TEXT, fontFamily: "Helvetica" },
  bar: { height: 6, backgroundColor: BRAND_GREEN, marginBottom: 18 },
  eyebrow: {
    fontSize: 9,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginTop: 4 },
  meta: { fontSize: 10, color: MUTED, marginTop: 2 },
  body: { flexDirection: "row", marginTop: 24, gap: 24 },
  qr: { width: 190, height: 190 },
  fields: { flexGrow: 1, gap: 12 },
  label: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  value: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 2 },
  code: { fontSize: 14, fontFamily: "Courier-Bold", marginTop: 2 },
  note: {
    marginTop: 28,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.5,
  },
});

function TicketPdf({ data, qr }: { data: TicketPassData; qr: string }) {
  const date = fmtDate(data.eventDate);
  return (
    <Document title={`Ticket ${data.ticketNumber}`}>
      <Page size="A5" orientation="landscape" style={pdfStyles.page}>
        <View style={pdfStyles.bar} />
        <Text style={pdfStyles.eyebrow}>Event ticket</Text>
        <Text style={pdfStyles.title}>{data.eventTitle || "NNAK Event"}</Text>
        {(date || data.venue) && (
          <Text style={pdfStyles.meta}>
            {[date, data.venue].filter(Boolean).join("  ·  ")}
          </Text>
        )}

        <View style={pdfStyles.body}>
          {qr ? <PdfImage src={qr} style={pdfStyles.qr} /> : null}
          <View style={pdfStyles.fields}>
            <View>
              <Text style={pdfStyles.label}>Attendee</Text>
              <Text style={pdfStyles.value}>{data.attendeeName}</Text>
            </View>
            <View>
              <Text style={pdfStyles.label}>Ticket number</Text>
              <Text style={pdfStyles.code}>{data.ticketNumber}</Text>
            </View>
            {data.packageName ? (
              <View>
                <Text style={pdfStyles.label}>Package</Text>
                <Text style={pdfStyles.value}>{data.packageName}</Text>
              </View>
            ) : null}
            {data.bookingReference ? (
              <View>
                <Text style={pdfStyles.label}>Booking</Text>
                <Text style={pdfStyles.value}>{data.bookingReference}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={pdfStyles.note}>
          Show this QR code at the entrance to be checked in. One ticket admits
          the named attendee only. nnak.or.ke
        </Text>
      </Page>
    </Document>
  );
}

export async function downloadTicketPdf(data: TicketPassData) {
  const qr = await qrDataUrl(data.ticketNumber);
  const blob = await pdf(<TicketPdf data={data} qr={qr} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ticket-${data.ticketNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface TicketPassProps {
  data: TicketPassData;
  /** Hides the PDF button where the surrounding screen provides its own. */
  showDownload?: boolean;
  className?: string;
}

export default function TicketPass({
  data,
  showDownload = true,
  className = "",
}: TicketPassProps) {
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    qrDataUrl(data.ticketNumber).then((v) => {
      if (alive) setQr(v);
    });
    return () => {
      alive = false;
    };
  }, [data.ticketNumber]);

  const date = fmtDate(data.eventDate);

  const download = async () => {
    setBusy(true);
    try {
      await downloadTicketPdf(data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <div
          className="h-1.5"
          style={{
            background: `linear-gradient(90deg, ${BRAND_GREEN}, ${BRAND_GREEN_DARK})`,
          }}
        />
        <div className="p-4 flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          <div className="w-40 h-40 shrink-0 rounded-lg border border-slate-200 p-2 bg-white flex items-center justify-center">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qr}
                alt={`QR code for ticket ${data.ticketNumber}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 rounded animate-pulse" />
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              {data.eventTitle || "Event ticket"}
            </div>
            <div className="text-lg font-semibold text-slate-900 truncate">
              {data.attendeeName}
            </div>
            {(date || data.venue) && (
              <div className="text-xs text-slate-500 mt-0.5">
                {[date, data.venue].filter(Boolean).join(" · ")}
              </div>
            )}
            <div className="mt-3 font-mono text-sm font-semibold text-slate-900 break-all">
              {data.ticketNumber}
            </div>
            {data.packageName && (
              <div className="text-xs text-slate-500 mt-1">
                {data.packageName}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-3">
              Show this code at the entrance to be checked in.
            </p>
          </div>
        </div>
      </div>

      {showDownload && (
        <button
          type="button"
          onClick={download}
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          <MdDownload className="w-4 h-4" />
          {busy ? "Preparing…" : "Download ticket (PDF)"}
        </button>
      )}
    </div>
  );
}
