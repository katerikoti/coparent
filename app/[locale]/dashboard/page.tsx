import { getSession } from "@/lib/session";
import { getMyFamilies } from "@/app/actions/families";
import { generateFamilyPeriods, nextHandover } from "@/lib/familySchedule";
import { listChangeRequests } from "@/app/actions/requests";
import { getBalanceSummary } from "@/app/actions/balance";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import MonthCalendar, { parentColors } from "@/components/MonthCalendar";
import { formatDateTime, formatDays } from "@/lib/format";
import { user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { startOfMonth, endOfMonth } from "date-fns";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect("../auth/sign-in");
  const families = await getMyFamilies();
  const t = await getTranslations("dashboard");
  const calendarT = await getTranslations("calendar");
  const nav = await getTranslations("nav");
  const locale = await getLocale();

  if (families.length === 0) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">{t("title")}</h1>
          <p className="mt-2 text-slate-600">{t("noFamily")}</p>
          <form action={async () => { "use server"; const { createFamily } = await import("@/app/actions/families"); await createFamily("My Family"); }} className="mt-6">
            <button className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700">
              {t("createFamily")}
            </button>
          </form>
        </section>
      </div>
    );
  }

  const now = new Date();
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const weekdays = calendarT.raw("weekdays") as string[];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-slate-900">{t("title")}</h1>
        <p className="mt-1 text-slate-500">{session.user.email}</p>
      </section>

      {await Promise.all(families.map(async (f) => {
        const periods = await generateFamilyPeriods(f.id, from, to);
        const { listEvents } = await import("@/app/actions/events");
        const events = await listEvents(f.id);
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const monthPeriods = await generateFamilyPeriods(f.id, monthStart, monthEnd);
        const members = await (await import("@/lib/familySchedule")).getParentPair(f.id);
        const db = getDb();
        const parents = [] as { id: string; name: string }[];
        for (const id of [members.parentAId, members.parentBId]) {
          if (!id) continue;
          const [u] = await db.select().from(userTable).where(eq(userTable.id, id));
          parents.push({ id, name: u?.name ?? "Parent" });
        }
        if (!members.parentBId) {
          parents.push({ id: "__other__", name: t("otherParentName") });
        }
        const current = periods.find((p) => p.startAt <= now && p.endAt > now);
        const nh = nextHandover(periods, now);
        const pending = await listChangeRequests(f.id, "pending");
        const balance = await getBalanceSummary(f.id);
        const withYou = current?.responsibleUserId === session.user.id;
        const currentParent = current ? parents.find((p) => p.id === current.responsibleUserId) : null;
        const currentParentName = currentParent?.name ?? t("otherParentName");
        return (
          <section key={f.id} className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">{f.name}</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{f.timeZone}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className={`rounded-xl p-4 ${withYou ? "bg-violet-50" : "bg-emerald-50"}`}>
                <p className="text-sm font-medium text-slate-500">{t("currentStatus")}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {current ? (withYou ? t("withYou") : t("withParentNamed", { name: currentParentName })) : t("noCurrentPeriod")}
                </p>
                {nh && <p className="mt-2 text-sm text-slate-600">{t("nextHandover", { date: formatDateTime(nh) })}</p>}
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">{t("balanceTitle")}</p>
                <p
                  className={`mt-1 text-lg font-semibold ${
                    balance.viewingUserHalfDays > 0
                      ? "text-violet-600"
                      : balance.viewingUserHalfDays < 0
                      ? "text-rose-600"
                      : "text-slate-900"
                  }`}
                >
                  {formatDays(balance.viewingUserHalfDays, locale)} {t("balanceUnit")}
                </p>
                <Link href="../balance" className="mt-2 inline-block text-sm text-violet-600 underline">
                  {t("balanceDetails")}
                </Link>
              </div>
            </div>

            {pending.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-amber-800">{t("pendingRequests", { count: pending.length })}</p>
                <Link href="../requests" className="mt-1 inline-block text-sm text-amber-900 underline">
                  {nav("requests")}
                </Link>
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link href="../events/new" className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-medium hover:bg-slate-50">
                {t("addEvent")}
              </Link>
              <Link href="../requests" className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-medium hover:bg-slate-50">
                {t("requestsShort")}
              </Link>
            </div>

            <div className="mt-5">
              <h3 className="mb-2 text-lg font-semibold text-slate-900">{t("calendarTitle")}</h3>
              <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-600">
                {parents.map((p, i) => (
                  <span key={p.id} className="inline-flex items-center gap-1">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: parentColors[i % parentColors.length] }} />
                    {p.name}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-amber-100" />
                  {t("eventLabel")}
                </span>
              </div>
              <MonthCalendar month={now} periods={monthPeriods} events={events.map((e:any)=>({...e}))} parents={parents} weekdays={weekdays} />
            </div>
          </section>
        );
      }))}
    </div>
  );
}
