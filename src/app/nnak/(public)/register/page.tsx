"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useNnakRegister } from "@/hooks/use-auth";
import { PhoneInputField } from "@/components/common/PhoneInputField";
import { SearchableSelect } from "@/components/common/SearchableSelect";

const GENDERS = ["Female", "Male", "Other"];

const ID_TYPES = [
  { value: "National ID", label: "National ID", description: "Kenyan citizens" },
  { value: "Passport", label: "Passport", description: "Non-citizens / international" },
  { value: "Alien ID", label: "Alien ID", description: "Foreign nationals resident in Kenya" },
  { value: "Birth Certificate", label: "Birth Certificate", description: "For minors / students" },
];

// 47 Kenyan counties, sourced from the official NNAK handout.
const COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu",
  "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho",
  "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui",
  "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera",
  "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi",
  "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri",
  "Samburu", "Siaya", "Taita Taveta", "Tana River", "Tharaka Nithi",
  "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot",
];

const STEPS = [
  { id: 1, label: "Personal Details" },
  { id: 2, label: "Professional" },
  { id: 3, label: "Account Details" },
] as const;

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

  const step3Valid = passwordsMatch;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step3Valid) {
      toast.error("Passwords do not match");
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

  // Memoise option arrays so SearchableSelect doesn't re-trigger
  // search effects on every render.
  const idTypeOptions = useMemo(() => ID_TYPES, []);
  const countyOptions = useMemo(
    () => COUNTIES.map((c) => ({ value: c, label: c })),
    [],
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-xs text-slate-500">NNAK self-registration</p>

      {/* Step indicator */}
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

      {/* ── Step 1 — Personal Details ───────────────────── */}
      {step === 1 && (
        <div className="space-y-3">
          {(
            [
              ["name", "Full Name", "text", "e.g. Jane Achieng Omondi"],
              ["email", "Email", "email", "e.g. jane.omondi@example.com"],
            ] as const
          ).map(([key, label, type, placeholder]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {label}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}

          <PhoneInputField
            label="Phone"
            value={form.phone}
            onChange={(v) => set("phone", v ?? "")}
            required
            defaultCountry="KE"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => set("date_of_birth", e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Gender
              </label>
              <select
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="">— Select —</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Identification — type + number on one row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SearchableSelect
              label="Identification Type"
              options={idTypeOptions}
              value={form.identification_type}
              onChange={(v) => set("identification_type", v)}
              placeholder="Select an ID type"
              required
            />
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Identification Number
              </label>
              <input
                type="text"
                value={form.identification_number}
                onChange={(e) => set("identification_number", e.target.value)}
                placeholder="e.g. 34567890"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!step1Valid}
            className="w-full bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {/* ── Step 2 — Professional ────────────────────── */}
      {step === 2 && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              NCK License Number
            </label>
            <input
              type="text"
              value={form.nck_number}
              onChange={(e) => set("nck_number", e.target.value)}
              placeholder="e.g. NCK/2024/98765"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Professional Qualification
            </label>
            <input
              type="text"
              value={form.professional_qualification}
              onChange={(e) => set("professional_qualification", e.target.value)}
              placeholder="e.g. Bachelor of Science in Nursing"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Place of Work
            </label>
            <input
              type="text"
              value={form.place_of_work}
              onChange={(e) => set("place_of_work", e.target.value)}
              placeholder="e.g. Kenyatta National Hospital"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={form.designation}
                onChange={(e) => set("designation", e.target.value)}
                placeholder="e.g. Registered Nurse"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <SearchableSelect
              label="County"
              options={countyOptions}
              value={form.county}
              onChange={(v) => set("county", v)}
              placeholder="Select your county"
              searchPlaceholder="Search counties…"
              required
            />
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
              type="button"
              onClick={() => setStep(3)}
              disabled={!step2Valid}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3 — Account Details ─────────────────── */}
      {step === 3 && (
        <div className="space-y-3">
          {(
            [
              ["password", "Password", "••••••••"],
              ["password_confirmation", "Confirm Password", "••••••••"],
            ] as const
          ).map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {label}
              </label>
              <input
                type="password"
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}

          {form.password && form.password_confirmation &&
            form.password !== form.password_confirmation && (
              <div className="text-[11px] text-red-600">
                Passwords do not match.
              </div>
            )}

          <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-md p-3">
            Use 8 characters or more, mixing letters, numbers and symbols for a
            strong account.
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={reg.isPending || !step3Valid}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
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
