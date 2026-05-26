"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { nnakAuth } from "@/services/nnak/auth.service";
import { nqk } from "@/lib/nnak/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import { clearNnakSession, getNnakUser, setNnakSession } from "@/lib/nnak/auth-storage";

export const useNnakMe = () =>
  useQuery({
    queryKey: nqk.auth.me,
    queryFn: async () => {
      try {
        return await nnakAuth.me();
      } catch {
        return getNnakUser();
      }
    },
    staleTime: 60_000,
    retry: 0,
  });

export const useNnakLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nnakAuth.login,
    onSuccess: (data) => {
      setNnakSession(data.user, data.token);
      qc.setQueryData(nqk.auth.me, data.user);
      toast.success(`Welcome, ${data.user.name}`);
    },
    onError: (e) => toast.error(extractApiError(e, "Login failed")),
  });
};

export const useNnakRegister = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nnakAuth.register,
    onSuccess: (data) => {
      setNnakSession(data.user, data.token);
      qc.setQueryData(nqk.auth.me, data.user);
      toast.success("Account created — please verify your email");
    },
    onError: (e) => toast.error(extractApiError(e, "Registration failed")),
  });
};

export const useVerifyOtp = () =>
  useMutation({
    mutationFn: nnakAuth.verifyOtp,
    onSuccess: () => toast.success("Email verified"),
    onError: (e) => toast.error(extractApiError(e, "OTP verification failed")),
  });

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
