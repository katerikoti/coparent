import { pgTable, uuid, text, timestamp, date, time, boolean, integer, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";

// ---- Better Auth core tables (managed by better-auth) ----
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  locale: text("locale").default("fi").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---- Application tables ----

export const families = pgTable("families", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  primaryParentUserId: text("primary_parent_user_id"),
  timeZone: text("time_zone").default("Europe/Helsinki").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const familyMembers = pgTable(
  "family_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("parent").notNull(),
    status: text("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("family_members_family_user_idx").on(t.familyId, t.userId)],
);

export const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  acceptedByUserId: text("accepted_by_user_id").references(() => user.id, { onDelete: "set null" }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const children = pgTable("children", {
  id: uuid("id").defaultRandom().primaryKey(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const recurringScheduleRules = pgTable("recurring_schedule_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  name: text("name"),
  timeZone: text("time_zone").notNull(),
  intervalWeeks: integer("interval_weeks").default(2).notNull(),
  referenceDate: date("reference_date").notNull(),
  // 0=Sunday ... 6=Saturday (JS); we store weekday index; interpret consistently in code.
  parentBStartWeekday: integer("parent_b_start_weekday").notNull(),
  parentBStartTime: text("parent_b_start_time").notNull(),
  parentBEndWeekday: integer("parent_b_end_weekday").notNull(),
  parentBEndTime: text("parent_b_end_time").notNull(),
  effectiveStart: date("effective_start").notNull(),
  effectiveEnd: date("effective_end"),
  status: text("status").default("active").notNull(),
  createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const parentingPeriods = pgTable(
  "parenting_periods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    responsibleUserId: text("responsible_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    sourceType: text("source_type").default("generated").notNull(),
    sourceId: uuid("source_id"),
    status: text("status").default("authoritative").notNull(),
    handoverNotes: text("handover_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("parenting_periods_family_start_idx").on(t.familyId, t.startAt)],
);

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    timeZone: text("time_zone"),
    location: text("location"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("calendar_events_family_start_idx").on(t.familyId, t.startAt)],
);

export const changeRequests = pgTable(
  "change_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    requesterUserId: text("requester_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    category: text("category").notNull(), // compensable | exception | permanent
    status: text("status").default("pending").notNull(),
    reason: text("reason"),
    affectedPeriodId: uuid("affected_period_id").references(() => parentingPeriods.id, { onDelete: "set null" }),
    originalStartAt: timestamp("original_start_at", { withTimezone: true }),
    originalEndAt: timestamp("original_end_at", { withTimezone: true }),
    proposedStartAt: timestamp("proposed_start_at", { withTimezone: true }),
    proposedEndAt: timestamp("proposed_end_at", { withTimezone: true }),
    proposedResponsibleUserId: text("proposed_responsible_user_id").references(() => user.id, { onDelete: "set null" }),
    proposedArrangement: jsonb("proposed_arrangement"),
    estimatedBalanceHalfDays: integer("estimated_balance_half_days"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [index("change_requests_family_status_idx").on(t.familyId, t.status)],
);

export const changeRequestResponses = pgTable("change_request_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  changeRequestId: uuid("change_request_id")
    .notNull()
    .references(() => changeRequests.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // approve | decline | counterpropose | withdraw
  note: text("note"),
  proposedArrangement: jsonb("proposed_arrangement"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const timeBalanceEntries = pgTable(
  "time_balance_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    changeRequestId: uuid("change_request_id").references(() => changeRequests.id, { onDelete: "set null" }),
    entryType: text("entry_type").notNull(), // adjustment | reversal | correction
    amountHalfDays: integer("amount_half_days").notNull(),
    reason: text("reason").notNull(),
    effectiveDate: date("effective_date").notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
    reversalOfId: uuid("reversal_of_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("time_balance_family_created_idx").on(t.familyId, t.createdAt), uniqueIndex("time_balance_change_request_idx").on(t.changeRequestId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientUserId: text("recipient_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    relatedType: text("related_type"),
    relatedId: uuid("related_id"),
    title: text("title").notNull(),
    body: text("body"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("notifications_recipient_read_idx").on(t.recipientUserId, t.readAt)],
);

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
