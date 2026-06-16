"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useResendBranchMemberOtp,
  useVerifyBranchMember,
} from "@/hooks/use-branch-manager";
import PageHeader from "@/components/common/PageHeader";
import { OtpCountdown, OtpInput } from "@/components/common/OtpInput";
import { MdMailOutline, MdSmartphone } from "react-icons/md";

const RESEND_SECONDS = 60;

export default function BranchVerifyMemberPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const pendingTokenParam = sp.get("token") || "";
  const email = sp.get("email") || "";
  const emailOtpHint = sp.get("email_otp") || "";
  const phoneOtpHint = sp.get("phone_otp") || "";

  const [pendingToken, setPendingToken] = useState(pendingTokenParam);
  const [emailOtp, setEmailOtp] = useState(emailOtpHint);
  const [phoneOtp, setPhoneOtp] = useState(phoneOtpHint);
  const [restartKey, setRestartKey] = useState(0);
  const verify = useVerifyBranchMember();
  const resend = useResendBranchMemberOtp();

  if (!pendingTokenParam) {
    return (
      <div className="px-4 py-4 flex flex-col gap-3">
        <PageHeader title="Missing token" back={() => router.back()} />
        <div className="text-sm text-slate-500">
          No pending verification found. Please create the member again.
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOtp.length < 6 || phoneOtp.length < 6) return;
    const r = await verify
      .mutateAsync({
        pending_token: pendingToken,
        email_otp: emailOtp,
        phone_otp: phoneOtp,
      })
      .catch(() => null);
    if (r) router.push("/nnak/members");
  };

  const onResend = async () => {
    const r = await resend
      .mutateAsync({ pending_token: pendingToken })
      .catch(() => null);
    if (r?.pending_token) setPendingToken(r.pending_token);
    setEmailOtp("");
    setPhoneOtp("");
    setRestartKey((k) => k + 1);
  };

  const canSubmit = emailOtp.length === 6 && phoneOtp.length === 6;

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Verify Member"
        description="Confirm both codes to activate the account"
        back={() => router.back()}
      />

      <form
        onSubmit={submit}
        className="bg-white border border-slate-200 rounded-xl p-6 max-w-lg space-y-5 shadow-sm"
      >
        {email && (
          <div className="text-xs text-slate-500">
            Activating member:{" "}
            <span className="font-semibold text-slate-700">{email}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2">
              <MdMailOutline className="w-4 h-4 text-primary" />
              Email OTP
            </div>
            <OtpInput
              value={emailOtp}
              onChange={setEmailOtp}
              length={6}
              autoFocus
              disabled={verify.isPending}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2">
              <MdSmartphone className="w-4 h-4 text-primary" />
              Phone OTP
            </div>
            <OtpInput
              value={phoneOtp}
              onChange={setPhoneOtp}
              length={6}
              autoFocus={false}
              disabled={verify.isPending}
            />
          </div>
        </div>

        <OtpCountdown
          seconds={RESEND_SECONDS}
          onResend={onResend}
          resendLabel="Resend both codes"
          pending={resend.isPending}
          restartKey={restartKey}
        />

        {(emailOtpHint || phoneOtpHint) && (
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Dev OTP hints — Email:{" "}
            <span className="font-mono">{emailOtpHint || "—"}</span>, Phone:{" "}
            <span className="font-mono">{phoneOtpHint || "—"}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={verify.isPending || !canSubmit}
          className="w-full bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {verify.isPending ? "Verifying…" : "Verify & Activate Member"}
        </button>
      </form>
    </div>
  );
}
