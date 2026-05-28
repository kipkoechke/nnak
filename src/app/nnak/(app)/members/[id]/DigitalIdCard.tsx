"use client";
import { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { MdPerson } from "react-icons/md";
import { logoSrc } from "@/utils/logo";
import type { NnakProfile, NnakUser } from "@/types/nnak";

interface Props {
  member: NnakUser & { profile: NnakProfile };
  category?: string;
}

export default function DigitalIdCard({ member, category }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const photo = member.profile.photo_url;

  const downloadPdf = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: "#f1f5f9" });
    const img = canvas.toDataURL("image/png");
    // A6 landscape page (148 x 105 mm) with the card centred and a
    // comfortable margin around it instead of bleeding edge-to-edge.
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a6" });
    const pageW = 148;
    const pageH = 105;
    const cardW = 100; // mm
    const cardH = cardW * (216 / 344); // preserve 344x216 aspect
    const x = (pageW - cardW) / 2;
    const y = (pageH - cardH) / 2;
    pdf.addImage(img, "PNG", x, y, cardW, cardH);
    pdf.save(`NNAK-${member.profile.account_number}.pdf`);
  };

  const validUntil = member.profile.subscription_expires_at
    ? new Date(member.profile.subscription_expires_at).toLocaleDateString()
    : "—";

  const BRAND_GREEN = "#80cc28";
  const BRAND_GREEN_DARK = "#5fa01d";
  const ACCENT_GOLD = "#d8913f";
  const TEXT = "#0f172a";
  const MUTED = "#475569";

  return (
    <div className="space-y-2">
      <div
        ref={ref}
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
        {/* Top brand bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: `linear-gradient(90deg, ${BRAND_GREEN} 0%, ${BRAND_GREEN_DARK} 70%, ${ACCENT_GOLD} 100%)`,
          }}
        />

        {/* Decorative corner curve */}
        <div
          style={{
            position: "absolute",
            right: -40,
            bottom: -40,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: `radial-gradient(circle at 30% 30%, ${BRAND_GREEN}1a, transparent 70%)`,
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", padding: "14px 16px 0 16px", height: "100%" }}>
          {/* Header row — logo bounded inside a fixed box so a wide/tall
              source PNG can't overflow into the body row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 52 }}>
            <div
              style={{
                width: 170,
                height: 48,
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt="NNAK"
                crossOrigin="anonymous"
                style={{ maxHeight: 48, maxWidth: 170, height: "auto", width: "auto", objectFit: "contain", display: "block" }}
              />
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: BRAND_GREEN,
                color: "white",
                padding: "3px 10px",
                borderRadius: 999,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                flexShrink: 0,
              }}
            >
              {category || "Member"}
            </div>
          </div>

          {/* Body: photo + member info — extra top padding ensures the
              name's ascenders aren't clipped by the header band */}
          <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 10,
                background: "#f1f5f9",
                border: `2px solid ${BRAND_GREEN}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt={member.name}
                  crossOrigin="anonymous"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <MdPerson style={{ width: 40, height: 40, color: "#94a3b8" }} />
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1, paddingTop: 2 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: TEXT,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {member.name}
              </div>
              <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 5 }}>
                Member ID
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: TEXT, letterSpacing: 0.3 }}>
                {member.profile.account_number}
              </div>
              <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 3 }}>
                NCK Number
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: TEXT, letterSpacing: 0.3 }}>
                {member.profile.nck_number || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer band */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 26,
            background: BRAND_GREEN_DARK,
            color: "white",
            padding: "0 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 10,
            letterSpacing: 0.4,
          }}
        >
          <span style={{ fontWeight: 600 }}>Valid until {validUntil}</span>
          <span style={{ opacity: 0.9 }}>nnak.or.ke</span>
        </div>
      </div>
      <button onClick={downloadPdf} className="w-full bg-primary text-white text-xs px-3 py-1.5 rounded">
        Download Digital ID (PDF)
      </button>
    </div>
  );
}
