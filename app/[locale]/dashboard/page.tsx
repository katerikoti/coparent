import { getSession } from "@/lib/session";
import { getMyFamilies } from "@/app/actions/families";
import { generateFamilyPeriods, nextHandover } from "@/lib/familySchedule";
import { listChangeRequests } from "@/app/actions/requests";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import InviteButton from "./InviteButton";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect("../auth/sign-in");
  const families = await getMyFamilies();
  const t = await getTranslations("dashboard");
  const nav = await getTranslations("nav");

  if (families.length === 0) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">{t("title")}</h1>
          <p className="mt-2 text-slate-600">{t("noFamily")}</p>
          <form action={async () => { "use server"; const { createFamily } = await import("@/app/actions/families"); await createFamily("My Family"); }} className="mt-6">
            <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
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

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-slate-900">{t("title")}</h1>
        <p className="mt-1 text-slate-500">{session.user.email}</p>
      </section>

      {await Promise.all(families.map(async (f) => {
        const periods = await generateFamilyPeriods(f.id, from, to);
        const current = periods.find((p) => p.startAt <= now && p.endAt > now);
        const nh = nextHandover(periods, now);
        const pending = await listChangeRequests(f.id, "pending");
        const withYou = current?.responsibleUserId === session.user.id;
        return (
          <section key={f.id} className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">{f.name}</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{f.timeZone}</span>
            </div>

            <div className={`rounded-xl p-4 ${withYou ? "bg-indigo-50" : "bg-emerald-50"}`}>
              <p className="text-sm font-medium text-slate-500">Current parenting status</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {current ? (withYou ? t("withYou") : t("withOther")) : "No current period"}
              </p>
              {nh && <p className="mt-2 text-sm text-slate-600">{t("nextHandover", { date: nh.toLocaleString() })}</p>}
            </div>

            {pending.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-amber-800">{t("pendingRequests", { count: pending.length })}</p>
                <Link href="../requests" className="mt-1 inline-block text-sm text-amber-900 underline">
                  {nav("requests")}
                </Link>
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link href="../calendar" className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium hover:bg-slate-50">
                {nav("calendar")}
              </Link>
              <Link href="../events/new" className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium hover:bg-slate-50">
                Add event
              </Link>
              <Link href="../requests" className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium hover:bg-slate-50">
                {nav("requests")}
              </Link>
            </div>

            <div className="mt-5">
              <InviteButton familyId={f.id} />
            </div>
          </section>
        );
      }))}
    </div>
  );
}
