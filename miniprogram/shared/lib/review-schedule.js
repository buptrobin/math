"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewSchedule = createReviewSchedule;
const offsets = [
    ["same_day", 0],
    ["three_days", 3],
    ["seven_days", 7]
];
function createReviewSchedule(baseDate = new Date()) {
    return offsets.map(([reviewStage, days]) => {
        const scheduled = new Date(baseDate);
        scheduled.setUTCDate(scheduled.getUTCDate() + days);
        return {
            reviewStage,
            scheduledAt: scheduled.toISOString()
        };
    });
}
