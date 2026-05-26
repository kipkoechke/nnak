"use client";
import { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { NnakProfile, NnakUser } from "@/types/nnak";

interface Props {
  member: NnakUser & { profile: NnakProfile };
  category?: string;
}

export default function DigitalIdCard({ member, category }: Props) {
  const ref = useRef<HTMLDivElement>(null);

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
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>NATIONAL NURSES</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>ASSOCIATION OF KENYA</div>
          </div>
          <div style={{ fontSize: 10, background: "rgba(255,255,255,.18)", padding: "2px 6px", borderRadius: 4 }}>
            {category || "Member"}
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{member.name}</div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>
            ID: {member.profile.account_number}
          </div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>
            NCK: {member.profile.nck_number || "—"}
          </div>
        </div>
        <div style={{ position: "relative", marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "end" }}>
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
