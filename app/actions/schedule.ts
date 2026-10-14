"use server";

import { z } from "zod";
import { getDb } from "@/lib/db";
import { recurringScheduleRules } from "@/db/schema";
import { requireFamilyMember } from "@/lib/authorization";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const RuleInput = z.object({
  familyId: z.string().uuid(),
  timeZone: z.string().min(1),
  intervalWeeks: z.number().int().min(1).max(8),
  referenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  parentBStartWeekday: z.number().int().min(0).max(6),
  parentBStartTime: z.string().regex(/^\d{2}:\d{2}$/),
  parentBEndWeekday: z.number().int().min(0).max(6),
  parentBEndTime: z.string().regex(/^\d{2}:\d{2}$/),
  effectiveStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function createRecurringRule(input: z.infer<typeof RuleInput>) {
  const data = RuleInput.parse(input);
  const { user } = await requireFamilyMember(data.familyId);
  const db = getDb();
  // supersede active rules with effectiveEnd
  await db
    .update(recurringScheduleRules)
    .set({ status: "superseded", effectiveEnd: data.effectiveStart, updatedAt: new Date() })
    .where(and(eq(recurringScheduleRules.familyId, data.familyId), eq(recurringScheduleRules.status, "active")));
  const [row] = await db
    .insert(recurringScheduleRules)
    .values({
      familyId: data.familyId,
      timeZone: data.timeZone,
      intervalWeeks: data.intervalWeeks,
      referenceDate: data.referenceDate,
      parentBStartWeekday: data.parentBStartWeekday,
      parentBStartTime: data.parentBStartTime,
      parentBEndWeekday: data.parentBEndWeekday,
      parentBEndTime: data.parentBEndTime,
      effectiveStart: data.effectiveStart,
      status: "active",
      createdByUserId: user.id,
    })
    .returning();
  revalidatePath("/", "layout");
  return row;
}
