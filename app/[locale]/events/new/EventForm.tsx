"use client";
import { useState } from "react";
import { createEvent } from "@/app/actions/events";
import { useRouter } from "next/navigation";

export default function EventForm({ families }: { families: { id: string; name: string }[] }) {
  const [familyId, setFamilyId] = useState(families[0]?.id ?? "");
  const [type, setType] = useState("other");
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
      router.push("../calendar");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed");
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">New event</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <select value={familyId} onChange={(e) => setFamilyId(e.target.value)} className="w-full rounded border p-2">
          {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded border p-2">
          {["parenting_period","handover","parent_trip","business_trip","school_holiday","child_appointment","school_event","activity","birthday","other"].map(t=> <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" required className="w-full rounded border p-2" />
        <input value={start} onChange={(e)=>setStart(e.target.value)} type="datetime-local" required className="w-full rounded border p-2" />
        <input value={end} onChange={(e)=>setEnd(e.target.value)} type="datetime-local" required className="w-full rounded border p-2" />
        <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Notes" className="w-full rounded border p-2" />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="rounded bg-blue-600 px-3 py-2 text-white">Create</button>
      </form>
    </main>
  );
}
