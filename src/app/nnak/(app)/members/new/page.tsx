"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import { useCreateMember } from "@/hooks/nnak/use-members";
import { useCategories } from "@/hooks/nnak/use-categories";
import { useNnakBranches } from "@/hooks/nnak/use-branches";

export default function NewMemberPage() {
  const router = useRouter();
  const create = useCreateMember();
  const { data: cats = [] } = useCategories();
  const { data: branches = [] } = useNnakBranches();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", nck_number: "",
    identification_number: "", license_number: "",
    gender: "other" as "male" | "female" | "other",
    member_category_id: "", branch_id: "",
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
        nck_number: form.nck_number || null,
        identification_number: form.identification_number || null,
        license_number: form.license_number || null,
        gender: form.gender,
        member_category_id: form.member_category_id || null,
        branch_id: form.branch_id || null,
        employer_name: form.employer_name || null,
        county: form.county || null,
      },
    }).catch(() => null);
    if (r) router.push(`/nnak/members/${r.id}`);
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="New Member" description="Register a new NNAK member (FR-MP-001)" back={() => router.back()} />
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
        {([
          ["name","Full Name", true],
          ["email","Email", true],
          ["phone","Phone", false],
          ["nck_number","NCK Number", false],
          ["identification_number","National ID", false],
          ["license_number","Licence #", false],
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
          <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
            <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Membership Category</label>
          <select value={form.member_category_id} onChange={(e) => set("member_category_id", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
            <option value="">— Select —</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Branch</label>
          <select value={form.branch_id} onChange={(e) => set("branch_id", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
            <option value="">— None —</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
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
