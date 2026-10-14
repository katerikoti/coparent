import { getSession } from "@/lib/session";
import { getMyFamilies } from "@/app/actions/families";
import { listChangeRequests } from "@/app/actions/requests";
import { redirect } from "next/navigation";

export default async function RequestsPage() {
  const session = await getSession();
  if (!session?.user) redirect("../auth/sign-in");
  const families = await getMyFamilies();
  if (families.length === 0) redirect("../dashboard");

  const all = await Promise.all(families.map(async (f) => ({ family: f, requests: await listChangeRequests(f.id) })));
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Change requests</h1>
      {all.map(({ family, requests }) => (
        <section key={family.id} className="mt-6">
          <h2 className="text-lg font-semibold">{family.name}</h2>
          {requests.length === 0 && <p className="text-slate-500">No requests</p>}
          <ul className="mt-2 space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="rounded border bg-white p-3">
                <div className="font-medium">{r.category} — {r.status}</div>
                <div className="text-sm text-slate-600">{r.reason}</div>
                <div className="text-xs text-slate-400">{r.createdAt.toISOString()}</div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
