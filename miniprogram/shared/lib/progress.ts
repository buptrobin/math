import type { KnowledgeStatus } from "./types";

export interface MiniProgressSummary {
  totalAttempts: number;
  wrongAttempts: number;
  dueReviews: number;
  consecutiveVariationCorrect: number;
  status: KnowledgeStatus;
}

export function deriveMiniProgress(input: {
  attempts: Array<{ questionId: string; isCorrect: boolean }>;
  dueReviews: number;
}): MiniProgressSummary {
  const totalAttempts = input.attempts.length;
  const wrongAttempts = input.attempts.filter((attempt) => !attempt.isCorrect).length;
  const variationAttempts = input.attempts.filter((attempt) => attempt.questionId.startsWith("q-var-"));
  let consecutiveVariationCorrect = 0;

  for (const attempt of variationAttempts) {
    if (attempt.isCorrect) {
      consecutiveVariationCorrect += 1;
    } else {
      break;
    }
  }

  const status: KnowledgeStatus =
    totalAttempts === 0
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
