"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useNnakForgotPassword } from "@/hooks/use-auth";

export default function NnakForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const m = useNnakForgotPassword();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await m.mutateAsync({ email }).catch(() => null);
    if (!r) return;
    const params = new URLSearchParams({ email });
    if (r.token) params.set("token", r.token);
    router.push(`/nnak/reset-password?${params.toString()}`);
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Forgot password</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="Email address"
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
      />
      <button
        disabled={m.isPending}
        className="w-full bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        Send reset link
      </button>
      <div className="text-xs text-center text-slate-600">
        <Link href="/nnak/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
