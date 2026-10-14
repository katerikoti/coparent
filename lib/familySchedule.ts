import { getDb } from "@/lib/db";
import { recurringScheduleRules, familyMembers } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateParentingPeriods, RecurringRuleInput } from "@/lib/schedule";

export interface ParentPair { parentAId: string; parentBId: string | null; }

export async function getParentPair(familyId: string): Promise<ParentPair> {
  const db = getDb();
  const members = await db.select().from(familyMembers).where(eq(familyMembers.familyId, familyId));
  const owner = members.find((m: any) => m.role === "owner") ?? members[0];
  const other = members.find((m: any) => m.userId !== owner?.userId) ?? null;
  return { parentAId: owner?.userId, parentBId: other?.userId ?? null };
}

export async function getActiveRule(familyId: string): Promise<RecurringRuleInput | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(recurringScheduleRules)
    .where(and(eq(recurringScheduleRules.familyId, familyId), eq(recurringScheduleRules.status, "active")))
    .orderBy(desc(recurringScheduleRules.effectiveStart))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    timeZone: r.timeZone,
    intervalWeeks: r.intervalWeeks,
    referenceDate: r.referenceDate,
    parentBStartWeekday: r.parentBStartWeekday as any,
    parentBStartTime: r.parentBStartTime,
    parentBEndWeekday: r.parentBEndWeekday as any,
    parentBEndTime: r.parentBEndTime,
    effectiveStart: r.effectiveStart,
    effectiveEnd: r.effectiveEnd,
  };
}

export function defaultRule(timeZone = "Europe/Helsinki"): RecurringRuleInput {
  // reference Monday 2026-01-05 is in a B week (B period Wed 2026-01-07 .. Mon 2026-01-12)
  return {
    timeZone,
    intervalWeeks: 2,
    referenceDate: "2026-01-05",
    parentBStartWeekday: 3 as any,
    parentBStartTime: "16:00",
    parentBEndWeekday: 1 as any,
    parentBEndTime: "08:00",
    effectiveStart: new Date().toISOString().slice(0, 10),
    effectiveEnd: null,
  };
}

export async function generateFamilyPeriods(familyId: string, from: Date, to: Date) {
  const rule = (await getActiveRule(familyId)) ?? defaultRule();
  // filter effective dates roughly
  const periods = generateParentingPeriods(rule, from, to);
  const { parentAId, parentBId } = await getParentPair(familyId);
  return periods.map((p) => ({
    responsibleUserId: (p.responsible === "B" ? parentBId : parentAId) ?? parentAId,
    responsible: p.responsible,
    startAt: p.startAt,
    endAt: p.endAt,
  }));
}

export function nextHandover(periods: { startAt: Date; endAt: Date }[], now: Date) {
  const upcomingEnds = periods.filter((p) => p.endAt > now).map((p) => p.endAt.getTime());
  const upcomingStarts = periods.filter((p) => p.startAt > now).map((p) => p.startAt.getTime());
  const candidates = [...upcomingEnds, ...upcomingStarts];
  if (candidates.length === 0) return null;
  return new Date(Math.min(...candidates));
}
