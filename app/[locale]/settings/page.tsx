import { getSession } from "@/lib/session";
import { getMyFamilies } from "@/app/actions/families";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";
import PrimaryParentPicker from "./PrimaryParentPicker";
import { getParentPair } from "@/lib/familySchedule";
import { getDb } from "@/lib/db";
import { familyMembers, user as userTable } from "@/db/schema";
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
          const memberships = await db.select().from(familyMembers).where(eq(familyMembers.familyId, f.id));
          const members: { id: string; name: string }[] = [];
          for (const m of memberships) {
            const [u] = await db.select().from(userTable).where(eq(userTable.id, m.userId));
            members.push({ id: m.userId, name: u?.name ?? "Parent" });
          }
          const pair = await getParentPair(f.id);
          const primary = members.find((m) => m.id === pair.parentAId) ?? members[0];
          const other = members.find((m) => m.id !== primary?.id) ?? null;
          const isPrimaryViewer = session.user.id === pair.parentAId;

          return (
            <section key={f.id} className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">{f.name}</h2>
                <p className="text-sm text-slate-500">{f.timeZone}</p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <PrimaryParentPicker
                  familyId={f.id}
                  members={members}
                  currentPrimaryId={pair.parentAId ?? null}
                />
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                  {isPrimaryViewer
                    ? `Recurring period for ${other?.name ?? "the other parent"}`
                    : "Your recurring period"}
                </h2>
                <p className="mb-4 text-sm text-slate-500">
                  {isPrimaryViewer
                    ? `The children are with you by default. This configures when ${other?.name ?? "the other parent"} has them.`
                    : `This configures when you have the children. The rest of the time they are with ${primary?.name ?? "the primary parent"}.`}
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
