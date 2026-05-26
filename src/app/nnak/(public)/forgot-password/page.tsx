"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNnakForgotPassword } from "@/hooks/use-auth";

export default function NnakForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const m = useNnakForgotPassword();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await m.mutateAsync({ email }).catch(() => null);
    if (r) router.push(`/nnak/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(r.token)}`);
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
    </form>
  );
}
