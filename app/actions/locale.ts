"use server";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function updateUserLocale(locale: "fi" | "en") {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  const db = getDb();
  await db.update(user).set({ locale, updatedAt: new Date() }).where(eq(user.id, session.user.id));
  return { ok: true };
}
