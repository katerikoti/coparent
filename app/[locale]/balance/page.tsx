import { getSession } from "@/lib/session";
import { getMyFamilies } from "@/app/actions/families";
import { getBalanceSummary } from "@/app/actions/balance";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { formatDays, formatDate } from "@/lib/format";

export default async function BalancePage() {
  const session = await getSession();
  if (!session?.user) redirect("../auth/sign-in");
  const families = await getMyFamilies();
  if (families.length === 0) redirect("../dashboard");
  const t = await getTranslations("dashboard");
  const nav = await getTranslations("nav");
  const locale = await getLocale();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">{nav("balance")}</h1>
      {await Promise.all(families.map(async (f) => {
        const s = await getBalanceSummary(f.id);
        const positive = s.viewingUserHalfDays > 0;
        const negative = s.viewingUserHalfDays < 0;
        return (
          <section key={f.id} className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{f.name}</h2>
            </div>
            <p className={`text-5xl font-bold ${positive ? "text-violet-600" : negative ? "text-rose-600" : "text-slate-900"}`}>
              {formatDays(s.viewingUserHalfDays, locale)}
              <span className="ml-2 text-2xl font-semibold">{t("balanceUnit")}</span>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {positive ? t("balancePositive") : negative ? t("balanceNegative") : t("balanceZero")}
            </p>

            <h3 className="mt-6 font-semibold text-slate-900">{t("balanceDetails")}</h3>
            <div className="mt-3 space-y-2">
              {s.entries.length === 0 ? (
                <p className="text-slate-500">{t("balanceZero")}</p>
              ) : (
                s.entries.map((e) => (
                  <div key={e.id} className="flex flex-col rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{e.reason}</p>
                      <p className="text-xs text-slate-500">{formatDate(new Date(e.effectiveDate))}</p>
                    </div>
                    <span className={`mt-2 font-semibold sm:mt-0 ${e.amountHalfDays > 0 ? "text-violet-600" : "text-rose-600"}`}>
                      {formatDays(e.amountHalfDays, locale)} {t("balanceUnit")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        );
      }))}
    </div>
  );
}
