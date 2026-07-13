"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useNnakLogin } from "@/hooks/use-auth";

export default function NnakLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirect = sp.get("redirect") || "/nnak/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useNnakLogin();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await login.mutateAsync({ email, password }).catch(() => null);
    if (!res) return;
    const params = new URLSearchParams({
      token: res.pending_token,
      email,
      redirect,
    });
    if (res.otp) params.set("hint", res.otp);
    router.push(`/nnak/verify-otp?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="e.g. jane.omondi@example.com"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {login.isPending ? "Signing in..." : "Sign in"}
        </button>
        <div className="flex justify-between text-xs text-slate-600">
          <Link href="/nnak/forgot-password" className="hover:underline">
            Forgot password?
          </Link>
          <Link href="/nnak/register" className="hover:underline">
            Register
          </Link>
        </div>
      </form>
      <div className="border-t border-slate-100 pt-4 text-xs text-slate-600 text-center">
        Existing member migrated by NNAK?{" "}
        <Link href="/nnak/onboarding" className="text-primary font-medium hover:underline">
          Claim your account
        </Link>
      </div>
    </div>
  );
}
