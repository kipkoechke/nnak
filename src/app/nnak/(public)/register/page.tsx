"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useNnakRegister } from "@/hooks/use-auth";
import { useNnakBranches } from "@/hooks/use-branches";
import { useGenders, useEmployerTypes } from "@/hooks/use-enums";

export default function NnakRegisterPage() {
  const router = useRouter();
  const reg = useNnakRegister();
  const { data: branches = [], isLoading: branchesLoading } = useNnakBranches();
  const { data: genders = [], isLoading: gendersLoading } = useGenders();
  const { data: employerTypes = [], isLoading: typesLoading } = useEmployerTypes();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
    identification_type: "National ID",
    identification_number: "",
    license_number: "",
    nck_number: "",
    professional_qualification: "",
    date_of_birth: "",
    gender: "",
    employer_type: "",
    branch_id: "",
  });
  const set = (k: keyof typeof form, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

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
        phone: form.phone || undefined,
        identification_type: form.identification_type || null,
        identification_number: form.identification_number || null,
        license_number: form.license_number || null,
        nck_number: form.nck_number || null,
        professional_qualification: form.professional_qualification || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || undefined,
        // Source of truth is /employer-types — sent as employer_type
        // (string) per backend. The legacy member_category_id was a
        // mock-only field and is intentionally omitted.
        employer_type: form.employer_type || undefined,
        branch_id: form.branch_id || null,
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
    <form onSubmit={submit} className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Register</h2>
      <p className="text-xs text-slate-500">NNAK self-registration (per SRS §3.2 FR-MP-001)</p>

      {(
        [
          ["name", "Full Name", "text"],
          ["email", "Email", "email"],
          ["phone", "Phone", "tel"],
          ["identification_number", "National ID Number", "text"],
          ["nck_number", "NCK Number", "text"],
          ["license_number", "Licence Number", "text"],
          ["professional_qualification", "Professional Qualification", "text"],
          ["date_of_birth", "Date of Birth", "date"],
          ["password", "Password", "password"],
          ["password_confirmation", "Confirm Password", "password"],
        ] as const
      ).map(([key, label, type]) => (
        <div key={key}>
          <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
          <input
            type={type}
            value={form[key]}
            onChange={(e) => set(key, e.target.value)}
            required={["name", "email", "password", "password_confirmation"].includes(key)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      ))}
      {form.password_confirmation &&
        form.password !== form.password_confirmation && (
          <div className="text-[11px] text-red-600">Passwords do not match.</div>
        )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
          <select
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
            required
            disabled={gendersLoading}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">{gendersLoading ? "Loading…" : "— Select —"}</option>
            {genders.map((g) => (
              <option key={g} value={g}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Category (Employer Type)
          </label>
          <select
            value={form.employer_type}
            onChange={(e) => set("employer_type", e.target.value)}
            required
            disabled={typesLoading}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">{typesLoading ? "Loading…" : "— Select —"}</option>
            {employerTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Branch</label>
        <select
          value={form.branch_id}
          onChange={(e) => set("branch_id", e.target.value)}
          disabled={branchesLoading}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">{branchesLoading ? "Loading branches…" : "— Select —"}</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.employer_type ? ` (${b.employer_type})` : ""}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-start gap-2 text-xs text-slate-600">
        <input type="checkbox" required className="mt-0.5" />
        <span>I accept the Privacy Notice & Terms of Service (DPA 2019 — ILM-001)</span>
      </label>

      <button
        type="submit"
        disabled={reg.isPending}
        className="w-full bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {reg.isPending ? "Registering..." : "Register"}
      </button>
      <div className="text-xs text-center text-slate-600">
        Have an account? <Link href="/nnak/login" className="hover:underline">Sign in</Link>
      </div>
    </form>
  );
}
