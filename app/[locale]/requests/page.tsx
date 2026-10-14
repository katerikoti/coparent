import { getSession } from "@/lib/session";
import { getMyFamilies } from "@/app/actions/families";
import { listChangeRequests } from "@/app/actions/requests";
import { redirect } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import { getTranslations } from "next-intl/server";

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
  const nav = await getTranslations("nav");

  const all = await Promise.all(families.map(async (f) => ({ family: f, requests: await listChangeRequests(f.id) })));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">{t("title")}</h1>
      {all.map(({ family, requests }) => (
        <section key={family.id} className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">{family.name}</h2>
          {requests.length === 0 ? (
            <p className="text-slate-500">{t("noRequests")}</p>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <article key={r.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[r.status] ?? "bg-slate-100"}`}>
                      {r.status}
                    </span>
                    <span className="text-xs text-slate-500">{formatDateTime(new Date(r.createdAt))}</span>
                  </div>
                  <p className="mt-2 font-medium text-slate-900">{r.category}</p>
                  {r.reason && <p className="mt-1 text-sm text-slate-600">{r.reason}</p>}
                  {(r.originalStartAt || r.proposedStartAt) && (
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      {r.originalStartAt && (
                        <div className="rounded bg-slate-50 p-2">
                          Original: {r.originalStartAt ? formatDateTime(new Date(r.originalStartAt)) : "—"} → {r.originalEndAt ? formatDateTime(new Date(r.originalEndAt)) : "—"}
                        </div>
                      )}
                      {r.proposedStartAt && (
                        <div className="rounded bg-slate-50 p-2">
                          Proposed: {r.proposedStartAt ? formatDateTime(new Date(r.proposedStartAt)) : "—"} → {r.proposedEndAt ? formatDateTime(new Date(r.proposedEndAt)) : "—"}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
