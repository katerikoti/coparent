import { getSession } from "@/lib/session";
import { getMyFamilies } from "@/app/actions/families";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("../auth/sign-in");
  const families = await getMyFamilies();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
      <p className="text-slate-500">Family and schedule configuration.</p>
      {families.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm text-slate-500">No family yet.</div>
      ) : (
        families.map((f) => (
          <section key={f.id} className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{f.name}</h2>
                <p className="text-sm text-slate-500">{f.timeZone}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{f.role}</span>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Schedule configuration for this family. The default recurring schedule is every other week,
              Wednesday 16:00 to Monday 08:00. You can extend this with the recurring-rule settings flow.
            </div>
          </section>
        ))
      )}
    </div>
  );
}
