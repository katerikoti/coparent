import { getSession } from "@/lib/session";
import { getMyFamilies } from "@/app/actions/families";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";
import { getParentPair } from "@/lib/familySchedule";
import { getDb } from "@/lib/db";
import { user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("../auth/sign-in");
  const families = await getMyFamilies();
  const db = getDb();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-slate-500">Family and recurring schedule configuration.</p>
      </div>

      {families.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm text-slate-500">No family yet.</div>
      ) : (
        await Promise.all(families.map(async (f) => {
          const pair = await getParentPair(f.id);
          const primary = pair.parentAId ? (await db.select().from(userTable).where(eq(userTable.id, pair.parentAId)))[0] : null;
          const other = pair.parentBId ? (await db.select().from(userTable).where(eq(userTable.id, pair.parentBId)))[0] : null;
          return (
            <section key={f.id} className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{f.name}</h2>
                    <p className="text-sm text-slate-500">{f.timeZone}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{f.role}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Recurring parenting schedule</h2>
                <p className="mb-4 text-sm text-slate-500">
                  This controls when {other?.name ?? "the other parent"} has the children. The other parent otherwise has all remaining time.
                </p>
                <SettingsForm
                  familyId={f.id}
                  timeZone={f.timeZone}
                  primaryParentName={primary?.name ?? "Primary parent"}
                  otherParentName={other?.name ?? "Other parent"}
                />
              </div>
            </section>
          );
        }))
      )}
    </div>
  );
}
