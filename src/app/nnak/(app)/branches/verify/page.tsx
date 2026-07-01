"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useResendBranchManagerOtp,
  useVerifyBranchManager,
} from "@/hooks/use-branches";
import PageHeader from "@/components/common/PageHeader";
import { OtpCountdown, OtpInput } from "@/components/common/OtpInput";
import { MdMailOutline, MdSmartphone, MdCheckCircle } from "react-icons/md";

const RESEND_SECONDS = 60;

export default function BranchVerifyManagerPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const pendingTokenParam = sp.get("token") || "";
  const email = sp.get("email") || "";
  const emailOtpHint = sp.get("email_otp") || "";
  const phoneOtpHint = sp.get("phone_otp") || "";

  const [pendingToken, setPendingToken] = useState(pendingTokenParam);
  const [step, setStep] = useState<"email" | "phone">("email");
  const [emailOtp, setEmailOtp] = useState(emailOtpHint);
  const [phoneOtp, setPhoneOtp] = useState(phoneOtpHint);
  const [restartKey, setRestartKey] = useState(0);

  const verify = useVerifyBranchManager();
  const resend = useResendBranchManagerOtp();

  if (!pendingTokenParam) {
    return (
      <div className="px-4 py-4 flex flex-col gap-3">
        <PageHeader title="Missing token" back={() => router.back()} />
        <div className="text-sm text-slate-500">
          No pending verification found. Please create the branch again.
        </div>
      </div>
    );
  }

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOtp.length < 6) return;
    const r = await verify
      .mutateAsync({ pending_token: pendingToken, email_otp: emailOtp })
      .catch(() => null);
    if (r) setStep("phone");
  };

  const submitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneOtp.length < 6) return;
    const r = await verify
      .mutateAsync({ pending_token: pendingToken, phone_otp: phoneOtp })
      .catch(() => null);
    if (r) router.push("/nnak/branches");
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

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Verify Branch Manager"
        description="Confirm both codes to activate the branch"
        back={() => router.back()}
      />

      {/* Step indicators */}
      <div className="flex items-center gap-3 max-w-lg">
        <StepDot num={1} label="Email OTP" active={step === "email"} done={step === "phone"} />
        <div className="flex-1 h-px bg-slate-200" />
        <StepDot num={2} label="Phone OTP" active={step === "phone"} done={false} />
      </div>

      {step === "email" && (
        <form
          onSubmit={submitEmail}
          className="bg-white border border-slate-200 rounded-xl p-6 max-w-lg space-y-5 shadow-sm"
        >
          {email && (
            <div className="text-xs text-slate-500">
              A code was sent to the email of:{" "}
              <span className="font-semibold text-slate-700">{email}</span>
            </div>
          )}

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

          <OtpCountdown
            seconds={RESEND_SECONDS}
            onResend={onResend}
            resendLabel="Resend codes"
            pending={resend.isPending}
            restartKey={restartKey}
          />

          <button
            type="submit"
            disabled={verify.isPending || emailOtp.length < 6}
            className="w-full bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {verify.isPending ? "Verifying…" : "Verify Email Code"}
          </button>
        </form>
      )}

      {step === "phone" && (
        <form
          onSubmit={submitPhone}
          className="bg-white border border-slate-200 rounded-xl p-6 max-w-lg space-y-5 shadow-sm"
        >
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            <MdCheckCircle className="w-4 h-4 shrink-0" />
            Email code verified. Now enter the phone OTP.
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
              autoFocus
              disabled={verify.isPending}
            />
          </div>

          <OtpCountdown
            seconds={RESEND_SECONDS}
            onResend={onResend}
            resendLabel="Resend codes"
            pending={resend.isPending}
            restartKey={restartKey}
          />

          <button
            type="submit"
            disabled={verify.isPending || phoneOtp.length < 6}
            className="w-full bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {verify.isPending ? "Verifying…" : "Verify Phone Code & Activate"}
          </button>
        </form>
      )}
    </div>
  );
}

function StepDot({
  num,
  label,
  active,
  done,
}: {
  num: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
          done
            ? "bg-emerald-500 border-emerald-500 text-white"
            : active
              ? "bg-primary border-primary text-white"
              : "bg-white border-slate-300 text-slate-400"
        }`}
      >
        {done ? <MdCheckCircle className="w-4 h-4" /> : num}
      </div>
      <span className={`text-[10px] font-medium ${active ? "text-primary" : done ? "text-emerald-600" : "text-slate-400"}`}>
        {label}
      </span>
    </div>
  );
}
