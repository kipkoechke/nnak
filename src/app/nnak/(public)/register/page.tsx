"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useNnakRegister } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-categories";
import { useNnakBranches } from "@/hooks/use-branches";

export default function NnakRegisterPage() {
  const router = useRouter();
  const reg = useNnakRegister();
  const { data: cats = [] } = useCategories();
  const { data: branches = [] } = useNnakBranches();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
    identification_type: "national_id" as const,
    identification_number: "",
    license_number: "",
    gender: "other" as "male" | "female" | "other",
    member_category_id: "",
    branch_id: "",
  });
  const set = (k: keyof typeof form, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await reg
      .mutateAsync({
        ...form,
        member_category_id: form.member_category_id || null,
        branch_id: form.branch_id || null,
      })
      .catch(() => null);
    if (r) router.push(`/nnak/verify-otp?email=${encodeURIComponent(form.email)}`);
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
          ["identification_number", "National ID", "text"],
          ["license_number", "NCK Licence Number", "text"],
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
          <select
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Branch (optional)</label>
          <select
            value={form.branch_id}
            onChange={(e) => set("branch_id", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">— None —</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Membership Category</label>
        <select
          value={form.member_category_id}
          onChange={(e) => set("member_category_id", e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">— Select —</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — KES {c.billing_frequency === "monthly" ? c.monthly_fee : c.annual_fee}/{c.billing_frequency}
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
