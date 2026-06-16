"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNnakRegister } from "@/hooks/use-auth";
import { useEmployerTypes, useChapters } from "@/hooks/use-enums";
import { InputField } from "@/components/common/InputField";
import { PhoneInputField } from "@/components/common/PhoneInputField";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { DatePicker } from "@/components/common/DatePicker";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth.schema";

const GENDER_OPTS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

const ID_TYPE_OPTS = [
  {
    value: "National ID",
    label: "National ID",
    description: "Kenyan citizens",
  },
  {
    value: "Passport",
    label: "Passport",
    description: "Non-citizens / international",
  },
  {
    value: "Alien ID",
    label: "Alien ID",
    description: "Foreign nationals resident in Kenya",
  },
  {
    value: "Birth Certificate",
    label: "Birth Certificate",
    description: "For minors / students",
  },
];

const COUNTY_OPTS = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita Taveta",
  "Tana River",
  "Tharaka Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
].map((c) => ({ value: c, label: c }));

const PROFESSIONAL_QUALIFICATION_OPTS = [
  { value: "PhD", label: "PhD" },
  { value: "Masters", label: "Masters" },
  { value: "Bachelors in Nursing", label: "Bachelors in Nursing" },
  { value: "Higher National Diploma", label: "Higher National Diploma" },
  { value: "Diploma", label: "Diploma" },
  { value: "Certificate", label: "Certificate" },
];

const PROFESSIONAL_CADRE_OPTS = [
  { value: "PhD", label: "PhD" },
  { value: "MSCN", label: "MSCN" },
  { value: "BSCN", label: "BSCN" },
  { value: "HND", label: "HND" },
  { value: "KRCHN", label: "KRCHN" },
  { value: "ECHN", label: "ECHN" },
];

const STEPS = [
  { id: 1, label: "Personal Details" },
  { id: 2, label: "Professional" },
  { id: 3, label: "Account Details" },
] as const;

