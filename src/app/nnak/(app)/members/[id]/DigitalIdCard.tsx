"use client";
import { useState } from "react";
import { MdPerson } from "react-icons/md";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { logoSrc } from "@/utils/logo";
import type { NnakProfile, NnakUser } from "@/types/nnak";

interface Props {
  member: NnakUser & { profile: NnakProfile };
  category?: string;
  /** Hide the download button when the host page renders its own CTA. */
  showDownload?: boolean;
}

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "M";
};

const BRAND_GREEN = "#80cc28";
const BRAND_GREEN_DARK = "#5fa01d";
const ACCENT_GOLD = "#d8913f";
const TEXT = "#0f172a";
const MUTED = "#475569";
const SURFACE = "#f1f5f9";

// PDF stylesheet — react-pdf uses a Yoga (flexbox) layout engine and
// produces a true vector PDF, so text is never rasterised and can't
// be clipped the way html2canvas was clipping it.
const pdfStyles = StyleSheet.create({
  page: {
    backgroundColor: SURFACE,
    padding: 24,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 360, // pt
    height: 226, // ~1.59 aspect, real ID-card ratio
    backgroundColor: "#ffffff",
    borderRadius: 12,
    position: "relative",
    overflow: "hidden",
    border: "1pt solid #e2e8f0",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: BRAND_GREEN,
  },
  // The brand bar is a 3-stop gradient in the HTML version — react-pdf
  // doesn't support CSS gradients, so we layer three coloured strips.
  topBarMid: {
    position: "absolute",
    top: 0,
    left: "60%",
    right: 0,
    height: 6,
    backgroundColor: BRAND_GREEN_DARK,
  },
  topBarEnd: {
    position: "absolute",
    top: 0,
    left: "90%",
    right: 0,
    height: 6,
    backgroundColor: ACCENT_GOLD,
  },
  logo: {
    position: "absolute",
    top: 18,
    left: 18,
    width: 175,
    height: 56,
    objectFit: "contain",
  },
  photo: {
    position: "absolute",
    top: 94,
    left: 18,
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: SURFACE,
    border: `2pt solid ${BRAND_GREEN}`,
    objectFit: "cover",
  },
  photoFallback: {
    position: "absolute",
    top: 94,
    left: 18,
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: SURFACE,
    border: `2pt solid ${BRAND_GREEN}`,
    alignItems: "center",
    justifyContent: "center",
  },
  // Initials avoid the missing-glyph "=d" problem react-pdf's default
  // font has with emoji codepoints.
  photoFallbackGlyph: { fontSize: 30, fontWeight: 700, color: BRAND_GREEN_DARK, letterSpacing: 1 },
  info: {
    position: "absolute",
    top: 94,
    left: 106,
    right: 18,
  },
  name: {
    fontSize: 16,
    fontWeight: 700,
    color: TEXT,
    marginBottom: 8,
  },
  label: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  value: {
    fontSize: 12,
    fontWeight: 700,
    color: TEXT,
    letterSpacing: 0.4,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 26,
    backgroundColor: BRAND_GREEN_DARK,
    color: "white",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 18,
  },
  footerLeft: { fontSize: 9, fontWeight: 700, color: "white" },
  footerRight: { fontSize: 9, color: "white", opacity: 0.85 },
});

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function DigitalIdPdf({ member }: Props) {
  const valid = fmtDate(member.profile.subscription_expires_at);
  // react-pdf renders relative URLs against the runtime origin — convert
  // logoSrc (e.g. "/assets/nnak_logo.png") into an absolute URL.
  const logoUrl =
    typeof window !== "undefined" && logoSrc.startsWith("/")
      ? new URL(logoSrc, window.location.origin).toString()
      : logoSrc;
  const photoUrl = member.profile.photo_url;

  return (
    <Document title={`NNAK Digital ID — ${member.name}`} author="NNAK">
      <Page size="A6" orientation="landscape" style={pdfStyles.page}>
        <View style={pdfStyles.card}>
          <View style={pdfStyles.topBar} />
          <View style={pdfStyles.topBarMid} />
          <View style={pdfStyles.topBarEnd} />

          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logoUrl} style={pdfStyles.logo} />

          {photoUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={photoUrl} style={pdfStyles.photo} />
          ) : (
            <View style={pdfStyles.photoFallback}>
              <Text style={pdfStyles.photoFallbackGlyph}>{initialsOf(member.name)}</Text>
            </View>
          )}

          <View style={pdfStyles.info}>
            <Text style={pdfStyles.name}>{member.name}</Text>
            <Text style={pdfStyles.label}>Member ID</Text>
            <Text style={pdfStyles.value}>{member.profile.account_number}</Text>
            <Text style={pdfStyles.label}>Licence Number</Text>
            <Text style={pdfStyles.value}>{member.profile.license_number || "—"}</Text>
          </View>

          <View style={pdfStyles.footer}>
            <Text style={pdfStyles.footerLeft}>Valid until {valid}</Text>
            <Text style={pdfStyles.footerRight}>nnak.or.ke</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default function DigitalIdCard({ member, showDownload = true }: Props) {
  const [downloading, setDownloading] = useState(false);
  const photo = member.profile.photo_url;
  const validUntil = fmtDate(member.profile.subscription_expires_at);

  const downloadPdf = async () => {
    try {
      setDownloading(true);
      const blob = await pdf(<DigitalIdPdf member={member} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `NNAK-${member.profile.account_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setDownloading(false);
    }
  };

  // ───── On-screen preview (HTML, mirrors the PDF layout) ─────
  return (
    <div className="space-y-2">
      <div
        style={{
          width: 344,
          height: 216,
          background: "#ffffff",
          color: TEXT,
          borderRadius: 12,
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,.08), 0 0 0 1px rgba(15,23,42,.06)",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6,
          background: `linear-gradient(90deg, ${BRAND_GREEN} 0%, ${BRAND_GREEN_DARK} 70%, ${ACCENT_GOLD} 100%)` }} />
        <div style={{ position: "absolute", right: -40, bottom: -40, width: 160, height: 160, borderRadius: "50%",
          background: `radial-gradient(circle at 30% 30%, ${BRAND_GREEN}1a, transparent 70%)` }} />

        <div style={{ position: "absolute", top: 16, left: 16, right: 16, height: 56, overflow: "hidden", display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="NNAK" style={{ maxHeight: 56, maxWidth: "100%", height: "auto", width: "auto", objectFit: "contain", display: "block" }} />
        </div>

        <div style={{ position: "absolute", top: 92, left: 16, width: 72, height: 72, borderRadius: 10, background: SURFACE, border: `2px solid ${BRAND_GREEN}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 24, fontWeight: 700, color: BRAND_GREEN_DARK, letterSpacing: 1 }}>
              {initialsOf(member.name)}
            </span>
          )}
        </div>

        <div style={{ position: "absolute", top: 92, left: 100, right: 16, lineHeight: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.25, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 6 }}>
            {member.name}
          </div>
          <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, lineHeight: 1.4 }}>Member ID</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, letterSpacing: 0.4, lineHeight: 1.2 }}>{member.profile.account_number}</div>
          <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, lineHeight: 1.4, marginTop: 4 }}>Licence Number</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, letterSpacing: 0.4, lineHeight: 1.2 }}>{member.profile.license_number || "—"}</div>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 26, background: BRAND_GREEN_DARK, color: "white", padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, letterSpacing: 0.4 }}>
          <span style={{ fontWeight: 600 }}>Valid until {validUntil}</span>
          <span style={{ opacity: 0.9 }}>nnak.or.ke</span>
        </div>
      </div>
      {showDownload && (
        <button
          onClick={downloadPdf}
          disabled={downloading}
          className="w-full bg-primary text-white text-xs px-3 py-1.5 rounded disabled:opacity-50"
        >
          {downloading ? "Preparing…" : "Download Digital ID (PDF)"}
        </button>
      )}
    </div>
  );
}

/** Expose the download trigger so host pages (e.g. /me/membership) can
 *  render their own button. */
export async function downloadDigitalIdPdf(
  member: NnakUser & { profile: NnakProfile },
) {
  const blob = await pdf(<DigitalIdPdf member={member} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `NNAK-${member.profile.account_number}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
