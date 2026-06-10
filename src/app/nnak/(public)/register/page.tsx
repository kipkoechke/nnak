"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useNnakRegister } from "@/hooks/use-auth";
import { PhoneInputField } from "@/components/common/PhoneInputField";
import { SearchableSelect } from "@/components/common/SearchableSelect";

/* ── Static option sets ─────────────────────────────────────── */

const GENDER_OPTS = [
  { value: "Female", label: "Female" },
  { value: "Male", label: "Male" },
  { value: "Other", label: "Other" },
];

const ID_TYPE_OPTS = [
  { value: "National ID", label: "National ID", description: "Kenyan citizens" },
  { value: "Passport", label: "Passport", description: "Non-citizens / international" },
  { value: "Alien ID", label: "Alien ID", description: "Foreign nationals resident in Kenya" },
  { value: "Birth Certificate", label: "Birth Certificate", description: "For minors / students" },
];

// 47 Kenyan counties — official NNAK handout.
const COUNTY_OPTS = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu",
  "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho",
  "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui",
  "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera",
  "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi",
  "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri",
  "Samburu", "Siaya", "Taita Taveta", "Tana River", "Tharaka Nithi",
  "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot",
].map((c) => ({ value: c, label: c }));

const STEPS = [
  { id: 1, label: "Personal Details" },
  { id: 2, label: "Professional" },
  { id: 3, label: "Account Details" },
] as const;

/* ── Shared visual primitives (match SearchableSelect / InputField) ── */

const FIELD_INPUT_CLS =
  "w-full px-3 py-3 border rounded-lg shadow-sm text-sm bg-white text-gray-900 placeholder:text-gray-500 " +
  "border-gray-300 hover:border-gray-400 transition-colors " +
  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary";

const FIELD_LABEL_CLS = "block text-sm font-bold text-gray-700 mb-2";

const FormInput = ({
  label,
  required,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
}) => (
  <div>
    <label className={FIELD_LABEL_CLS}>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      autoComplete={autoComplete}
      minLength={minLength}
      className={FIELD_INPUT_CLS}
    />
  </div>
);

/* ── Page ───────────────────────────────────────────────────── */

export default function NnakRegisterPage() {
  const router = useRouter();
  const reg = useNnakRegister();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    identification_type: "National ID",
    identification_number: "",
    nck_number: "",
    professional_qualification: "",
    place_of_work: "",
    designation: "",
    county: "",
    password: "",
    password_confirmation: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const step1Valid =
    !!form.name.trim() &&
    !!form.email.trim() &&
    !!form.phone.trim() &&
    !!form.date_of_birth &&
    !!form.gender &&
    !!form.identification_type &&
    !!form.identification_number.trim();

  const step2Valid =
    !!form.nck_number.trim() &&
    !!form.professional_qualification.trim() &&
    !!form.place_of_work.trim() &&
    !!form.designation.trim() &&
    !!form.county;

  const passwordsMatch =
    !!form.password &&
    !!form.password_confirmation &&
    form.password === form.password_confirmation;

  const step3Valid = passwordsMatch && form.password.length >= 8;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step3Valid) {
      toast.error("Please make sure both passwords match (min 8 characters)");
      return;
    }
    const r = await reg
      .mutateAsync({
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        phone: form.phone,
        identification_type: form.identification_type,
        identification_number: form.identification_number,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        nck_number: form.nck_number,
        professional_qualification: form.professional_qualification,
        place_of_work: form.place_of_work,
        designation: form.designation,
        county: form.county,
      })
      .catch(() => null);
    if (!r) return;
    const params = new URLSearchParams({
      token: r.pending_token,
      email: form.email,
      redirect: "/nnak/dashboard",
    });
    if (r.otp) params.set("hint", r.otp);
    router.push(`/nnak/verify-otp?${params.toString()}`);
  };

  const idTypeOptions = useMemo(() => ID_TYPE_OPTS, []);
  const countyOptions = useMemo(() => COUNTY_OPTS, []);

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-xs text-slate-500">NNAK self-registration</p>

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

      {/* ── Step 1 — Personal Details ─────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <FormInput
            label="Full Name"
            required
            value={form.name}
            onChange={(v) => set("name", v)}
            placeholder="e.g. Jane Achieng Omondi"
            autoComplete="name"
          />
          <FormInput
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(v) => set("email", v)}
            placeholder="e.g. jane.omondi@example.com"
            autoComplete="email"
          />

          <PhoneInputField
            label="Phone"
            required
            value={form.phone}
            onChange={(v) => set("phone", v ?? "")}
            defaultCountry="KE"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Date of Birth"
              type="date"
              required
              value={form.date_of_birth}
              onChange={(v) => set("date_of_birth", v)}
            />
            <SearchableSelect
              label="Gender"
              required
              options={GENDER_OPTS}
              value={form.gender}
              onChange={(v) => set("gender", v)}
              placeholder="Select gender"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SearchableSelect
              label="Identification Type"
              required
              options={idTypeOptions}
              value={form.identification_type}
              onChange={(v) => set("identification_type", v)}
              placeholder="Select ID type"
            />
            <FormInput
              label="Identification Number"
              required
              value={form.identification_number}
              onChange={(v) => set("identification_number", v)}
              placeholder="e.g. 34567890"
            />
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!step1Valid}
            className="w-full bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {/* ── Step 2 — Professional ──────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <FormInput
            label="NCK License Number"
            required
            value={form.nck_number}
            onChange={(v) => set("nck_number", v)}
            placeholder="e.g. NCK/2024/98765"
          />
          <FormInput
            label="Professional Qualification"
            required
            value={form.professional_qualification}
            onChange={(v) => set("professional_qualification", v)}
            placeholder="e.g. Bachelor of Science in Nursing"
          />
          <FormInput
            label="Place of Work"
            required
            value={form.place_of_work}
            onChange={(v) => set("place_of_work", v)}
            placeholder="e.g. Kenyatta National Hospital"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Designation"
              required
              value={form.designation}
              onChange={(v) => set("designation", v)}
              placeholder="e.g. Registered Nurse"
            />
            <SearchableSelect
              label="County"
              required
              options={countyOptions}
              value={form.county}
              onChange={(v) => set("county", v)}
              placeholder="Select county"
              searchPlaceholder="Search counties…"
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
              onClick={() => setStep(3)}
              disabled={!step2Valid}
              className="flex-1 bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3 — Account Details ──────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <FormInput
            label="Password"
            type="password"
            required
            value={form.password}
            onChange={(v) => set("password", v)}
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={8}
          />
          <FormInput
            label="Confirm Password"
            type="password"
            required
            value={form.password_confirmation}
            onChange={(v) => set("password_confirmation", v)}
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={8}
          />

          {form.password &&
            form.password_confirmation &&
            form.password !== form.password_confirmation && (
              <div className="text-xs text-red-600">Passwords do not match.</div>
            )}

          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
            Use 8 characters or more, mixing letters, numbers and symbols for a
            strong account.
          </div>

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
              disabled={reg.isPending || !step3Valid}
              className="flex-1 bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {reg.isPending ? "Registering..." : "Create account"}
            </button>
          </div>
        </div>
      )}

      <div className="text-xs text-center text-slate-600">
        Have an account?{" "}
        <Link href="/nnak/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  );
}
