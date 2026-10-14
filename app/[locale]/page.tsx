import { useTranslations } from "next-intl";
import Link from "next/link";

export default function Home() {
  const t = useTranslations("app");
  const n = useTranslations("nav");
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold">{t("name")}</h1>
      <p className="mt-2 text-slate-600">Shared parenting calendar.</p>
      <nav className="mt-6 flex gap-4">
        <Link href="/fi/auth/sign-in" className="rounded bg-blue-600 px-3 py-2 text-white">{ "Kirjaudu" }</Link>
        <Link href="/en/auth/sign-in" className="rounded border px-3 py-2">Sign in (EN)</Link>
      </nav>
    </main>
  );
}
