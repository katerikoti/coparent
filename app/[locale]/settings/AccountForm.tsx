"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";

export default function AccountForm({ email }: { email: string }) {
  const t = useTranslations("settings");
  const auth = useTranslations("auth");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (newPassword !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }
    setLoading(true);
    const res = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    });
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? t("passwordChangeFailed"));
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
    setDone(true);
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{t("accountTitle")}</h2>
      <p className="mt-1 text-sm text-slate-500">{t("accountHelp")}</p>

      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700">{auth("email")}</label>
        <input
          value={email}
          readOnly
          className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-500"
        />
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("currentPassword")}</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("newPassword")}</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("confirmPassword")}</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-violet-500"
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {done && <p className="text-sm text-emerald-600">{t("passwordChanged")}</p>}
        <button
          disabled={loading}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-4 font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {loading ? "..." : t("changePassword")}
        </button>
      </form>
    </div>
  );
}
