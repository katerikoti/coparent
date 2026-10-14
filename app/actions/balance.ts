"use server";
import { getDb } from "@/lib/db";
import { timeBalanceEntries, familyMembers, families } from "@/db/schema";
import { requireFamilyMember, requireUser } from "@/lib/authorization";
import { eq, and, sql } from "drizzle-orm";

export async function getBalanceSummary(familyId: string) {
  const { user } = await requireFamilyMember(familyId);
  const db = getDb();
  const [family] = await db.select().from(families).where(eq(families.id, familyId)).limit(1);
  const members = await db.select().from(familyMembers).where(eq(familyMembers.familyId, familyId));
  const owner = members.find((m) => m.role === "owner") ?? members[0];
  const requesterIsA = user.id === owner?.userId;
  const rows = await db.select().from(timeBalanceEntries).where(eq(timeBalanceEntries.familyId, familyId)).orderBy(timeBalanceEntries.createdAt);
  const totalForA = rows.reduce((s, r) => s + r.amountHalfDays, 0);
  const viewingUserTotal = requesterIsA ? totalForA : -totalForA;
  return { family, totalHalfDaysForA: totalForA, viewingUserHalfDays: viewingUserTotal, entries: rows, isParentA: requesterIsA, timeZone: family?.timeZone ?? "Europe/Helsinki" };
}
