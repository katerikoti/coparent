"use client";

import { useState } from "react";
import { createRecurringRule } from "@/app/actions/schedule";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/format";
import { dateTextToYmd, parseTimeText, ymdToDateText } from "@/lib/dateInput";
import DateField from "@/components/DateField";

export default function SettingsForm({ familyId, timeZone }: { familyId: string; timeZone: string; }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const weekdayLabels = t.raw("weekdays") as string[];
  const [intervalWeeks, setIntervalWeeks] = useState(2);
  const [referenceDate, setReferenceDate] = useState(ymdToDateText("2026-01-05"));
  const [parentBStartWeekday, setParentBStartWeekday] = useState(3);
  const [parentBStartTime, setParentBStartTime] = useState("16:00");
  const [parentBEndWeekday, setParentBEndWeekday] = useState(1);
  const [parentBEndTime, setParentBEndTime] = useState("08:00");
  const [effectiveStart, setEffectiveStart] = useState(formatDate(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const input = "mt-1 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-violet-500";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const referenceDateYmd = dateTextToYmd(referenceDate);
    const effectiveStartYmd = dateTextToYmd(effectiveStart);
    const startTime = parseTimeText(parentBStartTime);
    const endTime = parseTimeText(parentBEndTime);
    if (!referenceDateYmd || !effectiveStartYmd || !startTime || !endTime) {
      setError(tc("invalidDateTime"));
      return;
    }
    setLoading(true);
    try {
      await createRecurringRule({
        familyId,
        timeZone,
        intervalWeeks,
        referenceDate: referenceDateYmd,
        parentBStartWeekday,
        parentBStartTime: startTime,
        parentBEndWeekday,
        parentBEndTime: endTime,
        effectiveStart: effectiveStartYmd,
      });
      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? t("failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">{t("interval")}</label>
        <input type="number" min={1} max={8} value={intervalWeeks} onChange={(e) => setIntervalWeeks(Number(e.target.value))} className={input} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">{t("referenceWeek")}</label>
        <DateField mode="date" value={referenceDate} onChange={setReferenceDate} placeholder={tc("datePlaceholder")} className={input} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("periodStartWeekday")}</label>
          <select value={parentBStartWeekday} onChange={(e) => setParentBStartWeekday(Number(e.target.value))} className={input}>
            {weekdayLabels.map((label, value) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("startTime")}</label>
          <DateField mode="time" value={parentBStartTime} onChange={setParentBStartTime} placeholder={tc("timePlaceholder")} className={input} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("periodEndWeekday")}</label>
          <select value={parentBEndWeekday} onChange={(e) => setParentBEndWeekday(Number(e.target.value))} className={input}>
            {weekdayLabels.map((label, value) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("endTime")}</label>
          <DateField mode="time" value={parentBEndTime} onChange={setParentBEndTime} placeholder={tc("timePlaceholder")} className={input} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">{t("effectiveFrom")}</label>
        <DateField mode="date" value={effectiveStart} onChange={setEffectiveStart} placeholder={tc("datePlaceholder")} className={input} />
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{t("saved")}</p>}
      <button disabled={loading} className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
        {loading ? "..." : t("save")}
      </button>
    </form>
  );
}
