"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageHeader from "@/components/common/PageHeader";
import { InputField } from "@/components/common/InputField";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { PhoneInputField } from "@/components/common/PhoneInputField";
import {
  useCreateBranch,
  useNnakBranches,
  useUpdateBranch,
  isPendingBranch,
} from "@/hooks/use-branches";
import {
  useCommissionTypes,
  useEmployerTypes,
} from "@/hooks/use-enums";
import { useNnakMe } from "@/hooks/use-auth";
import { nnakCan } from "@/lib/rbac";
import { MdAdd, MdClose, MdEdit } from "react-icons/md";
import type { Branch, CreateBranchInput, UpdateBranchInput } from "@/types/nnak";

const branchSchema = z
  .object({
    name: z.string().min(1, "Branch name is required"),
    employer_type: z.string().min(1, "Employer type is required"),
    commission_type: z.string().min(1, "Commission type is required"),
    commission_value: z
      .string()
      .min(1, "Commission value is required")
      .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, {
        message: "Enter a valid amount",
      }),
    // Manager is optional, but nominating one is all-or-nothing.
    branch_manager_name: z.string(),
    branch_manager_email: z.string(),
    branch_manager_phone: z.string(),
  })
  .superRefine((v, ctx) => {
    const filled = [
      v.branch_manager_name,
      v.branch_manager_email,
      v.branch_manager_phone,
    ].filter((s) => s.trim().length > 0);
    if (filled.length === 0) return; // no manager — allowed
    if (!v.branch_manager_name.trim())
      ctx.addIssue({
        path: ["branch_manager_name"],
        code: z.ZodIssueCode.custom,
        message: "Manager name is required",
      });
    if (!v.branch_manager_email.trim())
      ctx.addIssue({
        path: ["branch_manager_email"],
        code: z.ZodIssueCode.custom,
        message: "Email is required",
      });
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.branch_manager_email))
      ctx.addIssue({
        path: ["branch_manager_email"],
        code: z.ZodIssueCode.custom,
        message: "Enter a valid email",
      });
    if (!v.branch_manager_phone.trim())
      ctx.addIssue({
        path: ["branch_manager_phone"],
        code: z.ZodIssueCode.custom,
        message: "Phone number is required",
      });
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
  const router = useRouter();
  const { data: me } = useNnakMe();
  const { data: branches = [] } = useNnakBranches();
  const { data: employerTypes = [] } = useEmployerTypes();
  const { data: commissionTypes = [] } = useCommissionTypes();
  const create = useCreateBranch();
  const update = useUpdateBranch();

  const [filterType, setFilterType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  // Set while editing an existing branch; null when creating a new one.
  const [editing, setEditing] = useState<Branch | null>(null);
  const saving = create.isPending || update.isPending;

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

  const startCreate = () => {
    setEditing(null);
    reset(defaultValues);
    setOpen(true);
  };

  const startEdit = (b: Branch) => {
    setEditing(b);
    reset({
      name: b.name ?? "",
      employer_type: b.employer_type ?? "",
      commission_type: b.commission_type ?? "",
      commission_value:
        b.commission_value != null ? String(b.commission_value) : "",
      branch_manager_name: "",
      branch_manager_email: "",
      branch_manager_phone: "",
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    reset(defaultValues);
  };

  const onSubmit = async (data: BranchFormValues) => {
    // Editing touches branch details only; the manager has its own flow.
    if (editing) {
      const patch: UpdateBranchInput = {
        name: data.name,
        employer_type: data.employer_type,
        commission_type: data.commission_type,
        commission_value: Number(data.commission_value).toFixed(2),
      };
      const ok = await update
        .mutateAsync({ id: editing.id, input: patch })
        .catch(() => null);
      if (ok) closeModal();
      return;
    }

    const hasManager = data.branch_manager_name.trim().length > 0;
    const payload: CreateBranchInput = {
      name: data.name,
      employer_type: data.employer_type,
      commission_type: data.commission_type,
      commission_value: Number(data.commission_value).toFixed(2),
      ...(hasManager
        ? {
            branch_manager_name: data.branch_manager_name,
            branch_manager_email: data.branch_manager_email,
            branch_manager_phone: data.branch_manager_phone.replace(/^\+/, ""),
          }
        : {}),
    };

    const r = await create.mutateAsync(payload).catch(() => null);
    if (!r) return;

    // With a manager the backend returns an OTP handle to verify; without one
    // the branch is already created and the list has been refetched.
    if (isPendingBranch(r)) {
      closeModal();
      const params = new URLSearchParams({
        token: r.pending_token,
        email: data.branch_manager_email,
      });
      if (r.email_otp) params.set("email_otp", r.email_otp);
      if (r.phone_otp) params.set("phone_otp", r.phone_otp);
      router.push(`/nnak/branches/verify?${params.toString()}`);
    } else {
      closeModal();
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
            onClick={startCreate}
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
              <th className="px-4 py-2 hidden md:table-cell">Commission Type</th>
              <th className="px-4 py-2 text-right hidden md:table-cell">Commission Value</th>
              <th className="px-4 py-2 text-right hidden sm:table-cell">Members</th>
              <th className="px-4 py-2 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">
                  <Link
                    href={`/nnak/branches/${b.id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {b.name}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-700">
                    {b.employer_type_label || b.employer_type || "—"}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-600 text-xs hidden md:table-cell">
                  {b.commission_type_label || b.commission_type || "—"}
                </td>
                <td className="px-4 py-2 text-right font-medium hidden md:table-cell">
                  {b.commission_value ?? "—"}
                </td>
                <td className="px-4 py-2 text-right hidden sm:table-cell">
                  {(b.members_count ?? 0).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {canCreate && (
                      <button
                        onClick={() => startEdit(b)}
                        className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium hover:text-primary"
                      >
                        <MdEdit className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                    <Link
                      href={`/nnak/branches/${b.id}`}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Details
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
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
          onClick={closeModal}
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
                {editing ? "Edit branch" : "Create branch"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
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

            {/* Manager is set at creation; on an existing branch it is
                changed from the branch detail page instead. */}
            {!editing && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-baseline justify-between mb-3">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                    Branch manager
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Optional — leave blank to add one later
                  </span>
                </div>
                <div className="space-y-4">
                  <InputField
                    label="Full Name"
                    type="text"
                    placeholder="e.g. Jane Doe"
                    register={register("branch_manager_name")}
                    error={errors.branch_manager_name?.message}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Email"
                      type="email"
                      placeholder="e.g. jane.doe@example.com"
                      register={register("branch_manager_email")}
                      error={errors.branch_manager_email?.message}
                    />
                    <Controller
                      control={control}
                      name="branch_manager_phone"
                      render={({ field }) => (
                        <PhoneInputField
                          label="Phone"
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
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {saving
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Create branch"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
