"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { acceptInvitation } from "@/app/actions/families";

export default function AcceptInvitationPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("invite");
  const token = sp.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function accept() {
    setLoading(true);
    setError(null);
    try {
      await acceptInvitation(token);
      router.push(`/${locale}/dashboard`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? t("failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold text-slate-900">{t("acceptTitle")}</h1>
      <p className="mt-2 text-slate-600">{token ? t("tokenProvided") : t("tokenMissing")}</p>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      <button
        onClick={accept}
        disabled={loading || !token}
        className="mt-4 inline-flex h-12 items-center justify-center rounded-md bg-violet-600 px-5 font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {loading ? "..." : t("accept")}
      </button>
    </main>
  );
}
