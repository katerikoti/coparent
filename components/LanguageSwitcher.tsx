"use client";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { updateUserLocale } from "@/app/actions/locale";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  async function switchTo(next: "fi" | "en") {
    await updateUserLocale(next).catch(() => {});
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`;
    const newPath = pathname.replace(/^\/(fi|en)/, `/${next}`);
    router.replace(newPath || `/${next}`);
    router.refresh();
  }
  return (
    <div className="flex gap-2 text-sm">
      <button onClick={() => switchTo("fi")} className={locale === "fi" ? "font-bold" : ""}>Suomi</button>
      <span>|</span>
      <button onClick={() => switchTo("en")} className={locale === "en" ? "font-bold" : ""}>English</button>
    </div>
  );
}
