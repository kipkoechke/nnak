"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import { useCreateMember } from "@/hooks/use-members";
import { useNnakBranches } from "@/hooks/use-branches";
import { useGenders, useEmployerTypes } from "@/hooks/use-enums";

export default function NewMemberPage() {
  const router = useRouter();
  const create = useCreateMember();
  const { data: branches = [], isLoading: branchesLoading } = useNnakBranches();
  const { data: genders = [], isLoading: gendersLoading } = useGenders();
  const { data: employerTypes = [], isLoading: typesLoading } = useEmployerTypes();
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    identification_number: "", license_number: "",
    gender: "",
    employer_type: "", branch_id: "",
    employer_name: "", county: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await create.mutateAsync({
      name: form.name,
      email: form.email,
      profile: {
        phone: form.phone || null,
        identification_number: form.identification_number || null,
        license_number: form.license_number || null,
        gender: (form.gender as "male" | "female") || "female",
        employer_type: form.employer_type || null,
        branch_id: form.branch_id || null,
        employer_name: form.employer_name || null,
        county: form.county || null,
      },
    }).catch(() => null);
    if (r) router.push(`/nnak/members/${r.id}`);
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="New Member" description="Register a new NNAK member" back={() => router.back()} />
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
        {([
          ["name","Full Name", true],
          ["email","Email", true],
          ["phone","Phone", false],
          ["identification_number","National ID", false],
          ["license_number","Licence Number", false],
          ["employer_name","Employer", false],
          ["county","County", false],
        ] as const).map(([k, l, req]) => (
          <div key={k}>
            <label className="block text-xs font-medium text-slate-600 mb-1">{l}</label>
            <input
              required={req}
              value={form[k]}
              onChange={(e) => set(k, e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
          <select value={form.gender} onChange={(e) => set("gender", e.target.value)} required disabled={gendersLoading} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
            <option value="">{gendersLoading ? "Loading…" : "— Select —"}</option>
            {genders.map((g) => (
              <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Category (Employer Type)</label>
          <select value={form.employer_type} onChange={(e) => set("employer_type", e.target.value)} disabled={typesLoading} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
            <option value="">{typesLoading ? "Loading…" : "— Select —"}</option>
            {employerTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Branch</label>
          <select value={form.branch_id} onChange={(e) => set("branch_id", e.target.value)} disabled={branchesLoading} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
            <option value="">{branchesLoading ? "Loading branches…" : "— Select —"}</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}{b.employer_type ? ` (${b.employer_type})` : ""}</option>)}
          </select>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={create.isPending} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {create.isPending ? "Saving..." : "Create Member"}
          </button>
        </div>
      </form>
    </div>
  );
}
