"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import {
  useNnakMe,
  useNnakChangePassword,
  useNnakUpdateProfile,
} from "@/hooks/use-auth";
import { NNAK_ROLES, isStaff } from "@/lib/rbac";
import { MdModeEditOutline, MdLockOutline, MdPerson } from "react-icons/md";

const Item = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="text-sm text-slate-900 mt-0.5">{value || "—"}</dd>
  </div>
);

export default function ProfileSettingsPage() {
  const { data: me, isLoading } = useNnakMe();
  const changePassword = useNnakChangePassword();
  const updateProfile = useNnakUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    county: "",
    designation: "",
    place_of_work: "",
  });

  // Seed the form from the loaded profile, and re-seed whenever the
  // canonical data changes (e.g. after a successful save).
  useEffect(() => {
    if (!me) return;
    setForm({
      name: me.name ?? "",
      phone: me.profile?.phone ?? "",
      county: me.profile?.county ?? "",
      designation: me.profile?.designation ?? "",
      place_of_work: me.profile?.employer_name ?? "",
    });
  }, [me]);

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      {
        name: form.name.trim(),
        phone: form.phone.trim(),
        county: form.county.trim(),
        designation: form.designation.trim(),
        place_of_work: form.place_of_work.trim(),
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
            <div className="w-12 h-12 rounded-full bg-primary-subtle flex items-center justify-center border-2 border-primary-muted shrink-0">
              <MdPerson className="w-6 h-6 text-primary" />
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
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Full Name"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              />
              <TextField
                label="Phone"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              />
              {!staff && (
                <>
                  <TextField
                    label="County"
                    value={form.county}
                    onChange={(v) => setForm((f) => ({ ...f, county: v }))}
                  />
                  <TextField
                    label="Designation"
                    value={form.designation}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, designation: v }))
                    }
                  />
                  <TextField
                    label="Place of Work"
                    value={form.place_of_work}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, place_of_work: v }))
                    }
                  />
                </>
              )}
            </div>
            {/* Read-only identity fields cannot be self-edited (members only). */}
            {!staff && (
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                <Item
                  label="Membership Number"
                  value={profile?.membership_number}
                />
                <Item label="Account Number" value={profile?.account_number} />
                <Item label="NCK Number" value={profile?.nck_number} />
                <Item
                  label="ID Number"
                  value={profile?.identification_number}
                />
              </dl>
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
                disabled={updateProfile.isPending || form.name.trim().length === 0}
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
              passwordConfirmation.length > 0 && password !== passwordConfirmation
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

const TextField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 mb-1">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
    />
  </div>
);

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
    <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
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
