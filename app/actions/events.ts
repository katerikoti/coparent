"use server";

import { z } from "zod";
import { getDb } from "@/lib/db";
import { calendarEvents } from "@/db/schema";
import { requireFamilyMember } from "@/lib/authorization";
import { eq, and } from "drizzle-orm";

const EventInput = z.object({
  familyId: z.string().uuid(),
  type: z.string().min(1),
  title: z.string().min(1).max(200),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export async function createEvent(input: z.infer<typeof EventInput>) {
  const data = EventInput.parse(input);
  const { user } = await requireFamilyMember(data.familyId);
  if (new Date(data.endAt) <= new Date(data.startAt)) throw new Error("End must be after start");
  const db = getDb();
  const [row] = await db
    .insert(calendarEvents)
    .values({
      familyId: data.familyId,
      createdByUserId: user.id,
      type: data.type,
      title: data.title,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      location: data.location,
      notes: data.notes,
    })
    .returning();
  return row;
}

export async function updateEvent(input: z.infer<typeof EventInput> & { id: string }) {
  const data = EventInput.parse(input);
  const { user } = await requireFamilyMember(data.familyId);
  if (new Date(data.endAt) <= new Date(data.startAt)) throw new Error("End must be after start");
  const db = getDb();
  await db
    .update(calendarEvents)
    .set({
      type: data.type,
      title: data.title,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      location: data.location,
      notes: data.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(calendarEvents.id, input.id), eq(calendarEvents.familyId, data.familyId)));
  return { ok: true };
}

export async function deleteEvent(familyId: string, id: string) {
  await requireFamilyMember(familyId);
  const db = getDb();
  await db.delete(calendarEvents).where(and(eq(calendarEvents.id, id), eq(calendarEvents.familyId, familyId)));
  return { ok: true };
}

export async function getEventById(id: string) {
  const db = getDb();
  const [row] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id)).limit(1);
  if (!row) return null;
  await requireFamilyMember(row.familyId);
  return row;
}

import { calendarEvents as ce } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function listEvents(familyId: string, from?: string, to?: string) {
  await requireFamilyMember(familyId);
  const db = getDb();
  const conditions = [eq(ce.familyId, familyId)];
  if (from) conditions.push(sql`${ce.startAt} >= ${new Date(from)}`);
  if (to) conditions.push(sql`${ce.startAt} < ${new Date(to)}`);
  const rows = await db.select().from(ce).where(and(...conditions)).orderBy(ce.startAt);
  return rows;
}
