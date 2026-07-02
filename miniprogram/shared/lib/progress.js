"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveMiniProgress = deriveMiniProgress;
function deriveMiniProgress(input) {
    const totalAttempts = input.attempts.length;
    const wrongAttempts = input.attempts.filter((attempt) => !attempt.isCorrect).length;
    const variationAttempts = input.attempts.filter((attempt) => attempt.questionId.startsWith("q-var-"));
    let consecutiveVariationCorrect = 0;
    for (const attempt of variationAttempts) {
        if (attempt.isCorrect) {
            consecutiveVariationCorrect += 1;
        }
        else {
            break;
        }
    }
    const status = totalAttempts === 0
        ? "未开始"
        : input.dueReviews > 0
            ? "练习中"
            : consecutiveVariationCorrect >= 3 && wrongAttempts > 0
                ? "已通关"
                : totalAttempts < 5
                    ? "诊断中"
                    : "学习中";
    return { totalAttempts, wrongAttempts, dueReviews: input.dueReviews, consecutiveVariationCorrect, status };
}
