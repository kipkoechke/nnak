"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useOnboardingLookup,
  useOnboardingClaim,
  useOnboardingVerifyClaim,
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
import type { OnboardingLookupResult } from "@/services/auth.service";
import { MdBadge, MdCheckCircle } from "react-icons/md";

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

// A controlled text field styled to match the RHF-bound InputField, for the
// two fields outside the react-hook-form (ID lookup and OTP).
const PlainField = ({
  label,
  value,
  onChange,
  placeholder,
  required,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  mono?: boolean;
}) => (
  <div>
    <label className="text-gray-700 mb-2 flex text-xs sm:text-sm font-semibold">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`border-gray-300 focus:border-primary text-gray-900 focus:ring-primary hover:border-gray-400 w-full rounded-lg placeholder:text-gray-500 border px-4 py-3 text-sm transition-all duration-300 focus:ring-1 focus:outline-none ${
        mono ? "font-mono tracking-widest" : ""
      }`}
    />
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

  const chapterOptions = useMemo(
    () => chapters.map((c) => ({ value: c.value, label: c.label })),
    [chapters],
  );

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [idNumber, setIdNumber] = useState("");
  const [account, setAccount] = useState<OnboardingLookupResult | null>(null);
  const [pendingToken, setPendingToken] = useState("");
  const [otp, setOtp] = useState("");

  const {
    register,
    handleSubmit,
    control,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<ClaimFormValues>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      gender: "",
      date_of_birth: "",
      chapter: "",
      professional_qualification: "",
      professional_cadre: "",
      designation: "",
      institution: "",
      nck_number: "",
    },
  });

  const step2Fields: (keyof ClaimFormValues)[] = [
    "name",
    "email",
    "phone",
    "password",
    "gender",
    "date_of_birth",
  ];

  const handleNext = async (
    target: 2 | 3 | 4,
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
    if (res.name) setValue("name", res.name);
    if (res.email) setValue("email", res.email);
    if (res.phone) setValue("phone", res.phone);
    if (res.nck_number) setValue("nck_number", res.nck_number);
    setStep(2);
  };

  // Step 3 — submit full details and request an OTP.
  const onClaim = async (values: ClaimFormValues) => {
    const res = await claim
      .mutateAsync({ identification_number: idNumber.trim(), ...values })
      .catch(() => null);
    if (!res?.pending_token) return;
    setPendingToken(res.pending_token);
    if (res.otp) setOtp(res.otp);
    setStep(4);
  };

  // Step 4 — verify the OTP; on success the session is set by the hook.
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
        <form onSubmit={onLookup} className="space-y-4">
          <PlainField
            label="ID / National ID Number"
            value={idNumber}
            onChange={setIdNumber}
            placeholder="Enter your ID number"
            required
          />
          <button
            type="submit"
            disabled={lookup.isPending || !idNumber.trim()}
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
          <InputField
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            register={register("password")}
            error={errors.password?.message}
            required
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
          <InputField
            label="Institution"
            type="text"
            placeholder="e.g. Kenyatta National Hospital"
            register={register("institution")}
            error={errors.institution?.message}
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
        <form onSubmit={onVerify} className="space-y-4">
          <p className="text-sm text-slate-600">
            We sent a verification code to your email. Enter it below to finish
            claiming your account.
          </p>
          <PlainField
            label="Verification Code"
            value={otp}
            onChange={setOtp}
            placeholder="Enter the code"
            required
            mono
          />
          <button
            type="submit"
            disabled={verify.isPending || !otp.trim()}
            className="w-full bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
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
        </form>
      )}
    </div>
  );
}
