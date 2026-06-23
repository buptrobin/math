import type { KnowledgeStatus } from "@/lib/types";

export interface ProgressSummary {
  totalAttempts: number;
  wrongAttempts: number;
  dueReviews: number;
  consecutiveVariationCorrect: number;
  status: KnowledgeStatus;
}

export function deriveProgress(input: {
  attempts: Array<{ question_id: string; is_correct: number }>;
  dueReviews: number;
}): ProgressSummary {
  const totalAttempts = input.attempts.length;
  const wrongAttempts = input.attempts.filter((attempt) => attempt.is_correct === 0).length;
  const variationAttempts = input.attempts.filter((attempt) => attempt.question_id.startsWith("q-var-"));
  let consecutiveVariationCorrect = 0;

  for (const attempt of variationAttempts) {
    if (attempt.is_correct === 1) {
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

  return {
    totalAttempts,
    wrongAttempts,
    dueReviews: input.dueReviews,
    consecutiveVariationCorrect,
    status
  };
}
