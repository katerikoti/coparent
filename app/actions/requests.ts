"use server";

import { z } from "zod";
import { getDb } from "@/lib/db";
import { changeRequests, changeRequestResponses, parentingPeriods, notifications, families } from "@/db/schema";
import { requireFamilyMember } from "@/lib/authorization";
import { eq, and } from "drizzle-orm";
import { getParentPair, scheduleGainHalfDays } from "@/lib/familySchedule";
import { computeAdjustmentHalfDays } from "@/lib/balance";
import { timeBalanceEntries } from "@/db/schema";

const CreateRequestInput = z.object({
  familyId: z.string().uuid(),
  category: z.enum(["compensable", "exception", "permanent"]),
  affectedPeriodId: z.string().uuid().optional(),
  originalStartAt: z.string().datetime().optional(),
  originalEndAt: z.string().datetime().optional(),
  proposedStartAt: z.string().datetime().optional(),
  proposedEndAt: z.string().datetime().optional(),
  proposedResponsibleUserId: z.string().optional(),
  reason: z.string().max(2000).optional(),
  estimatedBalanceHalfDays: z.number().int().optional(),
});

export async function createChangeRequest(input: z.infer<typeof CreateRequestInput>) {
  const data = CreateRequestInput.parse(input);
  const { user } = await requireFamilyMember(data.familyId);
  const db = getDb();

  // Estimate the balance effect up front so both parents can see what the
  // change would cost before anyone approves it (positive = requester gains care time).
  let estimatedBalanceHalfDays = data.estimatedBalanceHalfDays;
  if (estimatedBalanceHalfDays === undefined && data.proposedStartAt && data.proposedEndAt) {
    estimatedBalanceHalfDays = await scheduleGainHalfDays(
      data.familyId,
      new Date(data.proposedStartAt),
      new Date(data.proposedEndAt),
      user.id,
    );
  }

  const [row] = await db
    .insert(changeRequests)
    .values({
      familyId: data.familyId,
      requesterUserId: user.id,
      category: data.category,
      reason: data.reason,
      affectedPeriodId: data.affectedPeriodId,
      originalStartAt: data.originalStartAt ? new Date(data.originalStartAt) : null,
      originalEndAt: data.originalEndAt ? new Date(data.originalEndAt) : null,
      proposedStartAt: data.proposedStartAt ? new Date(data.proposedStartAt) : null,
      proposedEndAt: data.proposedEndAt ? new Date(data.proposedEndAt) : null,
      proposedResponsibleUserId: data.proposedResponsibleUserId,
      estimatedBalanceHalfDays,
    })
    .returning();

  const { familyMembers: fm } = await import("@/db/schema");
  const members = await db.select().from(fm).where(eq(fm.familyId, data.familyId));
  for (const m of members) {
    if (m.userId === user.id) continue;
    await db.insert(notifications).values({
      recipientUserId: m.userId,
      familyId: data.familyId,
      type: "change_request_created",
      relatedType: "change_request",
      relatedId: row.id,
      title: "New change request",
      body: data.reason ?? "A parent submitted a change request.",
    });
  }
  return row;
}

