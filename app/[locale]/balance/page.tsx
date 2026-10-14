import { getSession } from "@/lib/session";
import { getMyFamilies } from "@/app/actions/families";
import { getBalanceSummary } from "@/app/actions/balance";
import { redirect } from "next/navigation";

export default async function BalancePage() {
  const session = await getSession();
  if (!session?.user) redirect("../auth/sign-in");
  const families = await getMyFamilies();
  if (families.length === 0) redirect("../dashboard");

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Time balance</h1>
      {await Promise.all(families.map(async (f) => {
        const s = await getBalanceSummary(f.id);
        return (
          <section key={f.id} className="mt-6 rounded border bg-white p-4">
            <h2 className="text-lg font-semibold">{f.name}</h2>
            <p className="mt-2 text-2xl font-bold">{s.viewingUserHalfDays} half-days</p>
            <p className="text-sm text-slate-600">
              {s.viewingUserHalfDays > 0 ? "You have more compensable parenting time than the baseline." : s.viewingUserHalfDays < 0 ? "You have less compensable parenting time than the baseline." : "No outstanding compensable difference."}
            </p>
            <h3 className="mt-4 font-semibold">Recent adjustments</h3>
            <ul className="mt-2 space-y-1">
              {s.entries.length === 0 && <li className="text-slate-500">None</li>}
              {s.entries.map((e) => (
                <li key={e.id} className="border-b py-1 text-sm">
                  <span className="font-medium">{e.amountHalfDays > 0 ? "+" : ""}{e.amountHalfDays} hd</span> — {e.reason} ({e.effectiveDate})
                </li>
              ))}
            </ul>
          </section>
        );
      }))}
    </main>
  );
}
