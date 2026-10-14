"use client";
import { useState } from "react";
import { createEvent } from "@/app/actions/events";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";

export default function EventForm({ families }: { families: { id: string; name: string }[] }) {
  const t = useTranslations("events");
  const [familyId, setFamilyId] = useState(families[0]?.id ?? "");
  const [type, setType] = useState("other");
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const input = "mt-1 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-violet-500";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createEvent({
        familyId,
        type,
        title,
        startAt: new Date(start).toISOString(),
        endAt: new Date(end).toISOString(),
        notes,
      });
      router.push("../events");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed");
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
          <select value={familyId} onChange={(e) => setFamilyId(e.target.value)} className={input}>
            {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className={input}>
            {["parenting_period","handover","parent_trip","business_trip","school_holiday","child_appointment","school_event","activity","birthday","other"].map(t2=> <option key={t2} value={t2}>{t2.replace(/_/g, " ")}</option>)}
          </select>
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder={t("titlePlaceholder")} required className={input} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <input value={start} onChange={(e)=>setStart(e.target.value)} type="datetime-local" required className={input} />
              {start && <p className="mt-1 text-xs text-slate-400">{formatDateTime(new Date(start))}</p>}
            </div>
            <div>
              <input value={end} onChange={(e)=>setEnd(e.target.value)} type="datetime-local" required className={input} />
              {end && <p className="mt-1 text-xs text-slate-400">{formatDateTime(new Date(end))}</p>}
            </div>
          </div>
          <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder={t("notesPlaceholder")} className={`${input} min-h-[100px]`} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-5 font-semibold text-white hover:bg-violet-700">
            {t("create")}
          </button>
        </form>
      </div>
    </div>
  );
}
