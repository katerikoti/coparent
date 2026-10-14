import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

export default async function Home() {
  const locale = await getLocale();
  const session = await getSession();
  if (session?.user) redirect(`/${locale}/dashboard`);
  redirect(`/${locale}/auth/sign-in`);
}
