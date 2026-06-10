"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useNnakLogin } from "@/hooks/use-auth";
import { DEMO_USERS, signInAsDemoUser } from "@/lib/demo-users";
import { nqk } from "@/lib/query-keys";

export default function NnakLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const qc = useQueryClient();
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
    if (res.otp) params.set("hint", res.otp); // dev convenience
    router.push(`/nnak/verify-otp?${params.toString()}`);
  };

  const pickDemo = (personaId: string) => {
    const user = signInAsDemoUser(personaId);
    if (!user) return;
    qc.setQueryData(nqk.auth.me, user);
    router.push(redirect);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Email or National ID</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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

      <div className="border-t border-slate-200 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            Demo
          </span>
          <h3 className="text-sm font-semibold text-slate-900">
            Quick sign-in as a sample user
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          One pre-seeded account per NNAK role so you can explore the RBAC
          views without the real backend. Will be removed once the API is
          wired up.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DEMO_USERS.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => pickDemo(u.id)}
              className="text-left rounded-md border border-slate-200 bg-white hover:border-primary hover:bg-primary/5 px-3 py-2 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">
                  {u.name}
                </span>
                <span className="text-[10px] uppercase text-primary font-semibold tracking-wide">
                  {u.role.replace("_", " ")}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {u.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
