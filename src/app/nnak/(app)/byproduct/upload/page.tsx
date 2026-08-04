"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import {
  useUploadByProductFile,
  useDownloadByProductTemplate,
} from "@/hooks/use-byproduct";
import { MdUpload, MdClose } from "react-icons/md";

const todayIso = () => new Date().toISOString().slice(0, 10);
const monthsAgoIso = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};

export default function ByProductUploadPage() {
  const router = useRouter();
  const uploadMutation = useUploadByProductFile();
  const downloadTemplate = useDownloadByProductTemplate();

  const [file, setFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState(monthsAgoIso(1));
  const [endDate, setEndDate] = useState(todayIso());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const created = await uploadMutation
      .mutateAsync({ file, start_date: startDate, end_date: endDate })
      .catch(() => null);
    if (!created) return;
    setFile(null);
    // Land on the new upload's detail page — it polls while processing, so the
    // user watches this specific run finish instead of hunting for it in a list.
    router.push(
      created.id ? `/nnak/byproduct/${created.id}` : "/nnak/byproduct",
    );
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Upload By-Product"
        description="Upload a branch monthly remittance file"
        back={() => router.push("/nnak/byproduct")}
        action={
          <button
            onClick={() => downloadTemplate.mutate()}
            disabled={downloadTemplate.isPending}
            className="inline-flex items-center gap-1 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50"
          >
            {downloadTemplate.isPending ? "Downloading..." : "Download Template"}
          </button>
        }
      />

      <form
        onSubmit={submit}
        className="bg-white border border-slate-200 rounded-lg p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-600 mb-2">
            Upload Remittance File (.csv, .xlsx, .xls)
          </label>
          {file ? (
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <MdUpload className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {file.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-slate-400 hover:text-red-600 p-1"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              <MdUpload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm text-slate-500">
                Click to browse or drag and drop
              </span>
              <span className="text-xs text-slate-400 mt-1">
                CSV, XLSX, or XLS files
              </span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={() => router.push("/nnak/byproduct")}
            disabled={uploadMutation.isPending}
            className="px-4 py-2 text-sm font-semibold text-slate-600 rounded-md hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploadMutation.isPending || !file}
            className="bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload File"}
          </button>
        </div>
      </form>
    </div>
  );
}
