"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

const links = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/calendar", key: "calendar" },
  { href: "/events/new", key: "events" },
  { href: "/requests", key: "requests" },
  { href: "/balance", key: "balance" },
  { href: "/settings", key: "settings" },
];

export default function AppHeader() {
  const locale = useLocale();
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
          <Link href={`/${locale}/dashboard`} className="text-lg font-bold text-indigo-600">
            CoParent
          </Link>
          {session.data?.user && (
            <nav className="hidden items-center gap-4 md:flex">
              {links.map((l) => (
                <Link
                  key={l.key}
                  href={`/${locale}${l.href}`}
                  className="text-sm font-medium text-slate-600 hover:text-indigo-600"
                >
                  {l.key.charAt(0).toUpperCase() + l.key.slice(1)}
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
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Sign out
            </button>
          ) : (
            <Link href={`/${locale}/auth/sign-in`} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white">
              Sign in
            </Link>
          )}
        </div>
      </div>
      {session.data?.user && (
        <div className="border-t border-slate-100 px-4 py-2 md:hidden">
          <nav className="flex flex-wrap gap-3">
            {links.map((l) => (
              <Link key={l.key} href={`/${locale}${l.href}`} className="text-xs font-medium text-slate-600">
                {l.key.charAt(0).toUpperCase() + l.key.slice(1)}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
