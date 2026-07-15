"use client";
import { useState } from "react";
import { MdAdd, MdSearch } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import {
  useAdminInstitutions,
  useCreateInstitution,
  useUpdateInstitution,
  useDeleteInstitution,
} from "@/hooks/use-institutions";
import type { Institution } from "@/types/nnak";

const empty = { name: "", code: "", category: "", type: "", location: "" };

export default function InstitutionsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminInstitutions({ search: search || undefined, page });
  const create = useCreateInstitution();
  const update = useUpdateInstitution();
  const remove = useDeleteInstitution();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Institution | null>(null);
  const [form, setForm] = useState(empty);

  const institutions = data?.data ?? [];
  const pagination = data?.pagination;

  const beginEdit = (i: Institution) => {
    setEditing(i);
    setForm({
      name: i.name,
      code: i.code,
      category: i.category || "",
      type: i.type || "",
      location: i.location || "",
    });
    setShowForm(true);
  };

  const reset = () => {
    setEditing(null);
    setForm(empty);
    setShowForm(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = { ...form, location: form.location || null };
    if (editing) await update.mutateAsync({ id: editing.id, input });
    else await create.mutateAsync(input);
    reset();
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Institutions"
        description="Training institutions used during student registration"
        action={
          <button
            onClick={() => {
              reset();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-sm"
          >
            <MdAdd className="w-4 h-4" /> New Institution
          </button>
        }
      />

      <div className="relative max-w-sm">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search institutions…"
          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm"
        />
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="bg-white border border-slate-200 rounded-lg p-4 space-y-2"
        >
          <div className="text-sm font-semibold">
            {editing ? "Edit" : "New"} Institution
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
              required
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Code"
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Category"
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
            <input
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              placeholder="Type"
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Location"
              className="px-3 py-2 border border-slate-300 rounded-md text-sm md:col-span-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={create.isPending || update.isPending}
              className="bg-primary text-white text-sm px-4 py-2 rounded disabled:opacity-50"
            >
              {editing ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Location</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : institutions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No institutions found.
                  </td>
                </tr>
              ) : (
                institutions.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {i.name}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{i.code}</td>
                    <td className="px-3 py-2">{i.category || "—"}</td>
                    <td className="px-3 py-2">{i.type || "—"}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {i.location || "—"}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => beginEdit(i)}
                        className="text-xs text-primary mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          confirm(`Delete ${i.name}?`) && remove.mutate(i.id)
                        }
                        className="text-xs text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.last_page > 1 && (
          <Pagination
            currentPage={pagination.current_page}
            totalPages={pagination.last_page}
            totalItems={pagination.total}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
