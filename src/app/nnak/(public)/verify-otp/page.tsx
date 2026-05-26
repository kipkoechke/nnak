"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useVerifyOtp } from "@/hooks/nnak/use-auth";

export default function VerifyOtpPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const email = sp.get("email") || "";
  const redirect = sp.get("redirect") || "/nnak/dashboard";
  const [otp, setOtp] = useState("");
  const m = useVerifyOtp();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await m.mutateAsync({ email, otp }).catch(() => null);
    if (r) router.push(redirect);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Verify your email</h2>
      <p className="text-xs text-slate-500">Enter the 6-digit OTP sent to <b>{email}</b></p>
      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        maxLength={6}
        required
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-center text-lg tracking-widest"
      />
      <button
        type="submit"
        disabled={m.isPending}
        className="w-full bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {m.isPending ? "Verifying..." : "Verify"}
      </button>
    </form>
  );
}
