import type { ReviewStage } from "@/lib/types";

export interface ReviewScheduleItem {
  reviewStage: ReviewStage;
  scheduledAt: string;
}

const offsets: Array<[ReviewStage, number]> = [
  ["same_day", 0],
  ["three_days", 3],
  ["seven_days", 7]
];

export function createReviewSchedule(baseDate = new Date()): ReviewScheduleItem[] {
  return offsets.map(([reviewStage, days]) => {
    const scheduled = new Date(baseDate);
    scheduled.setUTCDate(scheduled.getUTCDate() + days);
    return {
      reviewStage,
      scheduledAt: scheduled.toISOString()
    };
  });
}
