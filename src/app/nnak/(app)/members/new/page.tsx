"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAddBranchMember } from "@/hooks/use-branch-manager";
import {
  useChapters,
  useEmployerTypes,
  useProfessionalCadres,
  useProfessionalQualifications,
} from "@/hooks/use-enums";
import PageHeader from "@/components/common/PageHeader";
import { InputField } from "@/components/common/InputField";
import { PhoneInputField } from "@/components/common/PhoneInputField";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { DatePicker } from "@/components/common/DatePicker";
import {
  branchMemberSchema,
  type BranchMemberFormValues,
} from "@/schemas/auth.schema";

const GENDER_OPTS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

const ID_TYPE_OPTS = [
  { value: "National ID", label: "National ID" },
  { value: "Passport", label: "Passport" },
  { value: "Alien ID", label: "Alien ID" },
  { value: "Birth Certificate", label: "Birth Certificate" },
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

const STEPS = [
  { id: 1, label: "Personal Details" },
  { id: 2, label: "Professional" },
] as const;

export default function NewMemberPage() {
  const router = useRouter();
  const addBranchMember = useAddBranchMember();
  const { data: employerTypes = [] } = useEmployerTypes();
  const { data: chapters = [] } = useChapters();
  const { data: cadres = [] } = useProfessionalCadres();
  const { data: qualifications = [] } = useProfessionalQualifications();
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors },
  } = useForm<BranchMemberFormValues>({
    resolver: zodResolver(branchMemberSchema),
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
      place_of_work: "",
      county: "",
      employer_type: "",
      chapter: "",
    },
  });

  const step1Fields: (keyof BranchMemberFormValues)[] = [
    "name",
    "email",
    "phone",
    "date_of_birth",
    "gender",
    "identification_type",
    "identification_number",
  ];
  const handleNext = async (
    target: number,
    fields: (keyof BranchMemberFormValues)[],
  ) => {
    const valid = await trigger(fields);
    if (valid) setStep(target as 1 | 2);
    else {
      const first = fields.find((f) => errors[f]);
      if (first)
        toast.error(
          (errors[first]?.message as string) ||
            "Please fix the highlighted field",
        );
    }
  };

  const onSubmit = async (data: BranchMemberFormValues) => {
    const r = await addBranchMember
      .mutateAsync({
        name: data.name,
        email: data.email,
        phone: data.phone.replace(/^\+/, ""),
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        nck_number: data.nck_number,
        identification_type: data.identification_type,
        identification_number: data.identification_number,
        professional_qualification: data.professional_qualification,
        professional_cadre: data.professional_cadre,
        designation: data.professional_cadre,
        place_of_work: data.place_of_work,
        county: data.county,
        employer_type: data.employer_type,
        chapter: data.chapter || undefined,
      })
      .catch(() => null);
    if (r) {
      const params = new URLSearchParams({
        token: r.pending_token,
        email: data.email,
      });
      if (r.email_otp) params.set("email_otp", r.email_otp);
      if (r.phone_otp) params.set("phone_otp", r.phone_otp);
      router.push(`/nnak/branch/verify?${params.toString()}`);
    }
  };

  const idTypeOptions = useMemo(() => ID_TYPE_OPTS, []);
  const countyOptions = useMemo(() => COUNTY_OPTS, []);
  const employerTypeOptions = useMemo(() => employerTypes, [employerTypes]);
  const chapterOptions = useMemo(
    () => chapters.map((c) => ({ value: c.value, label: c.label })),
    [chapters],
  );

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="New Member"
        description="Register a new NNAK member"
        back={() => router.back()}
      />

      <form
        onSubmit={handleSubmit(onSubmit, (errs) => {
          const first = Object.values(errs)[0];
          toast.error(
            (first?.message as string) || "Please fix the highlighted fields",
          );
        })}
        className="bg-white border border-slate-200 rounded-lg p-6 max-w-xl space-y-5"
      >
        <div className="space-y-2">
          <div className="flex gap-2">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`flex-1 h-1 rounded-full ${step >= s.id ? "bg-primary" : "bg-slate-200"}`}
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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

        {step === 2 && (
          <div className="space-y-4">
            <InputField
              label="NCK Registration Number"
              type="text"
              placeholder="e.g. NCK/2024/98765"
              register={register("nck_number")}
              error={errors.nck_number?.message}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={control}
                name="professional_qualification"
                render={({ field }) => (
                  <SearchableSelect
                    label="Highest Professional Qualification"
                    required
                    options={qualifications}
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
                    options={cadres}
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
            <div className="grid grid-cols-2 gap-4">
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
                type="submit"
                disabled={addBranchMember.isPending}
                className="flex-1 bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {addBranchMember.isPending ? "Saving..." : "Create Member"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
