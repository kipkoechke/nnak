"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageHeader from "@/components/common/PageHeader";
import { InputField } from "@/components/common/InputField";
import { PhoneInputField } from "@/components/common/PhoneInputField";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import {
  useNnakMe,
  useNnakChangePassword,
  useNnakUpdateProfile,
  useNnakUpdateProfilePicture,
} from "@/hooks/use-auth";
import { useChapters, useEmployerTypes } from "@/hooks/use-enums";
import { COUNTY_OPTIONS } from "@/lib/counties";
import { profileSchema, type ProfileFormValues } from "@/schemas/auth.schema";
import { NNAK_ROLES, isStaff } from "@/lib/rbac";
import {
  MdModeEditOutline,
  MdLockOutline,
  MdPerson,
  MdPhotoCamera,
} from "react-icons/md";

const Item = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wide text-slate-500">
      {label}
    </dt>
    <dd className="text-sm text-slate-900 mt-0.5">{value || "—"}</dd>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
    {children}
  </h4>
);

export default function ProfileSettingsPage() {
  const { data: me, isLoading } = useNnakMe();
  const changePassword = useNnakChangePassword();
  const updateProfile = useNnakUpdateProfile();
  const updatePicture = useNnakUpdateProfilePicture();
  const photoRef = useRef<HTMLInputElement | null>(null);

  const { data: employerTypes = [] } = useEmployerTypes();
  const { data: chapters = [] } = useChapters();
  const chapterOptions = useMemo(
    () => chapters.map((c) => ({ value: c.value, label: c.label })),
    [chapters],
  );

  const onPhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updatePicture.mutate(file);
    e.target.value = "";
  };

  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset: resetForm,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      designation: "",
      place_of_work: "",
      county: "",
      employer_type: "",
      chapter: "",
    },
  });

  // Seed the form from the loaded profile, and re-seed whenever the
  // canonical data changes (e.g. after a successful save).
  useEffect(() => {
    if (!me) return;
    resetForm({
      name: me.name ?? "",
      phone: me.profile?.phone ?? "",
      designation: me.profile?.designation ?? "",
      place_of_work: me.profile?.employer_name ?? "",
      county: me.profile?.county ?? "",
      employer_type: me.profile?.employer_type ?? "",
      chapter: me.profile?.chapter ?? "",
    });
  }, [me, resetForm]);

  const saveProfile = (values: ProfileFormValues) => {
    updateProfile.mutate(
      {
        name: values.name.trim(),
        // The API rejects a leading "+" — match what registration sends.
        phone: values.phone.replace(/^\+/, ""),
        county: values.county || undefined,
        designation: values.designation || undefined,
        place_of_work: values.place_of_work || undefined,
        employer_type: values.employer_type || undefined,
        chapter: values.chapter || undefined,
      },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const canSubmit =
    currentPassword.length > 0 &&
    password.length >= 8 &&
    password === passwordConfirmation &&
    !changePassword.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    changePassword.mutate(
      {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setPassword("");
          setPasswordConfirmation("");
        },
      },
    );
  };

  if (isLoading && !me)
    return <div className="p-4 text-sm text-slate-500">Loading profile…</div>;
  if (!me)
    return <div className="p-4 text-sm text-slate-500">Not signed in.</div>;

  const profile = me.profile;
  // Staff (admin, super_admin, finance, etc.) have no membership identity, so
  // their profile shows only the account fields — keeping admin and
  // super_admin profiles consistent with one another.
  const staff = isStaff(me);

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title="Profile Settings"
        description="Your account details and security"
      />

      {/* Account */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0 group">
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                onChange={onPhotoPick}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-full bg-primary-subtle flex items-center justify-center border-2 border-primary-muted overflow-hidden">
                {profile?.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photo_url.replace(/\\/g, "")}
                    alt={me.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MdPerson className="w-7 h-7 text-primary" />
                )}
                {updatePicture.isPending && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-[10px] text-slate-600 rounded-full">
                    …
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                disabled={updatePicture.isPending}
                title="Change profile picture"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow ring-2 ring-white hover:bg-primary/90 disabled:opacity-50"
              >
                <MdPhotoCamera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold text-slate-900 truncate">
                {me.name}
              </div>
              <div className="text-xs text-slate-500 truncate">{me.email}</div>
              <div className="text-[11px] mt-0.5 text-primary font-medium">
                {NNAK_ROLES[me.role] ?? me.role}
              </div>
            </div>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary-muted rounded-md px-3 py-1.5 hover:bg-primary-subtle shrink-0"
            >
              <MdModeEditOutline className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          /* Fields mirror the registration form — same components, grouping
             and validation so the two screens read identically. */
          <form onSubmit={handleSubmit(saveProfile)} className="space-y-5">
            <div className="space-y-4">
              <SectionTitle>Personal Details</SectionTitle>
              <InputField
                label="Full Name"
                type="text"
                placeholder="e.g. Jane Achieng Omondi"
                register={register("name")}
                error={errors.name?.message}
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
            </div>

            {!staff && (
              <div className="space-y-4">
                <SectionTitle>Professional</SectionTitle>
                <InputField
                  label="Designation"
                  type="text"
                  placeholder="e.g. Registered Nurse"
                  register={register("designation")}
                  error={errors.designation?.message}
                />
                <InputField
                  label="Place of Work"
                  type="text"
                  placeholder="e.g. Kenyatta National Hospital"
                  register={register("place_of_work")}
                  error={errors.place_of_work?.message}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    control={control}
                    name="county"
                    render={({ field }) => (
                      <SearchableSelect
                        label="County"
                        options={COUNTY_OPTIONS}
                        value={field.value ?? ""}
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
                        options={employerTypes}
                        value={field.value ?? ""}
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
                      label="Chapter of Interest"
                      options={chapterOptions}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Select chapter"
                      searchPlaceholder="Search chapters…"
                      error={errors.chapter?.message}
                    />
                  )}
                />
              </div>
            )}

            {/* Read-only identity fields cannot be self-edited (members only). */}
            {!staff && (
              <div className="space-y-3">
                <SectionTitle>Membership Identity</SectionTitle>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Item
                    label="Membership Number"
                    value={profile?.membership_number}
                  />
                  <Item
                    label="Account Number"
                    value={profile?.account_number}
                  />
                  <Item label="NCK Number" value={profile?.nck_number} />
                  <Item
                    label="ID Number"
                    value={profile?.identification_number}
                  />
                </dl>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={updateProfile.isPending}
                className="px-4 py-2 text-sm font-semibold text-slate-600 rounded-md hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {updateProfile.isPending ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Item label="Email" value={me.email} />
            <Item label="Phone" value={profile?.phone} />
            {!staff && (
              <>
                <Item
                  label="Membership Number"
                  value={profile?.membership_number}
                />
                <Item label="Account Number" value={profile?.account_number} />
                <Item label="NCK Number" value={profile?.nck_number} />
                <Item label="County" value={profile?.county} />
                <Item
                  label="ID Number"
                  value={profile?.identification_number}
                />
                <Item
                  label="Designation"
                  value={profile?.designation?.toUpperCase()}
                />
                <Item label="Place of Work" value={profile?.employer_name} />
                <Item label="Employer Type" value={profile?.employer_type} />
                <Item
                  label="Chapter of Interest"
                  value={profile?.chapter_label ?? profile?.chapter}
                />
              </>
            )}
          </dl>
        )}
      </div>

      {/* Change password */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 max-w-lg">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mb-3">
          <MdLockOutline className="w-4 h-4" /> Change Password
        </h3>
        <form onSubmit={submit} className="space-y-3">
          <Field
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
          />
          <Field
            label="New Password"
            value={password}
            onChange={setPassword}
            hint="At least 8 characters"
          />
          <Field
            label="Confirm New Password"
            value={passwordConfirmation}
            onChange={setPasswordConfirmation}
            error={
              passwordConfirmation.length > 0 &&
              password !== passwordConfirmation
                ? "Passwords do not match"
                : undefined
            }
          />
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {changePassword.isPending ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const Field = ({
  label,
  value,
  onChange,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  error?: string;
}) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 mb-1">
      {label}
    </label>
    <input
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
    />
    {error ? (
      <p className="text-[11px] text-red-600 mt-1">{error}</p>
    ) : hint ? (
      <p className="text-[11px] text-slate-400 mt-1">{hint}</p>
    ) : null}
  </div>
);
