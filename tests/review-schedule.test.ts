import { describe, expect, it } from "vitest";
import { createReviewSchedule } from "@/lib/review-schedule";

describe("createReviewSchedule", () => {
  it("creates same-day, 3-day, and 7-day review dates", () => {
    const base = new Date("2026-06-23T08:00:00.000Z");
    const tasks = createReviewSchedule(base);

    expect(tasks).toEqual([
      { reviewStage: "same_day", scheduledAt: "2026-06-23T08:00:00.000Z" },
      { reviewStage: "three_days", scheduledAt: "2026-06-26T08:00:00.000Z" },
      { reviewStage: "seven_days", scheduledAt: "2026-06-30T08:00:00.000Z" }
    ]);
  });
});
