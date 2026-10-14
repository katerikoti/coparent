import { getSession } from "@/lib/session";
import { getMyFamilies } from "@/app/actions/families";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("../auth/sign-in");
  const families = await getMyFamilies();
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-2 text-slate-600">Family and schedule configuration.</p>
      {families.length === 0 && <p>No family.</p>}
      {families.map((f) => (
        <section key={f.id} className="mt-4 rounded border bg-white p-4">
          <div className="font-semibold">{f.name}</div>
          <div className="text-sm text-slate-500">{f.timeZone}</div>
        </section>
      ))}
    </main>
  );
}
