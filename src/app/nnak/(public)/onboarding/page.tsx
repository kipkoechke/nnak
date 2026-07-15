"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useOnboardingLookup,
  useOnboardingClaim,
  useOnboardingVerifyClaim,
  useResendOtp,
} from "@/hooks/use-auth";
import {
  useChapters,
  useProfessionalCadres,
  useProfessionalQualifications,
} from "@/hooks/use-enums";
import { claimSchema, type ClaimFormValues } from "@/schemas/auth.schema";
import { InputField } from "@/components/common/InputField";
import { PhoneInputField } from "@/components/common/PhoneInputField";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { DatePicker } from "@/components/common/DatePicker";
import { OtpCountdown, OtpInput } from "@/components/common/OtpInput";
import type { OnboardingLookupResult } from "@/services/auth.service";
import { MdBadge, MdMailOutline } from "react-icons/md";

const DEFAULT_EXPIRES_IN = 900;

const GENDER_OPTS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

const STEPS = [
  { id: 1, label: "Verify ID" },
  { id: 2, label: "Account" },
  { id: 3, label: "Professional" },
  { id: 4, label: "Confirm OTP" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirect = sp.get("redirect") || "/nnak/dashboard";

  const lookup = useOnboardingLookup();
  const claim = useOnboardingClaim();
  const verify = useOnboardingVerifyClaim();
  const resend = useResendOtp();

  const { data: chapters = [] } = useChapters();
  const { data: cadres = [] } = useProfessionalCadres();
  const { data: qualifications = [] } = useProfessionalQualifications();

  const chapterOptions = useMemo(
    () => chapters.map((c) => ({ value: c.value, label: c.label })),
    [chapters],
  );

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [account, setAccount] = useState<OnboardingLookupResult | null>(null);
  const [pendingToken, setPendingToken] = useState("");
  const [otp, setOtp] = useState("");
  const [expiresIn, setExpiresIn] = useState(DEFAULT_EXPIRES_IN);
  const [restartKey, setRestartKey] = useState(0);
  // Guard against OtpInput's onComplete re-firing (a second verify with an
  // already-consumed code 401s and would bounce the just-authenticated user).
  const submittedCode = useRef<string>("");

  const {
    register,
    handleSubmit,
    control,
    trigger,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ClaimFormValues>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      identification_number: "",
      name: "",
      email: "",
      phone: "",
      password: "",
      password_confirmation: "",
      gender: "",
      date_of_birth: "",
      chapter: "",
      professional_qualification: "",
      professional_cadre: "",
      designation: "",
      nck_number: "",
    },
  });

  const step2Fields: (keyof ClaimFormValues)[] = [
    "name",
    "email",
    "phone",
    "password",
    "password_confirmation",
    "gender",
    "date_of_birth",
  ];

  const handleNext = async (
    target: 2 | 3,
    fields: (keyof ClaimFormValues)[],
  ) => {
    const valid = await trigger(fields);
    if (valid) setStep(target);
    else {
      const first = fields.find((f) => errors[f]);
      if (first)
        toast.error(
          (errors[first]?.message as string) ||
            "Please fix the highlighted field",
        );
    }
  };

  // Step 1 — look up the provisional account by ID number.
  const onLookup = async () => {
    const valid = await trigger("identification_number");
    if (!valid) return;
    const idNumber = getValues("identification_number").trim();
    const res = await lookup
      .mutateAsync({ identification_number: idNumber })
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
    if (res.name) setValue("name", res.name);
    if (res.email) setValue("email", res.email);
    if (res.phone) setValue("phone", res.phone);
    if (res.nck_number) setValue("nck_number", res.nck_number);
    setStep(2);
  };

  // Step 3 — submit full details and request an OTP.
  const onClaim = async (values: ClaimFormValues) => {
    const res = await claim
      .mutateAsync({
        ...values,
        identification_number: values.identification_number.trim(),
        phone: values.phone.replace(/^\+/, ""),
      })
      .catch(() => null);
    if (!res?.pending_token) return;
    setPendingToken(res.pending_token);
    setExpiresIn(res.expires_in || DEFAULT_EXPIRES_IN);
    if (res.otp) setOtp(res.otp);
    submittedCode.current = "";
    setStep(4);
  };

  // Step 4 — verify the OTP automatically once 6 digits are entered; on
  // success the session is set by the hook.
  const runVerify = async (code: string) => {
    if (!pendingToken || code.length < 6 || verify.isPending) return;
    if (submittedCode.current === code) return;
    submittedCode.current = code;
    const r = await verify
      .mutateAsync({ pending_token: pendingToken, otp: code.trim() })
      .catch(() => null);
    if (r) router.push(redirect);
    else submittedCode.current = ""; // allow retry after a failed attempt
  };

  const onResendOtp = async () => {
    if (!pendingToken) return;
    const r = await resend
      .mutateAsync({ pending_token: pendingToken })
      .catch(() => null);
    if (r?.pending_token) setPendingToken(r.pending_token);
    if (r?.expires_in) setExpiresIn(r.expires_in);
    submittedCode.current = "";
    setOtp("");
    setRestartKey((k) => k + 1);
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
          Please fill in the required details to activate your account.
        </p>
      </div>

      {/* Step indicator */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex-1 h-1 rounded-full ${
                step >= s.id ? "bg-primary" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs">
          {STEPS.map((s) => (
            <span
              key={s.id}
              className={
                step === s.id
                  ? "text-primary font-semibold"
                  : step > s.id
                    ? "text-slate-700"
                    : "text-slate-400"
              }
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Step 1 — Verify ID */}
      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLookup();
          }}
          className="space-y-4"
        >
          <InputField
            label="ID / National ID Number"
            type="text"
            placeholder="Enter your ID number"
            register={register("identification_number")}
            error={errors.identification_number?.message}
            required
          />
          <button
            type="submit"
            disabled={lookup.isPending}
            className="w-full bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
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

      {/* Step 2 — Account */}
      {step === 2 && (
        <div className="space-y-4">
          {account?.membership_number && (
            <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md px-3 py-2">
              Match found · Membership {account.membership_number}
            </div>
          )}
          <InputField
            label="Full Name"
            type="text"
            placeholder="e.g. Jane Achieng Omondi"
            register={register("name")}
            error={errors.name?.message}
            required
          />
          <InputField
            label="Email"
            type="email"
            placeholder="e.g. jane.omondi@example.com"
            register={register("email")}
            error={errors.email?.message}
            required
          />
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <PhoneInputField
                label="Phone"
                required
                value={field.value}
                onChange={field.onChange}
                defaultCountry="KE"
                error={errors.phone?.message}
              />
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="date_of_birth"
              render={({ field }) => (
                <DatePicker
                  label="Date of Birth"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  maxDate={new Date()}
                  error={errors.date_of_birth?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <SearchableSelect
                  label="Gender"
                  required
                  options={GENDER_OPTS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select gender"
                  error={errors.gender?.message}
                />
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              register={register("password")}
              error={errors.password?.message}
              required
            />
            <InputField
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              register={register("password_confirmation")}
              error={errors.password_confirmation?.message}
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 border border-slate-300 text-slate-700 px-4 py-3 rounded-lg text-sm font-semibold hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => handleNext(3, step2Fields)}
              className="flex-1 bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Professional */}
      {step === 3 && (
        <form onSubmit={handleSubmit(onClaim)} className="space-y-4">
          <InputField
            label="NCK Registration Number"
            type="text"
            placeholder="e.g. NCK/2024/98765"
            register={register("nck_number")}
            error={errors.nck_number?.message}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="professional_qualification"
              render={({ field }) => (
                <SearchableSelect
                  label="Highest Professional Qualification"
                  required
                  options={qualifications}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select qualification"
                  error={errors.professional_qualification?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="professional_cadre"
              render={({ field }) => (
                <SearchableSelect
                  label="Professional Cadre"
                  required
                  options={cadres}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select cadre"
                  error={errors.professional_cadre?.message}
                />
              )}
            />
          </div>
          <Controller
            control={control}
            name="chapter"
            render={({ field }) => (
              <SearchableSelect
                label="Chapter of Interest"
                required
                options={chapterOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select chapter"
                searchPlaceholder="Search chapters…"
                error={errors.chapter?.message}
              />
            )}
          />
          <InputField
            label="Designation"
            type="text"
            placeholder="e.g. Registered Nurse"
            register={register("designation")}
            error={errors.designation?.message}
            required
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 border border-slate-300 text-slate-700 px-4 py-3 rounded-lg text-sm font-semibold hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={claim.isPending}
              className="flex-1 bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {claim.isPending ? "Submitting…" : "Send code"}
            </button>
          </div>
        </form>
      )}

      {/* Step 4 — Confirm OTP */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <MdMailOutline className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Verify your account
            </h3>
            <p className="text-xs text-slate-500">
              Enter the 6-digit code we sent
              {getValues("email") ? (
                <>
                  {" "}
                  to{" "}
                  <span className="font-semibold text-slate-700">
                    {getValues("email")}
                  </span>
                </>
              ) : (
                " to your email"
              )}
              . Your account activates automatically once it&apos;s correct.
            </p>
          </div>

          <OtpInput
            value={otp}
            onChange={setOtp}
            length={6}
            autoFocus
            disabled={verify.isPending}
            onComplete={runVerify}
          />

          <OtpCountdown
            seconds={expiresIn}
            onResend={onResendOtp}
            pending={resend.isPending}
            restartKey={restartKey}
          />

          <button
            type="button"
            onClick={() => runVerify(otp)}
            disabled={verify.isPending || otp.length < 6}
            className="w-full bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verify.isPending ? "Verifying…" : "Activate account"}
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            className="w-full text-xs text-slate-500 hover:underline"
          >
            Back to details
          </button>
        </div>
      )}
    </div>
  );
}