export async function respondToRequest(input: { requestId: string; action: "approve" | "decline" | "counterpropose" | "withdraw"; note?: string; proposedArrangement?: any }) {
  const db = getDb();
  const req = await db.select().from(changeRequests).where(eq(changeRequests.id, input.requestId)).limit(1);
  if (req.length === 0) throw new Error("Request not found");
  const request = req[0];
  const { user } = await requireFamilyMember(request.familyId);
  if (input.action === "approve") {
    if (request.status !== "pending" && request.status !== "counterproposed") throw new Error("Request not pending");
    // apply schedule change if proposed times present
    if (request.proposedStartAt && request.proposedEndAt) {
      // supersede affected period if exists
      if (request.affectedPeriodId) {
        await db.update(parentingPeriods).set({ status: "superseded" }).where(eq(parentingPeriods.id, request.affectedPeriodId));
      }
      await db.insert(parentingPeriods).values({
        familyId: request.familyId,
        responsibleUserId: request.proposedResponsibleUserId ?? request.requesterUserId,
        startAt: request.proposedStartAt,
        endAt: request.proposedEndAt,
        sourceType: "change_request",
        sourceId: request.id,
        status: "authoritative",
        handoverNotes: "Approved change",
      });
    }
    // Balance adjustment: an approved change shifts care time relative to the
    // agreed baseline. Explicit compensable requests keep their original-vs-
    // proposed calculation; one-off changes use the recurring schedule as the
    // baseline. The amount is stored signed relative to Parent A.
    if (request.proposedStartAt && request.proposedEndAt) {
      try {
        const [familyRow] = await db.select().from(families).where(eq(families.id, request.familyId)).limit(1);
        const tz = familyRow?.timeZone ?? "Europe/Helsinki";
        const { parentAId } = await getParentPair(request.familyId);
        const diff =
          request.category === "compensable" && request.originalStartAt && request.originalEndAt
            ? computeAdjustmentHalfDays({
                baselineStart: request.originalStartAt,
                baselineEnd: request.originalEndAt,
                proposedStart: request.proposedStartAt,
                proposedEnd: request.proposedEndAt,
                timeZone: tz,
              })
            : await scheduleGainHalfDays(
                request.familyId,
                request.proposedStartAt,
                request.proposedEndAt,
                request.requesterUserId,
              );
        if (diff !== 0) {
          // sign relative to Parent A
          const requesterIsA = request.requesterUserId === parentAId;
          const amountForA = requesterIsA ? diff : -diff;
          await db.insert(timeBalanceEntries).values({
            familyId: request.familyId,
            changeRequestId: request.id,
            entryType: "adjustment",
            amountHalfDays: amountForA,
            reason: request.reason ?? "Schedule change",
            effectiveDate: request.proposedStartAt.toISOString().slice(0, 10),
            createdByUserId: user.id,
          }).onConflictDoNothing();
        }
      } catch (e) {
        // ignore duplicate adjustments
      }
    }
    await db.update(changeRequests).set({ status: "approved", resolvedAt: new Date() }).where(eq(changeRequests.id, request.id));
    await db.insert(changeRequestResponses).values({
      changeRequestId: request.id,
      actorUserId: user.id,
      action: "approve",
      note: input.note,
    });
  } else if (input.action === "decline") {
    await db.update(changeRequests).set({ status: "declined", resolvedAt: new Date() }).where(eq(changeRequests.id, request.id));
    await db.insert(changeRequestResponses).values({
      changeRequestId: request.id,
      actorUserId: user.id,
      action: "decline",
      note: input.note,
    });
  } else if (input.action === "counterpropose") {
    await db.update(changeRequests).set({ status: "counterproposed" }).where(eq(changeRequests.id, request.id));
    await db.insert(changeRequestResponses).values({
      changeRequestId: request.id,
      actorUserId: user.id,
      action: "counterpropose",
      note: input.note,
      proposedArrangement: input.proposedArrangement ?? null,
    });
  } else if (input.action === "withdraw") {
    await db.update(changeRequests).set({ status: "withdrawn", resolvedAt: new Date() }).where(eq(changeRequests.id, request.id));
    await db.insert(changeRequestResponses).values({
      changeRequestId: request.id,
      actorUserId: user.id,
      action: "withdraw",
      note: input.note,
    });
  }
  return { ok: true };
}

export async function listChangeRequests(familyId: string, status?: string) {
  await requireFamilyMember(familyId);
  const db = getDb();
  const rows = status
    ? await db.select().from(changeRequests).where(and(eq(changeRequests.familyId, familyId), eq(changeRequests.status, status)))
    : await db.select().from(changeRequests).where(eq(changeRequests.familyId, familyId));
  return rows;
}
