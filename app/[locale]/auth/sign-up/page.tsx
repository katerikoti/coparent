"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const search = useSearchParams();
  const locale = search.get("locale") ?? "fi";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await authClient.signUp.email({ name, email, password });
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? "Sign up failed");
      return;
    }
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">{t("signUp")}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">{t("name")}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">{t("email")}</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">{t("password")}</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={8} className="mt-1 w-full rounded border p-2" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded bg-blue-600 px-3 py-2 text-white">{t("signUp")}</button>
      </form>
    </main>
  );
}
