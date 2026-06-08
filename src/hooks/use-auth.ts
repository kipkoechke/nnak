"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { nnakAuth, type NnakUserWithProfile } from "@/services/auth.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import { clearNnakSession, getNnakUser, setNnakSession } from "@/lib/auth";

export const useNnakMe = () =>
  useQuery<NnakUserWithProfile | null>({
    queryKey: nqk.auth.me,
    queryFn: async () => {
      try {
        return await nnakAuth.me();
      } catch {
        return getNnakUser() as NnakUserWithProfile | null;
      }
    },
    staleTime: 60_000,
    retry: 0,
  });

/** First-leg login. Caller must then route to /verify-otp with the
 *  returned pending_token. Does NOT create a session by itself. */
export const useNnakLogin = () =>
  useMutation({
    mutationFn: nnakAuth.login,
    onError: (e) => toast.error(extractApiError(e, "Login failed")),
  });

/** First-leg register. Same shape as login. */
export const useNnakRegister = () =>
  useMutation({
    mutationFn: nnakAuth.register,
    onError: (e) => toast.error(extractApiError(e, "Registration failed")),
  });

/** Second-leg: completes login or registration, persists the Sanctum
 *  token, and primes the auth/me cache. */
export const useVerifyOtp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nnakAuth.verifyOtp,
    onSuccess: (data) => {
      setNnakSession(data.user, data.token);
      // Seed the cache for instant UI, then invalidate so React Query
      // immediately refetches GET /profile to hydrate user.profile.
      // Without the invalidate, staleTime would keep this thin verify-otp
      // user cached and the profile-dependent pages would stick on
      // "Setting up your portal…" forever.
      qc.setQueryData(nqk.auth.me, data.user as NnakUserWithProfile);
      qc.invalidateQueries({ queryKey: nqk.auth.me });
      toast.success(`Welcome, ${data.user.name}`);
    },
    onError: (e) => toast.error(extractApiError(e, "OTP verification failed")),
  });
};

export const useNnakForgotPassword = () =>
  useMutation({
    mutationFn: nnakAuth.forgotPassword,
    onSuccess: () => toast.success("Password reset token sent"),
    onError: (e) => toast.error(extractApiError(e, "Could not send reset token")),
  });

export const useNnakResetPassword = () =>
  useMutation({
    mutationFn: nnakAuth.resetPassword,
    onSuccess: () => toast.success("Password reset"),
    onError: (e) => toast.error(extractApiError(e, "Reset failed")),
  });

export const useNnakChangePassword = () =>
  useMutation({
    mutationFn: nnakAuth.changePassword,
    onSuccess: () => toast.success("Password changed"),
    onError: (e) => toast.error(extractApiError(e, "Change failed")),
  });

export const useNnakLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try { await nnakAuth.logout(); } catch { /* token may be expired */ }
    },
    onSuccess: () => {
      clearNnakSession();
      qc.clear();
      if (typeof window !== "undefined") window.location.href = "/nnak/login";
    },
  });
};

// Legacy-named aliases so restored layout components keep their import shape.
export const useMe = useNnakMe;
export const useLogin = useNnakLogin;
export const useLogout = useNnakLogout;
export const useSignup = useNnakRegister;
export const useForgotPassword = useNnakForgotPassword;
export const useResetPassword = useNnakResetPassword;
export const useUpdateMyPassword = useNnakChangePassword;
