"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { acceptInvitation } from "@/app/actions/families";

export default function AcceptInvitationPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function accept() {
    setLoading(true);
    setError(null);
    try {
      const r = await acceptInvitation(token);
      router.push(`/fi/dashboard`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Accept invitation</h1>
      <p className="mt-2 text-slate-600">Token: {token ? "provided" : "missing"}</p>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      <button onClick={accept} disabled={loading || !token} className="mt-4 rounded bg-blue-600 px-3 py-2 text-white">
        {loading ? "..." : "Accept"}
      </button>
    </main>
  );
}
