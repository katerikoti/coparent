import { describe, it, expect } from "vitest";
import { generateParentingPeriods } from "@/lib/schedule";

describe("initial alternating schedule", () => {
  const rule = {
    timeZone: "UTC",
    intervalWeeks: 2,
    referenceDate: "2026-01-05", // Monday of first B week
    parentBStartWeekday: 3 as const,
    parentBStartTime: "16:00",
    parentBEndWeekday: 1 as const,
    parentBEndTime: "08:00",
    effectiveStart: "2026-01-01",
    effectiveEnd: null,
  };
  // Actually need referenceDate in B week; 2026-01-05 Monday, B week should include Wed 2026-01-07.
  it("Wednesday 16:00 is start of B period", () => {
    const from = new Date("2026-01-07T00:00:00Z");
    const to = new Date("2026-01-08T00:00:00Z");
    const periods = generateParentingPeriods(rule, from, to);
    // find period covering Wed 16
    const p = periods.find((x) => x.startAt <= new Date("2026-01-07T16:00:00Z") && x.endAt > new Date("2026-01-07T16:00:00Z"));
    expect(p?.responsible).toBe("B");
    expect(p?.startAt.toISOString()).toBe("2026-01-07T16:00:00.000Z");
  });
  it("Monday 08:00 is end of B period and A begins", () => {
    const from = new Date("2026-01-12T00:00:00Z");
    const to = new Date("2026-01-13T00:00:00Z");
    const periods = generateParentingPeriods(rule, from, to);
    const p = periods.find((x) => x.startAt <= new Date("2026-01-12T07:00:00Z") && x.endAt > new Date("2026-01-12T07:00:00Z"));
    expect(p?.responsible).toBe("B");
    expect(p?.endAt.toISOString()).toBe("2026-01-12T08:00:00.000Z");
    const a = periods.find((x) => x.startAt.toISOString() === "2026-01-12T08:00:00.000Z");
    expect(a?.responsible).toBe("A");
  });
  it("following week is all A", () => {
    const from = new Date("2026-01-14T00:00:00Z");
    const to = new Date("2026-01-15T00:00:00Z");
    const periods = generateParentingPeriods(rule, from, to);
    expect(periods.every((p) => p.responsible === "A")).toBe(true);
  });
  it("pattern repeats: next B period two weeks later", () => {
    const from = new Date("2026-01-21T00:00:00Z");
    const to = new Date("2026-01-22T00:00:00Z");
    const periods = generateParentingPeriods(rule, from, to);
    const p = periods.find((x) => x.startAt <= new Date("2026-01-21T16:00:00Z") && x.endAt > new Date("2026-01-21T16:00:00Z"));
    expect(p?.responsible).toBe("B");
  });
});

import { countHalfDays, computeAdjustmentHalfDays } from "@/lib/balance";

describe("half-day counting", () => {
  it("counts two half-days in a full day boundary", () => {
    // Wed 08? Let's use a 24h from 08:00 to next 08:00 => 2 half days
    const start = new Date("2026-01-07T08:00:00Z");
    const end = new Date("2026-01-08T08:00:00Z");
    expect(countHalfDays(start, end, "UTC")).toBe(2);
  });
  it("late pickup same day still same overnight unit", () => {
    // baseline Wed 16:00 -> Thu? Actually 16:00 to 16? Use difference zero for 21 pickup vs 16
    const baseStart = new Date("2026-01-07T16:00:00Z");
    const baseEnd = new Date("2026-01-12T08:00:00Z");
    const lateStart = new Date("2026-01-07T21:00:00Z");
    const adj = computeAdjustmentHalfDays({ baselineStart: baseStart, baselineEnd: baseEnd, proposedStart: lateStart, proposedEnd: baseEnd, timeZone: "UTC" });
    expect(adj).toBe(0);
  });
});

describe("schedule robustness", () => {
  it("accepts a Date reference date from the database", () => {
    const rule = {
      timeZone: "UTC",
      intervalWeeks: 2,
      referenceDate: new Date("2026-01-05T00:00:00Z") as any,
      parentBStartWeekday: 3 as const,
      parentBStartTime: "16:00",
      parentBEndWeekday: 1 as const,
      parentBEndTime: "08:00",
      effectiveStart: "2026-01-01",
      effectiveEnd: null,
    };
    const periods = generateParentingPeriods(rule, new Date("2026-01-07T00:00:00Z"), new Date("2026-01-12T12:00:00Z"));
    expect(periods.some((p) => p.responsible === "B")).toBe(true);
  });
});

describe("effective range", () => {
  it("does not generate periods before the effective start", () => {
    const rule = {
      timeZone: "UTC",
      intervalWeeks: 1,
      referenceDate: "2026-01-05",
      parentBStartWeekday: 3 as const,
      parentBStartTime: "16:00",
      parentBEndWeekday: 1 as const,
      parentBEndTime: "08:00",
      effectiveStart: "2026-02-01",
      effectiveEnd: null,
    };
    const periods = generateParentingPeriods(rule, new Date("2026-01-01T00:00:00Z"), new Date("2026-01-31T23:59:59Z"));
    expect(periods.length).toBe(0);
  });
});

import { applyPeriodOverrides } from "@/lib/schedule";

describe("approved change overrides", () => {
  const A = "user-a";
  const B = "user-b";
  const baseline = [
    { responsibleUserId: A, startAt: new Date("2026-03-01T00:00:00Z"), endAt: new Date("2026-03-10T00:00:00Z") },
  ];

  it("splits the baseline so the override window belongs to the requester", () => {
    const out = applyPeriodOverrides(baseline, [
      { responsibleUserId: B, startAt: new Date("2026-03-04T00:00:00Z"), endAt: new Date("2026-03-06T00:00:00Z") },
    ]);
    expect(out.map((p) => [p.responsibleUserId, p.startAt.toISOString(), p.endAt.toISOString()])).toEqual([
      [A, "2026-03-01T00:00:00.000Z", "2026-03-04T00:00:00.000Z"],
      [B, "2026-03-04T00:00:00.000Z", "2026-03-06T00:00:00.000Z"],
      [A, "2026-03-06T00:00:00.000Z", "2026-03-10T00:00:00.000Z"],
    ]);
  });

  it("a later override wins where two overlap", () => {
    const out = applyPeriodOverrides(baseline, [
      { responsibleUserId: B, startAt: new Date("2026-03-04T00:00:00Z"), endAt: new Date("2026-03-08T00:00:00Z") },
      { responsibleUserId: A, startAt: new Date("2026-03-05T00:00:00Z"), endAt: new Date("2026-03-06T00:00:00Z") },
    ]);
    const mid = out.find((p) => p.startAt.toISOString() === "2026-03-05T00:00:00.000Z");
    expect(mid?.responsibleUserId).toBe(A);
    expect(out.every((p) => p.startAt.getTime() < p.endAt.getTime())).toBe(true);
  });

  it("leaves the baseline untouched when there are no overrides", () => {
    expect(applyPeriodOverrides(baseline, []).map((p) => p.startAt.toISOString())).toEqual([
      "2026-03-01T00:00:00.000Z",
    ]);
  });
});
