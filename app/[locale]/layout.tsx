import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import "../globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function LocaleLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <NextIntlClientProvider messages={messages}><ServiceWorkerRegister />{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
