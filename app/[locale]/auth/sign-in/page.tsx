"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? "Sign in failed");
      return;
    }
    router.push("../dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-md flex-col">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{t("signIn")}</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back to CoParent.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">{t("email")}</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{t("password")}</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-violet-500" />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-violet-600 px-4 py-2.5 font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
            {loading ? "..." : t("signIn")}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          <a href="sign-up" className="font-medium text-violet-600 hover:underline">{t("signUp")}</a>
        </p>
      </div>
    </div>
  );
}
