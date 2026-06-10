"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useVerifyBranchMember } from "@/hooks/use-branch-manager";
import PageHeader from "@/components/common/PageHeader";

export default function BranchVerifyMemberPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const pendingToken = sp.get("token") || "";
  const email = sp.get("email") || "";
  const emailOtpHint = sp.get("email_otp") || "";
  const phoneOtpHint = sp.get("phone_otp") || "";

  const [emailOtp, setEmailOtp] = useState(emailOtpHint);
  const [phoneOtp, setPhoneOtp] = useState(phoneOtpHint);
  const verify = useVerifyBranchMember();

  if (!pendingToken) {
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
    const r = await verify.mutateAsync({
      pending_token: pendingToken,
      email_otp: emailOtp,
      phone_otp: phoneOtp,
    }).catch(() => null);
    if (r) router.push("/nnak/members");
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="Verify Member" description="Confirm OTPs to activate the account" back={() => router.back()} />

      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-6 max-w-md space-y-4">
        {email && (
          <p className="text-xs text-slate-500">
            Verifying member: <span className="font-semibold">{email}</span>
          </p>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Email OTP</label>
          <input
            value={emailOtp}
            onChange={(e) => setEmailOtp(e.target.value)}
            required
            maxLength={6}
            placeholder="Email OTP"
            inputMode="numeric"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-center text-lg tracking-widest"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Phone OTP</label>
          <input
            value={phoneOtp}
            onChange={(e) => setPhoneOtp(e.target.value)}
            required
            maxLength={6}
            placeholder="Phone OTP"
            inputMode="numeric"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-center text-lg tracking-widest"
          />
        </div>

        {(emailOtpHint || phoneOtpHint) && (
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Dev OTP hints — Email: <span className="font-mono">{emailOtpHint}</span>, Phone: <span className="font-mono">{phoneOtpHint}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={verify.isPending}
          className="w-full bg-primary text-white px-4 py-3 rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
        >
          {verify.isPending ? "Verifying..." : "Verify & Activate Member"}
        </button>
      </form>
    </div>
  );
}
