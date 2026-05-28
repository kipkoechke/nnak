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
    const canvas = await html2canvas(ref.current, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [86, 54] });
    pdf.addImage(img, "PNG", 0, 0, 86, 54);
    pdf.save(`NNAK-${member.profile.account_number}.pdf`);
  };

  const validUntil = member.profile.subscription_expires_at
    ? new Date(member.profile.subscription_expires_at).toLocaleDateString()
    : "—";

  return (
    <div className="space-y-2">
      <div
        ref={ref}
        style={{
          width: 344,
          height: 216,
          background: "linear-gradient(135deg,#0f3460,#1e6091)",
          color: "white",
          borderRadius: 12,
          padding: 16,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Header: logo on a white plate so the crest + tagline stay legible
            against the dark gradient + category chip */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              background: "white",
              borderRadius: 8,
              padding: "4px 8px",
              display: "inline-flex",
              alignItems: "center",
              boxShadow: "0 1px 2px rgba(0,0,0,.15)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="NNAK"
              crossOrigin="anonymous"
              style={{ height: 32, width: "auto", objectFit: "contain", display: "block" }}
            />
          </div>
          <div
            style={{
              fontSize: 10,
              background: "rgba(255,255,255,.18)",
              padding: "2px 6px",
              borderRadius: 4,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {category || "Member"}
          </div>
        </div>

        {/* Body: photo + member info */}
        <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 8,
              background: "rgba(255,255,255,.12)",
              border: "1.5px solid rgba(255,255,255,.35)",
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
              <MdPerson style={{ width: 36, height: 36, opacity: 0.7 }} />
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                lineHeight: 1.15,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {member.name}
            </div>
            <div style={{ fontSize: 11, opacity: 0.9, marginTop: 4 }}>
              Member ID: {member.profile.account_number}
            </div>
            <div style={{ fontSize: 11, opacity: 0.9 }}>
              NCK: {member.profile.nck_number || "—"}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
          }}
        >
          <div style={{ fontSize: 10, opacity: 0.8 }}>Valid until {validUntil}</div>
          <div style={{ fontSize: 9, opacity: 0.7 }}>nnak.or.ke</div>
        </div>
      </div>
      <button onClick={downloadPdf} className="w-full bg-primary text-white text-xs px-3 py-1.5 rounded">
        Download Digital ID (PDF)
      </button>
    </div>
  );
}
