"use client";
import { useState } from "react";
import { MdAdd, MdPersonOutline } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import { useMe } from "@/hooks/use-auth";
import { useAdmins, useCreateAdmin } from "@/hooks/use-admins";
import { nnakCan, NNAK_ROLES } from "@/lib/rbac";

export default function AdminsPage() {
  const { data: me } = useMe();
  const { data: admins = [], isLoading } = useAdmins();
  const create = useCreateAdmin();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });

  // Only the super admin may provision admin accounts.
  if (me && !nnakCan.manageRoles(me)) {
    return (
      <div className="px-4 py-10 text-center text-sm text-slate-500">
        You do not have permission to manage admins.
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({
      name: form.name.trim(),
      email: form.email.trim(),
    });
    setForm({ name: "", email: "" });
    setShowForm(false);
  };

  const canSubmit =
    form.name.trim().length > 0 &&
    /.+@.+\..+/.test(form.email.trim()) &&
    !create.isPending;

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Administrators"
        description="Provision and manage HQ admin accounts"
        action={
          <button
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-sm"
          >
            <MdAdd className="w-4 h-4" /> New Admin
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={submit}
          className="bg-white border border-slate-200 rounded-lg p-4 space-y-3"
        >
          <div className="text-sm font-semibold">New Admin</div>
          <p className="text-xs text-slate-500">
            The new admin is emailed an invitation to set their password.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              required
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email address"
              required
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="bg-primary text-white text-sm px-4 py-2 rounded disabled:opacity-50"
            >
              {create.isPending ? "Creating…" : "Create Admin"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm({ name: "", email: "" });
              }}
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-slate-500">
                  Loading admins…
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-slate-500">
                  No admins yet.
                </td>
              </tr>
            ) : (
              admins.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    <span className="inline-flex items-center gap-2">
                      <MdPersonOutline className="w-4 h-4 text-slate-400" />
                      {a.name}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{a.email}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {NNAK_ROLES[a.role] ?? a.role}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
