import { getSession } from "@/lib/session";
import { getMyFamilies } from "@/app/actions/families";
import { generateFamilyPeriods, nextHandover, getParentPair } from "@/lib/familySchedule";
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
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-4">{t("noFamily")}</p>
        <form action={async () => { "use server"; const { createFamily } = await import("@/app/actions/families"); await createFamily("My Family"); }}>
          <button className="mt-3 rounded bg-blue-600 px-3 py-2 text-white">{t("createFamily")}</button>
        </form>
      </main>
    );
  }

  const now = new Date();
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-slate-600">{session.user.email}</p>
      {await Promise.all(families.map(async (f) => {
        const periods = await generateFamilyPeriods(f.id, from, to);
        const current = periods.find((p) => p.startAt <= now && p.endAt > now);
        const nh = nextHandover(periods, now);
        const pending = await listChangeRequests(f.id, "pending");
        const withYou = current?.responsibleUserId === session.user.id;
        return (
          <section key={f.id} className="mt-6 rounded border bg-white p-4">
            <h2 className="text-lg font-semibold">{f.name}</h2>
            <p className="mt-2 font-medium">{current ? (withYou ? t("withYou") : t("withOther")) : ""}</p>
            {nh && <p className="text-sm text-slate-600">{t("nextHandover", { date: nh.toLocaleString() })}</p>}
            <div className="mt-3"><InviteButton familyId={f.id} /></div>
            {pending.length > 0 && (
              <div className="mt-3 rounded bg-amber-50 p-3">
                <p className="font-medium text-amber-800">{t("pendingRequests", { count: pending.length })}</p>
                <Link href="../requests" className="text-sm text-amber-900 underline">{nav("requests")}</Link>
              </div>
            )}
            <div className="mt-3 flex gap-3 text-sm">
              <Link href="../calendar" className="text-blue-600">{nav("calendar")}</Link>
              <Link href="../events/new" className="text-blue-600">{t("createFamily") === "Luo perhe" ? "Lisää tapahtuma" : "Add event"}</Link>
            </div>
          </section>
        );
      }))}
    </main>
  );
}
