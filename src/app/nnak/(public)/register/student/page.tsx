"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStudentRegister } from "@/hooks/use-auth";
import { useInstitutions } from "@/hooks/use-institutions";
import { InputField } from "@/components/common/InputField";
import { PhoneInputField } from "@/components/common/PhoneInputField";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import {
  studentRegisterSchema,
  type StudentRegisterFormValues,
} from "@/schemas/auth.schema";

const STEPS = ["Personal Details", "Account Setup"];

export default function StudentRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [institutionPage, setInstitutionPage] = useState(1);

  const { data: institutionsData, isLoading: loadingInstitutions } =
    useInstitutions({
      search: institutionSearch || undefined,
      page: institutionPage,
      per_page: 20,
    });

  const registerStudent = useStudentRegister();

  const {
    control,
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<StudentRegisterFormValues>({
    resolver: zodResolver(studentRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      registration_number: "",
      institution_id: "",
      password: "",
      password_confirmation: "",
    },
  });

  const STEP_FIELDS: (keyof StudentRegisterFormValues)[][] = [
    ["name", "email", "phone", "registration_number", "institution_id"],
    ["password", "password_confirmation"],
  ];

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = (values: StudentRegisterFormValues) => {
    registerStudent.mutate(
      { ...values, phone: values.phone.replace(/^\+/, "") },
      {
        onSuccess: (data) => {
          const params = new URLSearchParams({
            token: data.pending_token,
            email: values.email,
            redirect: "/nnak/dashboard",
          });
          if (data.expires_in) params.set("expires_in", String(data.expires_in));
          if (data.otp) params.set("hint", data.otp);
          router.push(`/nnak/verify-otp?${params.toString()}`);
        },
      },
    );
  };

  const institutionOptions = (institutionsData?.data ?? []).map((i) => ({
    value: i.id,
    label: i.name,
    description: `${i.code} · ${i.category}`,
  }));

  const pagination = institutionsData?.pagination;

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Student Registration</h1>
        <p className="text-sm text-slate-500 mt-1">
          Create your student account to access NNAK events
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-6 gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                i < step
                  ? "bg-emerald-500 text-white"
                  : i === step
                    ? "bg-primary text-white"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs font-medium ${
                i === step ? "text-primary" : "text-slate-400"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px bg-slate-200 ml-1" />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === 0 && (
          <>
            <InputField
              label="Full Name"
              type="text"
              placeholder="e.g. Jane Muthoni"
              register={register("name")}
              error={errors.name?.message}
              required
            />
            <InputField
              label="Email Address"
              type="email"
              placeholder="e.g. jane@example.com"
              register={register("email")}
              error={errors.email?.message}
              required
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInputField
                  label="Phone Number"
                  required
                  value={field.value}
                  onChange={(val) => field.onChange(val || "")}
                  defaultCountry="KE"
                  error={errors.phone?.message}
                />
              )}
            />
            <InputField
              label="Registration Number"
              type="text"
              placeholder="e.g. KMTC/2024/00123"
              register={register("registration_number")}
              error={errors.registration_number?.message}
              required
            />
            <Controller
              name="institution_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  label="Institution"
                  required
                  options={institutionOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.institution_id?.message}
                  placeholder="Select your institution"
                  searchPlaceholder="Search institutions..."
                  onSearchChange={(s) => {
                    setInstitutionSearch(s);
                    setInstitutionPage(1);
                  }}
                  isLoading={loadingInstitutions}
                  showSearchHint
                  pagination={
                    pagination
                      ? {
                          currentPage: pagination.current_page,
                          totalPages: pagination.last_page,
                          totalItems: pagination.total,
                        }
                      : undefined
                  }
                  onPageChange={setInstitutionPage}
                />
              )}
            />

            <button
              type="button"
              onClick={handleNext}
              className="w-full py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <InputField
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              register={register("password")}
              error={errors.password?.message}
              required
            />
            <InputField
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              register={register("password_confirmation")}
              error={errors.password_confirmation?.message}
              required
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={registerStudent.isPending}
                className="flex-1 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {registerStudent.isPending ? "Creating account..." : "Create Account"}
              </button>
            </div>
          </>
        )}
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{" "}
        <Link href="/nnak/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
      <p className="text-center text-sm text-slate-500 mt-2">
        Registering as a nurse/midwife?{" "}
        <Link href="/nnak/register" className="text-primary font-medium hover:underline">
          Member registration
        </Link>
      </p>
    </div>
  );
}
