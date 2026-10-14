"use client";
import { useState } from "react";
import { createChangeRequest } from "@/app/actions/requests";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";

export default function RequestForm({ families }: { families: { id: string; name: string }[] }) {
  const t = useTranslations("requests");
  const locale = useLocale();
  const [familyId, setFamilyId] = useState(families[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const input = "mt-1 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-violet-500";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!reason.trim()) {
      setError(t("reasonRequired"));
      return;
    }
    if (new Date(end) <= new Date(start)) {
      setError(t("endBeforeStart"));
      return;
    }
    setLoading(true);
    try {
      await createChangeRequest({
        familyId,
        category: "exception",
        reason,
        proposedStartAt: new Date(start).toISOString(),
        proposedEndAt: new Date(end).toISOString(),
      });
      window.location.href = `/${locale}/requests`;
    } catch (err: any) {
      setError(err?.message ?? t("failed"));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="../requests" className="text-sm font-medium text-violet-600 hover:underline">
        ← {t("back")}
      </Link>
      <div className="mt-3 rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{t("formTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("formSubtitle")}</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <select value={familyId} onChange={(e) => setFamilyId(e.target.value)} className={input}>
            {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <div>
            <label className="block text-sm font-medium text-slate-700">{t("whatRequesting")}</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("whatPlaceholder")} required className={`${input} min-h-[100px]`} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">{t("proposedStart")}</label>
              <input value={start} onChange={(e) => setStart(e.target.value)} type="datetime-local" required className={input} />
              {start && <p className="mt-1 text-xs text-slate-400">{formatDateTime(new Date(start))}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t("proposedEnd")}</label>
              <input value={end} onChange={(e) => setEnd(e.target.value)} type="datetime-local" required className={input} />
              {end && <p className="mt-1 text-xs text-slate-400">{formatDateTime(new Date(end))}</p>}
            </div>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button disabled={loading} className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-5 font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
            {loading ? t("sending") : t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
