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
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">{t("signIn")}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">{t("email")}</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">{t("password")}</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 w-full rounded border p-2" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded bg-blue-600 px-3 py-2 text-white">{t("signIn")}</button>
      </form>
      <p className="mt-4 text-sm">
        <a href="sign-up" className="text-blue-600">{t("signUp")}</a>
      </p>
    </main>
  );
}
