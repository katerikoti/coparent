"use client";
import { useState } from "react";
import { respondToRequest } from "@/app/actions/requests";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function RequestActions({ requestId }: { requestId: string }) {
  const t = useTranslations("requests");
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(action: "approve" | "decline") {
    setLoading(action);
    setError(null);
    try {
      await respondToRequest({ requestId, action });
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? t("respondFailed"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        onClick={() => respond("approve")}
        disabled={!!loading}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {t("accept")}
      </button>
      <button
        onClick={() => respond("decline")}
        disabled={!!loading}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
      >
        {t("decline")}
      </button>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
