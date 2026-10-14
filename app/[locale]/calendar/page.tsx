import { getSession } from "@/lib/session";
import { getMyFamilies } from "@/app/actions/families";
import { listEvents } from "@/app/actions/events";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CalendarPage() {
  const session = await getSession();
  if (!session?.user) redirect("../auth/sign-in");
  const families = await getMyFamilies();
  if (families.length === 0) redirect("../dashboard");

  const eventsByFamily = await Promise.all(
    families.map(async (f) => ({ family: f, events: await listEvents(f.id) })),
  );

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <Link href="../events/new" className="rounded bg-blue-600 px-3 py-2 text-white">New event</Link>
      </div>
      {eventsByFamily.map(({ family, events }) => (
        <section key={family.id} className="mt-6">
          <h2 className="text-lg font-semibold">{family.name}</h2>
          <ul className="mt-2 space-y-2">
            {events.length === 0 && <li className="text-slate-500">No events</li>}
            {events.map((e) => (
              <li key={e.id} className="rounded border bg-white p-3">
                <div className="font-medium">{e.title} <span className="text-xs text-slate-500">({e.type})</span></div>
                <div className="text-sm text-slate-600">{e.startAt.toISOString()} → {e.endAt.toISOString()}</div>
                {e.notes && <div className="text-sm">{e.notes}</div>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
