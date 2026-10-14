import { getDb } from "@/lib/db";
import { recurringScheduleRules, familyMembers, families, parentingPeriods } from "@/db/schema";
import { eq, and, desc, lt, gt } from "drizzle-orm";
import {
  generateParentingPeriods,
  applyPeriodOverrides,
  RecurringRuleInput,
} from "@/lib/schedule";
import { format } from "date-fns";

export interface ParentPair { parentAId: string; parentBId: string | null; }

export async function getParentPair(familyId: string): Promise<ParentPair> {
  const db = getDb();
  const members = await db.select().from(familyMembers).where(eq(familyMembers.familyId, familyId));
  const [family] = await db.select().from(families).where(eq(families.id, familyId)).limit(1);
  let primaryId = family?.primaryParentUserId ?? null;
  if (!primaryId || !members.some((m: any) => m.userId === primaryId)) {
    const owner = members.find((m: any) => m.role === "owner") ?? members[0];
    primaryId = owner?.userId ?? null;
  }
  const other = members.find((m: any) => m.userId !== primaryId) ?? null;
  return { parentAId: primaryId ?? undefined as any, parentBId: other?.userId ?? null };
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
  const ymd = (v: any): string => {
    if (!v) return "";
    if (typeof v === "string") return v.slice(0, 10);
    return format(new Date(v), "yyyy-MM-dd");
  };
  return {
    timeZone: r.timeZone,
    intervalWeeks: r.intervalWeeks,
    referenceDate: ymd(r.referenceDate),
    parentBStartWeekday: r.parentBStartWeekday as any,
    parentBStartTime: r.parentBStartTime,
    parentBEndWeekday: r.parentBEndWeekday as any,
    parentBEndTime: r.parentBEndTime,
    effectiveStart: ymd(r.effectiveStart),
    effectiveEnd: r.effectiveEnd ? ymd(r.effectiveEnd) : null,
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
  const baseline = periods.map((p) => ({
    responsibleUserId: p.responsible === "B" ? parentBId ?? "__other__" : parentAId,
    responsible: p.responsible,
    startAt: p.startAt,
    endAt: p.endAt,
  }));

  // Approved change requests are stored as authoritative periods. Overlay them
  // on the recurring schedule so an accepted change actually moves the calendar.
  const db = getDb();
  const overrides = await db
    .select()
    .from(parentingPeriods)
    .where(
      and(
        eq(parentingPeriods.familyId, familyId),
        eq(parentingPeriods.status, "authoritative"),
        lt(parentingPeriods.startAt, to),
        gt(parentingPeriods.endAt, from),
      ),
    );

  if (overrides.length === 0) return baseline;

  const applied = applyPeriodOverrides(
    baseline.map(({ responsibleUserId, startAt, endAt }) => ({ responsibleUserId, startAt, endAt })),
    overrides.map((o) => ({
      responsibleUserId: o.responsibleUserId,
      startAt: new Date(o.startAt),
      endAt: new Date(o.endAt),
    })),
  );

  return applied.map((p) => ({
    responsibleUserId: p.responsibleUserId,
    responsible: (p.responsibleUserId === parentBId ? "B" : "A") as "A" | "B",
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
