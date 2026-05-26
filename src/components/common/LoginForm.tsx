"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { InputField } from "./InputField";
import Button from "./Button";
import { useLogin } from "@/hooks/auth/use-auth";
import { loginSchema } from "@/schemas/auth.schema";
import { appName } from "../../utils/logo";

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectParam = searchParams?.get("redirect");
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        reset();
        const target =
          redirectParam && redirectParam !== "/" ? redirectParam : "/dashboard";
        router.push(target);
      },
    });
  };

  return (
    <div className="w-full">
      <div className="text-center mb-4 mt-2">
        <h2 className="text-xl font-semibold text-gray-900">Sign In</h2>
        <p className="text-gray-600 mt-1">
          Access your {appName} admin account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <InputField
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          register={register("email")}
          error={errors.email?.message}
          required
          disabled={loginMutation.isPending}
        />

        <InputField
          label="Password"
          placeholder="Enter your password"
          type="password"
          register={register("password")}
          error={errors.password?.message}
          required
          disabled={loginMutation.isPending}
        />

        <div className="flex items-center justify-end text-sm">
          <Link
            href="/forgot-password"
            className="text-primary hover:text-primary/90 font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <div className="pt-2">
          <Button
            type="primary"
            htmlType="submit"
            disabled={loginMutation.isPending}
            className="w-full"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </div>
      </form>
    </div>
  );
};
