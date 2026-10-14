import { getSession } from "@/lib/session";
import { getMyFamilies } from "@/app/actions/families";
import { listEvents } from "@/app/actions/events";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function CalendarPage() {
  const session = await getSession();
  if (!session?.user) redirect("../auth/sign-in");
  const families = await getMyFamilies();
  if (families.length === 0) redirect("../dashboard");
  const t = await getTranslations("calendar");
  const nav = await getTranslations("nav");

  const eventsByFamily = await Promise.all(
    families.map(async (f) => ({ family: f, events: await listEvents(f.id) })),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-slate-900">{t("title")}</h1>
        <Link
          href="../events/new"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {t("newEvent")}
        </Link>
      </div>

      {eventsByFamily.map(({ family, events }) => (
        <section key={family.id} className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">{family.name}</h2>
          {events.length === 0 ? (
            <p className="text-slate-500">No events yet.</p>
          ) : (
            <div className="space-y-3">
              {events.map((e) => (
                <article
                  key={e.id}
                  className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-semibold text-slate-900">{e.title}</h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {e.type}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {new Date(e.startAt).toLocaleString()} → {new Date(e.endAt).toLocaleString()}
                  </p>
                  {e.location && <p className="mt-1 text-sm text-slate-500">{e.location}</p>}
                  {e.notes && <p className="mt-1 text-sm text-slate-700">{e.notes}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
