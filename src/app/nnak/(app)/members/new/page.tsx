"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import { useCreateMember } from "@/hooks/use-members";
import { useAddBranchMember } from "@/hooks/use-branch-manager";
import { useNnakBranches } from "@/hooks/use-branches";
import { useGenders, useEmployerTypes } from "@/hooks/use-enums";
import { useNnakMe } from "@/hooks/use-auth";

const COUNTY_OPTS = [
  "Baringo","Bomet","Bungoma","Busia","Elgeyo Marakwet","Embu",
  "Garissa","Homa Bay","Isiolo","Kajiado","Kakamega","Kericho",
  "Kiambu","Kilifi","Kirinyaga","Kisii","Kisumu","Kitui",
  "Kwale","Laikipia","Lamu","Machakos","Makueni","Mandera",
  "Marsabit","Meru","Migori","Mombasa","Murang'a","Nairobi",
  "Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri",
  "Samburu","Siaya","Taita Taveta","Tana River","Tharaka Nithi",
  "Trans Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot",
].map((c) => ({ value: c, label: c }));

export default function NewMemberPage() {
  const router = useRouter();
  const create = useCreateMember();
  const addBranchMember = useAddBranchMember();
  const { data: branches = [], isLoading: branchesLoading } = useNnakBranches();
  const { data: genders = [], isLoading: gendersLoading } = useGenders();
  const { data: employerTypes = [], isLoading: typesLoading } = useEmployerTypes();
  const { data: me } = useNnakMe();
  const isBranchManager = me?.role === "branch" || me?.role === "branch_manager";

  const employerTypeOptions = useMemo(
    () => employerTypes.map((t) => ({ value: t, label: t })),
    [employerTypes],
  );

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    date_of_birth: "", gender: "",
    identification_type: "National ID", identification_number: "",
    nck_number: "", professional_qualification: "",
    designation: "", place_of_work: "",
    county: "", employer_type: "",
    branch_id: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBranchManager) {
      const r = await addBranchMember.mutateAsync({
        name: form.name,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        date_of_birth: form.date_of_birth,
        nck_number: form.nck_number,
        identification_type: form.identification_type,
        identification_number: form.identification_number,
        professional_qualification: form.professional_qualification,
        designation: form.designation || undefined,
        place_of_work: form.place_of_work || undefined,
        county: form.county || undefined,
        employer_type: form.employer_type || undefined,
      }).catch(() => null);
      if (r) router.push("/nnak/members");
    } else {
      const r = await create.mutateAsync({
        name: form.name,
        email: form.email,
        profile: {
          phone: form.phone || null,
          identification_number: form.identification_number || null,
          gender: (form.gender as "male" | "female") || "female",
          employer_type: form.employer_type || null,
          branch_id: form.branch_id || null,
          county: form.county || null,
        },
      }).catch(() => null);
      if (r) router.push(`/nnak/members/${r.id}`);
    }
  };

  const isPending = isBranchManager ? addBranchMember.isPending : create.isPending;

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="New Member" description="Register a new NNAK member" back={() => router.back()} />
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
        {([
          ["name","Full Name","text",true],
          ["email","Email","email",true],
          ["phone","Phone (+254...)","tel",true],
          ["date_of_birth","Date of Birth","date",isBranchManager],
          ["identification_type","Identification Type","text",isBranchManager],
          ["identification_number","Identification Number","text",isBranchManager],
          ["nck_number","NCK License Number","text",isBranchManager],
          ["professional_qualification","Professional Qualification","text",isBranchManager],
          ["designation","Designation","text",false],
          ["place_of_work","Place of Work","text",false],
        ] as const).map(([k, l, t, req]) => (
          <div key={k}>
            <label className="block text-xs font-medium text-slate-600 mb-1">{l}</label>
            <input
              type={t}
              required={req}
              value={form[k]}
              onChange={(e) => set(k, e.target.value)}
              placeholder={k.replace(/_/g, " ")}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
        ))}

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
          <select value={form.gender} onChange={(e) => set("gender", e.target.value)} required={isBranchManager} disabled={gendersLoading} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
            <option value="">{gendersLoading ? "Loading…" : "— Select —"}</option>
            {genders.map((g) => (
              <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
            ))}
          </select>
        </div>

        {isBranchManager && (
          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">County</label>
              <select value={form.county} onChange={(e) => set("county", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                <option value="">— Select —</option>
                {COUNTY_OPTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Employer Type</label>
              <select value={form.employer_type} onChange={(e) => set("employer_type", e.target.value)} disabled={typesLoading} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                <option value="">{typesLoading ? "Loading…" : "— Select —"}</option>
                {employerTypeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {!isBranchManager && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category (Employer Type)</label>
              <select value={form.employer_type} onChange={(e) => set("employer_type", e.target.value)} disabled={typesLoading} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                <option value="">{typesLoading ? "Loading…" : "— Select —"}</option>
                {employerTypeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Branch</label>
              <select value={form.branch_id} onChange={(e) => set("branch_id", e.target.value)} disabled={branchesLoading} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                <option value="">{branchesLoading ? "Loading branches…" : "— Select —"}</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}{b.employer_type ? ` (${b.employer_type})` : ""}</option>)}
              </select>
            </div>
          </>
        )}

        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={isPending} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {isPending ? "Saving..." : "Create Member"}
          </button>
        </div>
      </form>
    </div>
  );
}
