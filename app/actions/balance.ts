"use server";
import { getDb } from "@/lib/db";
import { timeBalanceEntries, families } from "@/db/schema";
import { requireFamilyMember } from "@/lib/authorization";
import { eq } from "drizzle-orm";
import { getParentPair } from "@/lib/familySchedule";

export async function getBalanceSummary(familyId: string) {
  const { user } = await requireFamilyMember(familyId);
  const db = getDb();
  const [family] = await db.select().from(families).where(eq(families.id, familyId)).limit(1);
  const pair = await getParentPair(familyId);
  const requesterIsA = user.id === pair.parentAId;
  const rows = await db.select().from(timeBalanceEntries).where(eq(timeBalanceEntries.familyId, familyId)).orderBy(timeBalanceEntries.createdAt);
  const totalForA = rows.reduce((s, r) => s + r.amountHalfDays, 0);
  const viewingUserTotal = requesterIsA ? totalForA : -totalForA;
  return { family, totalHalfDaysForA: totalForA, viewingUserHalfDays: viewingUserTotal, entries: rows, isParentA: requesterIsA, timeZone: family?.timeZone ?? "Europe/Helsinki" };
}
