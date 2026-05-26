"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNnakResetPassword } from "@/hooks/nnak/use-auth";

export default function NnakResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const email = sp.get("email") || "";
  const token = sp.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const m = useNnakResetPassword();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await m
      .mutateAsync({ email, token, password, password_confirmation: confirm })
      .catch(() => null);
    if (r) router.push("/nnak/login");
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Reset password</h2>
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
      />
      <button
        disabled={m.isPending}
        className="w-full bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        Reset password
      </button>
    </form>
  );
}
