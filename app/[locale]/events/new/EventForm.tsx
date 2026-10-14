"use client";
import { useState } from "react";
import { createEvent } from "@/app/actions/events";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { EVENT_TYPES } from "@/lib/eventTypes";

export default function EventForm({ families }: { families: { id: string; name: string }[] }) {
  const t = useTranslations("events");
  const locale = useLocale();
  const [familyId, setFamilyId] = useState(families[0]?.id ?? "");
  const [type, setType] = useState<string>(EVENT_TYPES[0]);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const input = "mt-1 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-violet-500";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return;
    if (new Date(end) <= new Date(start)) {
      setError(t("endBeforeStart"));
      return;
    }
    setLoading(true);
    try {
      await createEvent({
        familyId,
        type,
        title,
        startAt: new Date(start).toISOString(),
        endAt: new Date(end).toISOString(),
        notes,
      });
      window.location.href = `/${locale}/events`;
    } catch (err: any) {
      setError(err?.message ?? t("failed"));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="../events" className="text-sm font-medium text-violet-600 hover:underline">
        ← {t("back")}
      </Link>
      <div className="mt-3 rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{t("formTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("formSubtitle")}</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">{t("typeLabel")}</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={input}>
              {EVENT_TYPES.map((tt) => (
                <option key={tt} value={tt}>{t(`types.${tt}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{t("nameLabel")}</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("titlePlaceholder")} required className={input} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">{t("startLabel")}</label>
              <input value={start} onChange={(e) => setStart(e.target.value)} type="datetime-local" required className={input} />
              {start && <p className="mt-1 text-xs text-slate-400">{formatDateTime(new Date(start))}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t("endLabel")}</label>
              <input value={end} onChange={(e) => setEnd(e.target.value)} type="datetime-local" required className={input} />
              {end && <p className="mt-1 text-xs text-slate-400">{formatDateTime(new Date(end))}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{t("notesLabel")}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notesPlaceholder")} className={`${input} min-h-[100px]`} />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button disabled={loading} className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-5 font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
            {loading ? t("saving") : t("create")}
          </button>
        </form>
      </div>
    </div>
  );
}
