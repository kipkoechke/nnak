"use client";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageHeader from "@/components/common/PageHeader";
import { InputField } from "@/components/common/InputField";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { PhoneInputField } from "@/components/common/PhoneInputField";
import { useCreateBranch, useNnakBranches } from "@/hooks/use-branches";
import {
  useCommissionTypes,
  useEmployerTypes,
} from "@/hooks/use-enums";
import { useNnakMe } from "@/hooks/use-auth";
import { nnakCan } from "@/lib/rbac";
import { MdAdd, MdClose } from "react-icons/md";
import type { CreateBranchInput } from "@/types/nnak";

const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  employer_type: z.string().min(1, "Employer type is required"),
  commission_type: z.string().min(1, "Commission type is required"),
  commission_value: z
    .string()
    .min(1, "Commission value is required")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, {
      message: "Enter a valid amount",
    }),
  branch_manager_name: z.string().min(1, "Manager name is required"),
  branch_manager_email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  branch_manager_phone: z.string().min(1, "Phone number is required"),
});

type BranchFormValues = z.infer<typeof branchSchema>;

const defaultValues: BranchFormValues = {
  name: "",
  employer_type: "",
  commission_type: "",
  commission_value: "",
  branch_manager_name: "",
  branch_manager_email: "",
  branch_manager_phone: "",
};

export default function NnakBranchesPage() {
  const { data: me } = useNnakMe();
  const { data: branches = [] } = useNnakBranches();
  const { data: employerTypes = [] } = useEmployerTypes();
  const { data: commissionTypes = [] } = useCommissionTypes();
  const create = useCreateBranch();

  const [filterType, setFilterType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues,
  });

  const canCreate = nnakCan.manageBranches(me);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return branches.filter((b) => {
      if (filterType && (b.employer_type || "") !== filterType) return false;
      if (q && !b.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [branches, filterType, search]);

  const onSubmit = async (data: BranchFormValues) => {
    const payload: CreateBranchInput = {
      ...data,
      commission_value: Number(data.commission_value).toFixed(2),
      branch_manager_phone: data.branch_manager_phone.replace(/^\+/, ""),
    };
    const r = await create.mutateAsync(payload).catch(() => null);
    if (r) {
      setOpen(false);
      reset(defaultValues);
    }
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Branches"
        description="NNAK branches & geographic drill-down"
      />

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search branch…"
          className="px-3 py-2 border border-slate-300 rounded-md text-sm w-64"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">All employer types</option>
          {employerTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500 ml-auto">
          {filtered.length} of {branches.length} branches
        </span>
        {canCreate && (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-primary/90"
          >
            <MdAdd className="w-4 h-4" /> Create Branch
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Branch</th>
              <th className="px-4 py-2">Employer Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{b.name}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-700">
                    {b.employer_type_label || b.employer_type || "—"}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-8 text-center text-slate-500 text-sm"
                >
                  No branches match the filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && canCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={handleSubmit(onSubmit, (errs) => {
              const first = Object.values(errs)[0];
              toast.error(
                (first?.message as string) ||
                  "Please fix the highlighted fields",
              );
            })}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Create branch
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <InputField
                label="Branch name"
                type="text"
                placeholder="e.g. Kenyatta National Hospital"
                register={register("name")}
                error={errors.name?.message}
                required
              />
              <Controller
                control={control}
                name="employer_type"
                render={({ field }) => (
                  <SearchableSelect
                    label="Employer Type"
                    required
                    options={employerTypes}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select employer type"
                    error={errors.employer_type?.message}
                  />
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="commission_type"
                  render={({ field }) => (
                    <SearchableSelect
                      label="Commission Type"
                      required
                      options={commissionTypes}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select commission type"
                      error={errors.commission_type?.message}
                    />
                  )}
                />
                <InputField
                  label="Commission Value"
                  type="number"
                  placeholder="e.g. 5.00"
                  register={register("commission_value")}
                  error={errors.commission_value?.message}
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-3">
                Branch manager
              </div>
              <div className="space-y-4">
                <InputField
                  label="Full Name"
                  type="text"
                  placeholder="e.g. Jane Doe"
                  register={register("branch_manager_name")}
                  error={errors.branch_manager_name?.message}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Email"
                    type="email"
                    placeholder="e.g. jane.doe@example.com"
                    register={register("branch_manager_email")}
                    error={errors.branch_manager_email?.message}
                    required
                  />
                  <Controller
                    control={control}
                    name="branch_manager_phone"
                    render={({ field }) => (
                      <PhoneInputField
                        label="Phone"
                        required
                        defaultCountry="KE"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.branch_manager_phone?.message}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={create.isPending}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {create.isPending ? "Creating…" : "Create branch"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
