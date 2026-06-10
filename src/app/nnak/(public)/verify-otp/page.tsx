"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useVerifyOtp } from "@/hooks/use-auth";

export default function VerifyOtpPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const pendingToken = sp.get("token") || "";
  const email = sp.get("email") || "";
  const hint = sp.get("hint") || "";
  const redirect = sp.get("redirect") || "/nnak/dashboard";
  const [otp, setOtp] = useState(hint);
  const m = useVerifyOtp();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingToken) return;
    const r = await m
      .mutateAsync({ pending_token: pendingToken, otp })
      .catch(() => null);
    if (r) router.push(redirect);
  };

  if (!pendingToken) {
    return (
      <div className="space-y-3 text-sm">
        <h2 className="text-lg font-semibold text-slate-900">Missing token</h2>
        <p className="text-slate-600">
          Please <Link className="text-primary hover:underline" href="/nnak/login">sign in again</Link> to receive a new OTP.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Verify your OTP</h2>
      <p className="text-xs text-slate-500">
        Enter the 6-digit code sent {email ? <>to <b>{email}</b></> : "to your email"}.
      </p>
      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        maxLength={6}
        required
        placeholder="123456"
        inputMode="numeric"
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-center text-lg tracking-widest"
      />
      {hint && (
        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          Dev OTP echo: <span className="font-mono">{hint}</span>
        </div>
      )}
      <button
        type="submit"
        disabled={m.isPending}
        className="w-full bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {m.isPending ? "Verifying..." : "Verify & sign in"}
      </button>
      <div className="text-xs text-center text-slate-600">
        <Link href="/nnak/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
