import { getSession } from "@/lib/session";
import { getMyFamilies } from "@/app/actions/families";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";
import PrimaryParentPicker from "./PrimaryParentPicker";
import { getParentPair } from "@/lib/familySchedule";
import { getDb } from "@/lib/db";
import { familyMembers, user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import InviteButton from "@/components/InviteButton";
import AccountForm from "./AccountForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("../auth/sign-in");
  const families = await getMyFamilies();
  const db = getDb();
  const t = await getTranslations("settings");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t("title")}</h1>
        <p className="mt-1 text-slate-500">{t("subtitle")}</p>
      </div>

      <AccountForm email={session.user.email} />

      {families.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm text-slate-500">{t("noFamily")}</div>
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
          const hasOtherParent = members.length >= 2;

          return (
            <section key={f.id} className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">{f.name}</h2>
                <p className="text-sm text-slate-500">{f.timeZone}</p>
              </div>

              {!hasOtherParent && (
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">{t("inviteTitle")}</h2>
                  <p className="mt-1 mb-3 text-sm text-slate-500">{t("inviteHelp")}</p>
                  <InviteButton familyId={f.id} />
                </div>
              )}

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
                    ? t("recurringForOther", { name: other?.name ?? t("otherParentFallback") })
                    : t("recurringForYou")}
                </h2>
                <p className="mb-4 text-sm text-slate-500">
                  {isPrimaryViewer
                    ? t("recurringHelpPrimary", { name: other?.name ?? t("otherParentFallback") })
                    : t("recurringHelpOther", { name: primary?.name ?? t("otherParentFallback") })}
                </p>
                <SettingsForm familyId={f.id} timeZone={f.timeZone} />
              </div>
            </section>
          );
        }))
      )}
    </div>
  );
}
