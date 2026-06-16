"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useResendOtp, useVerifyOtp } from "@/hooks/use-auth";
import { OtpCountdown, OtpInput } from "@/components/common/OtpInput";
import { MdMailOutline } from "react-icons/md";

const RESEND_SECONDS = 60;

export default function VerifyOtpPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const pendingTokenParam = sp.get("token") || "";
  const email = sp.get("email") || "";
  const hint = sp.get("hint") || "";
  const redirect = sp.get("redirect") || "/nnak/dashboard";

  const [pendingToken, setPendingToken] = useState(pendingTokenParam);
  const [otp, setOtp] = useState(hint);
  const [restartKey, setRestartKey] = useState(0);
  const verify = useVerifyOtp();
  const resend = useResendOtp();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingToken || otp.length < 6) return;
    const r = await verify
      .mutateAsync({ pending_token: pendingToken, otp })
      .catch(() => null);
    if (r) router.push(redirect);
  };

  const onResend = async () => {
    if (!pendingToken) return;
    const r = await resend
      .mutateAsync({ pending_token: pendingToken })
      .catch(() => null);
    if (r?.pending_token) setPendingToken(r.pending_token);
    setOtp("");
    setRestartKey((k) => k + 1);
  };

  if (!pendingTokenParam) {
    return (
      <div className="space-y-3 text-sm">
        <h2 className="text-lg font-semibold text-slate-900">Missing token</h2>
        <p className="text-slate-600">
          Please{" "}
          <Link className="text-primary hover:underline" href="/nnak/login">
            sign in again
          </Link>{" "}
          to receive a new code.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <MdMailOutline className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          Verify your account
        </h2>
        <p className="text-xs text-slate-500">
          Enter the 6-digit code we sent
          {email ? (
            <>
              {" "}
              to <span className="font-semibold text-slate-700">{email}</span>
            </>
          ) : (
            " to your email"
          )}
          .
        </p>
      </div>

      <OtpInput
        value={otp}
        onChange={setOtp}
        length={6}
        autoFocus
        disabled={verify.isPending}
      />

      <OtpCountdown
        seconds={RESEND_SECONDS}
        onResend={onResend}
        pending={resend.isPending}
        restartKey={restartKey}
      />

      {hint && (
        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Dev OTP echo: <span className="font-mono">{hint}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={verify.isPending || otp.length < 6}
        className="w-full bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {verify.isPending ? "Verifying…" : "Verify & continue"}
      </button>

      <div className="text-xs text-center text-slate-600">
        <Link href="/nnak/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
