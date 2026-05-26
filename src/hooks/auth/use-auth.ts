"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { qk } from "@/lib/query-keys";
import { authService } from "@/services/auth.service";
import { extractApiError } from "@/lib/extract-api-error";
import { setAuthUser, clearAuthUser } from "@/lib/auth";
import type { ResetPasswordBody } from "@/types/auth";

export const useMe = () =>
  useQuery({
    queryKey: qk.auth.me,
    queryFn: authService.me,
    retry: (count, err: any) => err?.response?.status !== 401 && count < 1,
    staleTime: 60_000,
  });

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuthUser(data.user);
      qc.setQueryData(qk.auth.me, data.user);
      toast.success(`Welcome back, ${data.user.name}`);
    },
    onError: (e) => {
      toast.error(extractApiError(e, "Login failed"));
    },
  });
};

export const useSignup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authService.signup,
    onSuccess: (data) => {
      setAuthUser(data.user);
      qc.setQueryData(qk.auth.me, data.user);
      toast.success("Account created");
    },
    onError: (e) => toast.error(extractApiError(e, "Signup failed")),
  });
};

export const useForgotPassword = () =>
  useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => toast.success("Reset email sent"),
    onError: (e) => toast.error(extractApiError(e, "Could not send email")),
  });

export const useResetPassword = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ token, body }: { token: string; body: ResetPasswordBody }) =>
      authService.resetPassword(token, body),
    onSuccess: (data) => {
      setAuthUser(data.user);
      qc.setQueryData(qk.auth.me, data.user);
      toast.success("Password reset successfully");
    },
    onError: (e) => toast.error(extractApiError(e, "Reset failed")),
  });
};

export const useUpdateMyPassword = () =>
  useMutation({
    mutationFn: authService.updateMyPassword,
    onSuccess: () => toast.success("Password updated"),
    onError: (e) => toast.error(extractApiError(e, "Update failed")),
  });

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearAuthUser();
      qc.clear();
      if (typeof window !== "undefined") window.location.href = "/login";
    },
  });
};
