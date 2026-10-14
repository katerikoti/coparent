import { getSession } from "@/lib/session";
import { getMyFamilies } from "@/app/actions/families";
import { listChangeRequests } from "@/app/actions/requests";
import { redirect } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { familyMembers, user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import RequestActions from "./RequestActions";

const statusClasses: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  declined: "bg-rose-100 text-rose-800",
  counterproposed: "bg-violet-100 text-violet-800",
  withdrawn: "bg-slate-100 text-slate-700",
};

export default async function RequestsPage() {
  const session = await getSession();
  if (!session?.user) redirect("../auth/sign-in");
  const families = await getMyFamilies();
  if (families.length === 0) redirect("../dashboard");
  const t = await getTranslations("requests");

  const statusLabels: Record<string, string> = {
    pending: t("status.pending"),
    approved: t("status.approved"),
    declined: t("status.declined"),
    counterproposed: t("status.counterproposed"),
    withdrawn: t("status.withdrawn"),
  };
  const categoryLabels: Record<string, string> = {
    compensable: t("category.compensable"),
    exception: t("category.exception"),
    permanent: t("category.permanent"),
  };

  const all = await Promise.all(
    families.map(async (f) => {
      const db = getDb();
      const memberships = await db.select().from(familyMembers).where(eq(familyMembers.familyId, f.id));
      const nameById = new Map<string, string>();
      for (const m of memberships) {
        const [u] = await db.select().from(userTable).where(eq(userTable.id, m.userId));
        nameById.set(m.userId, u?.name ?? "Parent");
      }
      const requests = await listChangeRequests(f.id);
      requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { family: f, requests, nameById };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-slate-900">{t("title")}</h1>
        <Link
          href="../requests/new"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700"
        >
          {t("newRequest")}
        </Link>
      </div>

      {all.map(({ family, requests, nameById }) => (
        <section key={family.id} className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">{family.name}</h2>
          {requests.length === 0 ? (
            <p className="text-slate-500">{t("noRequests")}</p>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => {
                const isRequester = r.requesterUserId === session.user.id;
                const requesterName = nameById.get(r.requesterUserId) ?? "—";
                return (
                  <article key={r.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[r.status] ?? "bg-slate-100"}`}>
                        {statusLabels[r.status] ?? r.status}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        {categoryLabels[r.category] ?? r.category}
                      </span>
                      <span className="text-xs text-slate-500">{formatDateTime(new Date(r.createdAt))}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {t("requestedBy", { name: requesterName })}
                    </p>
                    {r.reason && <p className="mt-1 font-medium text-slate-900">{r.reason}</p>}
                    {(r.originalStartAt || r.proposedStartAt) && (
                      <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                        {r.originalStartAt && (
                          <div className="rounded bg-slate-50 p-2">
                            {t("originalPeriod")}: {formatDateTime(new Date(r.originalStartAt))} → {formatDateTime(new Date(r.originalEndAt!))}
                          </div>
                        )}
                        {r.proposedStartAt && (
                          <div className="rounded bg-slate-50 p-2">
                            {t("proposedPeriod")}: {formatDateTime(new Date(r.proposedStartAt))} → {formatDateTime(new Date(r.proposedEndAt!))}
                          </div>
                        )}
                      </div>
                    )}
                    {r.status === "pending" && !isRequester && <RequestActions requestId={r.id} />}
                    {r.status === "pending" && isRequester && (
                      <p className="mt-3 text-sm text-amber-700">{t("awaiting")}</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
