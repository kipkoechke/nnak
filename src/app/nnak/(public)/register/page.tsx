"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useNnakRegister } from "@/hooks/use-auth";

const GENDERS = ["Female", "Male", "Other"];

export default function NnakRegisterPage() {
  const router = useRouter();
  const reg = useNnakRegister();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    identification_type: "National ID",
    identification_number: "",
    license_number: "",
    nck_number: "",
    professional_qualification: "",
    password: "",
    password_confirmation: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const step1Valid =
    form.name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.date_of_birth &&
    form.gender;

  const step2Valid =
    form.identification_number.trim() &&
    form.license_number.trim() &&
    form.password &&
    form.password_confirmation &&
    form.password === form.password_confirmation;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
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
        license_number: form.license_number,
        identification_type: form.identification_type,
        identification_number: form.identification_number,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        nck_number: form.nck_number || undefined,
        professional_qualification: form.professional_qualification || undefined,
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

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Register</h2>
      <p className="text-xs text-slate-500">NNAK self-registration</p>

      {/* Step indicator */}
      <div className="flex gap-2">
        <div className={`flex-1 h-1 rounded-full ${step === 1 ? "bg-primary" : "bg-slate-200"}`} />
        <div className={`flex-1 h-1 rounded-full ${step === 2 ? "bg-primary" : "bg-slate-200"}`} />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span className={step === 1 ? "text-primary font-medium" : ""}>
          Personal Details
        </span>
        <span className={step === 2 ? "text-primary font-medium" : ""}>
          Professional & Account
        </span>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          {([
            ["name", "Full Name", "text"],
            ["email", "Email", "email"],
            ["phone", "Phone (+254...)", "tel"],
            ["date_of_birth", "Date of Birth", "date"],
          ] as const).map(([key, label, type]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {label}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}

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
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
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

      {step === 2 && (
        <div className="space-y-3">
          {([
            ["identification_type", "Identification Type", "text"],
            ["identification_number", "Identification Number", "text"],
            ["license_number", "Licence Number", "text"],
            ["nck_number", "NCK Number", "text"],
            ["professional_qualification", "Professional Qualification", "text"],
          ] as const).map(([key, label, type]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {label}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                required={key === "license_number" || key === "identification_number"}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}

          <hr className="border-slate-200" />

          {([
            ["password", "Password", "password"],
            ["password_confirmation", "Confirm Password", "password"],
          ] as const).map(([key, label, type]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {label}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                required
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
              disabled={reg.isPending || !step2Valid}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {reg.isPending ? "Registering..." : "Register"}
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
