import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { familyMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export async function requireFamilyMember(familyId: string) {
  const user = await requireUser();
  const db = getDb();
  const membership = await db
    .select()
    .from(familyMembers)
    .where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.userId, user.id), eq(familyMembers.status, "active")))
    .limit(1);
  if (membership.length === 0) throw new Error("Forbidden");
  return { user, membership: membership[0] };
}
