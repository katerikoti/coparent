"use server";

import { headers } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { families, familyMembers, invitations } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export async function createFamily(name: string) {
  const user = await requireSession();
  const db = getDb();
  const [family] = await db.insert(families).values({ name }).returning();
  await db.insert(familyMembers).values({
    familyId: family.id,
    userId: user.id,
    role: "owner",
    status: "active",
  });
  // Default initial schedule: every other week, Wed 16:00 -> Mon 08:00 (Europe/Helsinki)
  await db.insert((await import("@/db/schema")).recurringScheduleRules).values({
    familyId: family.id,
    timeZone: "Europe/Helsinki",
    intervalWeeks: 2,
    referenceDate: "2026-01-05",
    parentBStartWeekday: 3,
    parentBStartTime: "16:00",
    parentBEndWeekday: 1,
    parentBEndTime: "08:00",
    effectiveStart: new Date().toISOString().slice(0, 10),
    status: "active",
    createdByUserId: user.id,
  });
  return family;
}

export async function createInvitation(familyId: string) {
  const user = await requireSession();
  const db = getDb();
  // verify membership
  const membership = await db.query.familyMembers.findFirst({
    where: and(eq(familyMembers.familyId, familyId), eq(familyMembers.userId, user.id), eq(familyMembers.status, "active")),
  });
  if (!membership) throw new Error("Forbidden");
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(invitations).values({
    familyId,
    createdByUserId: user.id,
    tokenHash,
    expiresAt,
  });
  return { token, expiresAt };
}

export async function acceptInvitation(token: string) {
  const user = await requireSession();
  const db = getDb();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invite = await db.query.invitations.findFirst({
    where: and(eq(invitations.tokenHash, tokenHash), isNull(invitations.revokedAt), isNull(invitations.acceptedAt), gt(invitations.expiresAt, new Date())),
  });
  if (!invite) throw new Error("Invalid or expired invitation");
  // prevent duplicate membership
  const existing = await db.query.familyMembers.findFirst({
    where: and(eq(familyMembers.familyId, invite.familyId), eq(familyMembers.userId, user.id)),
  });
  if (existing) throw new Error("Already a member");
  await db.insert(familyMembers).values({
    familyId: invite.familyId,
    userId: user.id,
    role: "parent",
    status: "active",
  });
  await db
    .update(invitations)
    .set({ acceptedAt: new Date(), acceptedByUserId: user.id })
    .where(eq(invitations.id, invite.id));
  return { familyId: invite.familyId };
}

export async function getMyFamilies() {
  const user = await requireSession();
  const db = getDb();
  const memberships = await db.select().from(familyMembers).where(and(eq(familyMembers.userId, user.id), eq(familyMembers.status, "active")));
  const result = [];
  for (const m of memberships) {
    const [family] = await db.select().from(families).where(eq(families.id, m.familyId));
    if (family) result.push({ ...family, role: m.role });
  }
  return result;
}
