"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { acceptInvitation } from "@/app/actions/families";

export default function AcceptInvitationPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("invite");
  const token = sp.get("token") ?? "";
  const session = authClient.useSession();
  const userId = session.data?.user?.id ?? null;
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (session.isPending) return;
    if (!token) return;

    // Not signed in yet: send them to create an account, keeping the invite token.
    if (!userId) {
      router.replace(`/${locale}/auth/sign-up?token=${encodeURIComponent(token)}`);
      return;
    }

    if (started.current) return;
    started.current = true;
    setWorking(true);
    acceptInvitation(token)
      .then(() => router.replace(`/${locale}/dashboard`))
      .catch((e: any) => setError(e?.message ?? t("failed")))
      .finally(() => setWorking(false));
  }, [session.isPending, userId, token, locale, router]);

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold text-slate-900">{t("acceptTitle")}</h1>
      {!token && <p className="mt-2 text-sm text-rose-600">{t("tokenMissing")}</p>}
      {token && working && <p className="mt-2 text-slate-600">{t("joining")}</p>}
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </main>
  );
}
