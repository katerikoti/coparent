"use client";

import { useState } from "react";
import { createRecurringRule } from "@/app/actions/schedule";
import { useRouter } from "next/navigation";

const weekdays = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function SettingsForm({ familyId, timeZone }: { familyId: string; timeZone: string }) {
  const [intervalWeeks, setIntervalWeeks] = useState(2);
  const [referenceDate, setReferenceDate] = useState("2026-01-05");
  const [parentBStartWeekday, setParentBStartWeekday] = useState(3);
  const [parentBStartTime, setParentBStartTime] = useState("16:00");
  const [parentBEndWeekday, setParentBEndWeekday] = useState(1);
  const [parentBEndTime, setParentBEndTime] = useState("08:00");
  const [effectiveStart, setEffectiveStart] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const input = "mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-indigo-500";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await createRecurringRule({
        familyId,
        timeZone,
        intervalWeeks,
        referenceDate,
        parentBStartWeekday,
        parentBStartTime,
        parentBEndWeekday,
        parentBEndTime,
        effectiveStart,
      });
      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Interval (weeks)</label>
        <input type="number" min={1} max={8} value={intervalWeeks} onChange={(e) => setIntervalWeeks(Number(e.target.value))} className={input} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Reference date (a starting week)</label>
        <input type="date" value={referenceDate} onChange={(e) => setReferenceDate(e.target.value)} className={input} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Other parent starts on</label>
          <select value={parentBStartWeekday} onChange={(e) => setParentBStartWeekday(Number(e.target.value))} className={input}>
            {weekdays.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Start time</label>
          <input type="time" value={parentBStartTime} onChange={(e) => setParentBStartTime(e.target.value)} className={input} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Other parent ends on</label>
          <select value={parentBEndWeekday} onChange={(e) => setParentBEndWeekday(Number(e.target.value))} className={input}>
            {weekdays.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">End time</label>
          <input type="time" value={parentBEndTime} onChange={(e) => setParentBEndTime(e.target.value)} className={input} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Effective start date</label>
        <input type="date" value={effectiveStart} onChange={(e) => setEffectiveStart(e.target.value)} className={input} />
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">Schedule updated. Future parenting periods will use this rule.</p>}
      <button disabled={loading} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
        {loading ? "..." : "Save recurring schedule"}
      </button>
    </form>
  );
}
