"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

const links = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/events", key: "events" },
  { href: "/requests", key: "requests" },
  { href: "/settings", key: "settings" },
];

export default function AppHeader() {
  const locale = useLocale();
  const nav = useTranslations("nav");
  const auth = useTranslations("auth");
  const router = useRouter();
  const session = authClient.useSession();

  async function signOut() {
    await authClient.signOut();
    router.replace(`/${locale}/auth/sign-in`);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href={`/${locale}/dashboard`} className="text-lg font-bold text-violet-600">
            CoParent
          </Link>
          {session.data?.user && (
            <nav className="hidden items-center gap-4 md:flex">
              {links.map((l) => (
                <Link
                  key={l.key}
                  href={`/${locale}${l.href}`}
                  className="text-sm font-medium text-slate-600 hover:text-violet-600"
                >
                  {nav(l.key)}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {session.data?.user ? (
            <button
              onClick={signOut}
              className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-sm hover:bg-slate-50"
            >
              {nav("signOut")}
            </button>
          ) : (
            <Link href={`/${locale}/auth/sign-in`} className="inline-flex h-9 items-center rounded-lg bg-violet-600 px-3 text-sm text-white">
              {auth("signIn")}
            </Link>
          )}
        </div>
      </div>
      {session.data?.user && (
        <div className="border-t border-slate-100 px-4 py-2 md:hidden">
          <nav className="flex flex-wrap gap-3">
            {links.map((l) => (
              <Link key={l.key} href={`/${locale}${l.href}`} className="text-xs font-medium text-slate-600">
                {nav(l.key)}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
