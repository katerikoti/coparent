"use client";
import { useState } from "react";
import { createEvent, updateEvent } from "@/app/actions/events";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { EVENT_TYPES } from "@/lib/eventTypes";
import { dateTimeTextToIso, parseDateTimeText } from "@/lib/dateInput";
import DateField from "@/components/DateField";

type EditableEvent = {
  id: string;
  familyId: string;
  type: string;
  title: string;
  startAt: string | Date;
  endAt: string | Date;
  notes?: string | null;
};

export default function EventForm({
  families,
  event,
}: {
  families: { id: string; name: string }[];
  event?: EditableEvent;
}) {
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isEdit = !!event;
  const [familyId, setFamilyId] = useState(event?.familyId ?? families[0]?.id ?? "");
  const [type, setType] = useState<string>(event?.type ?? EVENT_TYPES[0]);
  const [title, setTitle] = useState(event?.title ?? "");
  const [start, setStart] = useState(event ? formatDateTime(new Date(event.startAt)) : "");
  const [end, setEnd] = useState(event ? formatDateTime(new Date(event.endAt)) : "");
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const input = "mt-1 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-violet-500";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return;
    const startDate = parseDateTimeText(start);
    const endDate = parseDateTimeText(end);
    if (!startDate || !endDate) {
      setError(tc("invalidDateTime"));
      return;
    }
    if (endDate <= startDate) {
      setError(t("endBeforeStart"));
      return;
    }
    setLoading(true);
    try {
      const payload = {
        familyId,
        type,
        title,
        startAt: dateTimeTextToIso(start),
        endAt: dateTimeTextToIso(end),
        notes,
      };
      if (isEdit) await updateEvent({ ...payload, id: event!.id });
      else await createEvent(payload);
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
        <h1 className="text-2xl font-bold text-slate-900">{isEdit ? t("editTitle") : t("formTitle")}</h1>
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
              <DateField mode="datetime" value={start} onChange={setStart} placeholder={tc("dateTimePlaceholder")} className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t("endLabel")}</label>
              <DateField mode="datetime" value={end} onChange={setEnd} placeholder={tc("dateTimePlaceholder")} className={input} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{t("notesLabel")}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notesPlaceholder")} className={`${input} min-h-[100px]`} />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button disabled={loading} className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-5 font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
            {loading ? t("saving") : isEdit ? t("saveEdit") : t("create")}
          </button>
        </form>
      </div>
    </div>
  );
}
