"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  useOnboardingLookup,
  useOnboardingClaim,
  useOnboardingVerifyClaim,
} from "@/hooks/use-auth";
import {
  useChapters,
  useProfessionalCadres,
  useProfessionalQualifications,
  useGenders,
} from "@/hooks/use-enums";
import type { OnboardingLookupResult } from "@/services/auth.service";
import { MdBadge, MdCheckCircle } from "react-icons/md";

const inputCls =
  "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary";

const Labelled = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

export default function OnboardingPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirect = sp.get("redirect") || "/nnak/dashboard";

  const lookup = useOnboardingLookup();
  const claim = useOnboardingClaim();
  const verify = useOnboardingVerifyClaim();

  const { data: chapters = [] } = useChapters();
  const { data: cadres = [] } = useProfessionalCadres();
  const { data: qualifications = [] } = useProfessionalQualifications();
  const { data: genders = [] } = useGenders();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [idNumber, setIdNumber] = useState("");
  const [account, setAccount] = useState<OnboardingLookupResult | null>(null);
  const [pendingToken, setPendingToken] = useState("");
  const [otp, setOtp] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    chapter: "",
    professional_qualification: "",
    professional_cadre: "",
    gender: "",
    date_of_birth: "",
    designation: "",
    institution: "",
    nck_number: "",
  });
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Step 1 — look up the provisional account by ID number.
  const onLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await lookup
      .mutateAsync({ identification_number: idNumber.trim() })
      .catch(() => null);
    if (!res) return;
    if (res.found === false || res.claimed) {
      toast.error(
        res.claimed
          ? "This account has already been claimed. Please sign in."
          : "No matching account found for that ID number.",
      );
      return;
    }
    setAccount(res);
    // Prefill anything the backend safely returns.
    setForm((f) => ({
      ...f,
      name: res.name ?? f.name,
      email: res.email ?? f.email,
      phone: res.phone ?? f.phone,
      nck_number: res.nck_number ?? f.nck_number,
    }));
    setStep(2);
  };

  // Step 2 — submit full details and request an OTP.
  const onClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await claim
      .mutateAsync({ identification_number: idNumber.trim(), ...form })
      .catch(() => null);
    if (!res?.pending_token) return;
    setPendingToken(res.pending_token);
    if (res.otp) setOtp(res.otp);
    setStep(3);
  };

  // Step 3 — verify the OTP; on success the session is set by the hook.
  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await verify
      .mutateAsync({ pending_token: pendingToken, otp: otp.trim() })
      .catch(() => null);
    if (r) router.push(redirect);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-primary">
          <MdBadge className="w-5 h-5" />
          <h2 className="text-lg font-semibold text-slate-900">
            Claim your account
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          If your record was migrated by NNAK, confirm your ID to activate your
          online account.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-[11px] font-medium">
        {["Verify ID", "Your details", "Confirm OTP"].map((s, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const done = step > n;
          const active = step === n;
          return (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                  active
                    ? "bg-primary/10 text-primary"
                    : done
                      ? "text-emerald-700"
                      : "text-slate-400"
                }`}
              >
                {done ? <MdCheckCircle className="w-3.5 h-3.5" /> : `${n}.`} {s}
              </span>
              {n < 3 && <span className="text-slate-300">→</span>}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <form onSubmit={onLookup} className="space-y-4">
          <Labelled label="ID / National ID number" required>
            <input
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              required
              autoFocus
              placeholder="Enter your ID number"
              className={inputCls}
            />
          </Labelled>
          <button
            type="submit"
            disabled={lookup.isPending || !idNumber.trim()}
            className="w-full bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {lookup.isPending ? "Checking…" : "Continue"}
          </button>
          <div className="text-xs text-slate-600 text-center">
            Already have an account?{" "}
            <Link href="/nnak/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={onClaim} className="space-y-4">
          {account?.membership_number && (
            <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md px-3 py-2">
              Match found · Membership {account.membership_number}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Labelled label="Full name" required>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                className={inputCls}
              />
            </Labelled>
            <Labelled label="Email" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                className={inputCls}
              />
            </Labelled>
            <Labelled label="Phone" required>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
                className={inputCls}
              />
            </Labelled>
            <Labelled label="Password" required>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                minLength={8}
                className={inputCls}
              />
            </Labelled>
            <Labelled label="Gender" required>
              <select
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                required
                className={inputCls}
              >
                <option value="">Select…</option>
                {genders.map((g) => (
                  <option key={g} value={g}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </option>
                ))}
              </select>
            </Labelled>
            <Labelled label="Date of birth" required>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => set("date_of_birth", e.target.value)}
                required
                className={inputCls}
              />
            </Labelled>
            <Labelled label="Chapter of Interest" required>
              <select
                value={form.chapter}
                onChange={(e) => set("chapter", e.target.value)}
                required
                className={inputCls}
              >
                <option value="">Select…</option>
                {chapters.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Labelled>
            <Labelled label="Professional qualification" required>
              <select
                value={form.professional_qualification}
                onChange={(e) =>
                  set("professional_qualification", e.target.value)
                }
                required
                className={inputCls}
              >
                <option value="">Select…</option>
                {qualifications.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </Labelled>
            <Labelled label="Professional cadre" required>
              <select
                value={form.professional_cadre}
                onChange={(e) => set("professional_cadre", e.target.value)}
                required
                className={inputCls}
              >
                <option value="">Select…</option>
                {cadres.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Labelled>
            <Labelled label="Designation" required>
              <input
                value={form.designation}
                onChange={(e) => set("designation", e.target.value)}
                required
                className={inputCls}
              />
            </Labelled>
            <Labelled label="Institution" required>
              <input
                value={form.institution}
                onChange={(e) => set("institution", e.target.value)}
                required
                className={inputCls}
              />
            </Labelled>
            <Labelled label="NCK number" required>
              <input
                value={form.nck_number}
                onChange={(e) => set("nck_number", e.target.value)}
                required
                className={inputCls}
              />
            </Labelled>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={claim.isPending}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {claim.isPending ? "Submitting…" : "Send code"}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={onVerify} className="space-y-4">
          <p className="text-sm text-slate-600">
            We sent a verification code to{" "}
            <span className="font-medium text-slate-900">{form.email}</span>.
            Enter it below to finish claiming your account.
          </p>
          <Labelled label="Verification code" required>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              autoFocus
              placeholder="Enter the code"
              className={`${inputCls} font-mono tracking-widest`}
            />
          </Labelled>
          <button
            type="submit"
            disabled={verify.isPending || !otp.trim()}
            className="w-full bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {verify.isPending ? "Verifying…" : "Activate account"}
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full text-xs text-slate-500 hover:underline"
          >
            Back to details
          </button>
        </form>
      )}
    </div>
  );
}