export default function NnakRegisterPage() {
  const router = useRouter();
  const reg = useNnakRegister();
  const { data: employerTypes = [] } = useEmployerTypes();
  const { data: chapters = [] } = useChapters();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const employerTypeOptions = useMemo(() => employerTypes, [employerTypes]);
  const chapterOptions = useMemo(
    () => chapters.map((c) => ({ value: c.value, label: c.label })),
    [chapters],
  );

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      date_of_birth: "",
      gender: "",
      identification_type: "National ID",
      identification_number: "",
      nck_number: "",
      professional_qualification: "",
      professional_cadre: "",
      designation: "",
      place_of_work: "",
      county: "",
      employer_type: "",
      chapter: "",
      password: "",
      password_confirmation: "",
    },
  });

  const step1Fields: (keyof RegisterFormValues)[] = [
    "name",
    "email",
    "phone",
    "date_of_birth",
    "gender",
    "identification_type",
    "identification_number",
  ];
  const step2Fields: (keyof RegisterFormValues)[] = [
    "nck_number",
    "professional_qualification",
    "professional_cadre",
    "designation",
    "place_of_work",
    "county",
    "employer_type",
  ];

  const handleNext = async (
    target: number,
    fields: (keyof RegisterFormValues)[],
  ) => {
    const valid = await trigger(fields);
    if (valid) setStep(target as 1 | 2 | 3);
    else {
      const first = fields.find((f) => errors[f]);
      if (first)
        toast.error(
          (errors[first]?.message as string) ||
            "Please fix the highlighted field",
        );
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    const r = await reg
      .mutateAsync({
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        phone: data.phone.replace(/^\+/, ""),
        identification_type: data.identification_type,
        identification_number: data.identification_number,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        nck_number: data.nck_number,
        professional_qualification: data.professional_qualification,
        professional_cadre: data.professional_cadre,
        designation: data.designation,
        place_of_work: data.place_of_work,
        county: data.county,
        employer_type: data.employer_type,
        chapter: data.chapter || undefined,
      })
      .catch(() => null);
    if (!r) return;
    const params = new URLSearchParams({
      token: r.pending_token,
      email: data.email,
      redirect: "/nnak/dashboard",
    });
    if (r.otp) params.set("hint", r.otp);
    router.push(`/nnak/verify-otp?${params.toString()}`);
  };

  const idTypeOptions = useMemo(() => ID_TYPE_OPTS, []);
  const countyOptions = useMemo(() => COUNTY_OPTS, []);

  return (
    <form
      onSubmit={handleSubmit(onSubmit, (errs) => {
        const first = Object.values(errs)[0];
        toast.error(
          (first?.message as string) || "Please fix the highlighted fields",
        );
      })}
      className="space-y-5"
    >
      <p className="text-xs text-slate-500">NNAK self-registration</p>

      {/* Step indicator */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex-1 h-1 rounded-full ${
                step >= s.id ? "bg-primary" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs">
          {STEPS.map((s) => (
            <span
              key={s.id}
              className={
                step === s.id
                  ? "text-primary font-semibold"
                  : step > s.id
                    ? "text-slate-700"
                    : "text-slate-400"
              }
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Step 1 — Personal Details */}
      {step === 1 && (
        <div className="space-y-4">
          <InputField
            label="Full Name"
            type="text"
            placeholder="e.g. Jane Achieng Omondi"
            register={register("name")}
            error={errors.name?.message}
            required
          />
          <InputField
            label="Email"
            type="email"
            placeholder="e.g. jane.omondi@example.com"
            register={register("email")}
            error={errors.email?.message}
            required
          />

          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <PhoneInputField
                label="Phone"
                required
                value={field.value}
                onChange={field.onChange}
                defaultCountry="KE"
                error={errors.phone?.message}
              />
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="date_of_birth"
              render={({ field }) => (
                <DatePicker
                  label="Date of Birth"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  maxDate={new Date()}
                  error={errors.date_of_birth?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <SearchableSelect
                  label="Gender"
                  required
                  options={GENDER_OPTS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select gender"
                  error={errors.gender?.message}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="identification_type"
              render={({ field }) => (
                <SearchableSelect
                  label="Identification Type"
                  required
                  options={idTypeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select ID type"
                  error={errors.identification_type?.message}
                />
              )}
            />
            <InputField
              label="Identification Number"
              type="text"
              placeholder="e.g. 34567890"
              register={register("identification_number")}
              error={errors.identification_number?.message}
              required
            />
          </div>

          <button
            type="button"
            onClick={() => handleNext(2, step1Fields)}
            className="w-full bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2 — Professional */}
      {step === 2 && (
        <div className="space-y-4">
          <InputField
            label="NCK License Number"
            type="text"
            placeholder="e.g. NCK/2024/98765"
            register={register("nck_number")}
            error={errors.nck_number?.message}
            required
          />
          <InputField
            label="Designation"
            type="text"
            placeholder="e.g. Registered Nurse"
            register={register("designation")}
            error={errors.designation?.message}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="professional_qualification"
              render={({ field }) => (
                <SearchableSelect
                  label="Highest Professional Qualification"
                  required
                  options={PROFESSIONAL_QUALIFICATION_OPTS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select qualification"
                  error={errors.professional_qualification?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="professional_cadre"
              render={({ field }) => (
                <SearchableSelect
                  label="Professional Cadre"
                  required
                  options={PROFESSIONAL_CADRE_OPTS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select cadre"
                  error={errors.professional_cadre?.message}
                />
              )}
            />
          </div>
          <InputField
            label="Place of Work"
            type="text"
            placeholder="e.g. Kenyatta National Hospital"
            register={register("place_of_work")}
            error={errors.place_of_work?.message}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="county"
              render={({ field }) => (
                <SearchableSelect
                  label="County"
                  required
                  options={countyOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select county"
                  searchPlaceholder="Search counties…"
                  error={errors.county?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="employer_type"
              render={({ field }) => (
                <SearchableSelect
                  label="Employer Type"
                  required
                  options={employerTypeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select employer type"
                  error={errors.employer_type?.message}
                />
              )}
            />
          </div>

          <Controller
            control={control}
            name="chapter"
            render={({ field }) => (
              <SearchableSelect
                label="Chapter"
                options={chapterOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select chapter (optional)"
                searchPlaceholder="Search chapters…"
              />
            )}
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 border border-slate-300 text-slate-700 px-4 py-3 rounded-lg text-sm font-semibold hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => handleNext(3, step2Fields)}
              className="flex-1 bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Account Details */}
      {step === 3 && (
        <div className="space-y-4">
          <InputField
            label="Password"
            type="password"
            placeholder="••••••••"
            register={register("password")}
            error={errors.password?.message}
            required
          />
          <InputField
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            register={register("password_confirmation")}
            error={errors.password_confirmation?.message}
            required
          />

          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
            Use 8 characters or more, mixing letters, numbers and symbols for a
            strong account.
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 border border-slate-300 text-slate-700 px-4 py-3 rounded-lg text-sm font-semibold hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={reg.isPending}
              className="flex-1 bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {reg.isPending ? "Registering..." : "Create account"}
            </button>
          </div>
        </div>
      )}

      <div className="text-xs text-center text-slate-600">
        Have an account?{" "}
        <Link href="/nnak/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  );
}
