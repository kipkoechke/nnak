"use client";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useNnakMe, useNnakChangePassword } from "@/hooks/use-auth";
import { NNAK_ROLES } from "@/lib/rbac";
import { MdLockOutline, MdPerson } from "react-icons/md";

const Item = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="text-sm text-slate-900 mt-0.5">{value || "—"}</dd>
  </div>
);

export default function ProfileSettingsPage() {
  const { data: me, isLoading } = useNnakMe();
  const changePassword = useNnakChangePassword();

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

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title="Profile Settings"
        description="Your account details and security"
      />

      {/* Account */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary-subtle flex items-center justify-center border-2 border-primary-muted">
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
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Item label="Membership Number" value={profile?.membership_number} />
          <Item label="Account Number" value={profile?.account_number} />
          <Item label="NCK Number" value={profile?.nck_number} />
          <Item label="Phone" value={profile?.phone} />
          <Item label="ID Number" value={profile?.identification_number} />
          <Item label="Designation" value={profile?.designation} />
        </dl>
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
