import { describe, expect, it } from "vitest";
import { deriveMiniProgress } from "../miniprogram/shared/lib/progress";
import { createMemoryStorageAdapter, createMiniStorageRepository } from "../miniprogram/shared/lib/storage";

describe("mini program local storage repository", () => {
  it("records attempts and creates review tasks for wrong answers", () => {
    const adapter = createMemoryStorageAdapter();
    const repo = createMiniStorageRepository(adapter, () => "2026-07-01T00:00:00.000Z");

    repo.recordAttempt({
      questionId: "q-diagnostic-3",
      userAnswer: "x>1",
      isCorrect: false,
      hintsUsed: 2,
      gradingSource: "local"
    });

    expect(repo.getAttempts()).toHaveLength(1);
    expect(repo.getReviewTasks()).toHaveLength(3);
    expect(repo.getDueReviewTasks(new Date("2026-07-01T00:00:01.000Z"))).toHaveLength(1);
  });

  it("clears attempts, review tasks, and feynman outputs", () => {
    const adapter = createMemoryStorageAdapter();
    const repo = createMiniStorageRepository(adapter, () => "2026-07-01T00:00:00.000Z");

    repo.recordAttempt({
      questionId: "q-diagnostic-1",
      userAnswer: "A",
      isCorrect: true,
      hintsUsed: 0,
      gradingSource: "local"
    });
    repo.recordFeynmanOutput({
      promptId: "feynman-1",
      prompt: "请解释定义域",
      userText: "定义域是 x 可以取的范围。",
      aiFeedback: "继续补充限制条件。",
      score: 60
    });

    repo.resetAll();

    expect(repo.getAttempts()).toEqual([]);
    expect(repo.getReviewTasks()).toEqual([]);
    expect(repo.getFeynmanOutputs()).toEqual([]);
  });
});

describe("mini program progress", () => {
  it("derives status from local attempt records", () => {
    const progress = deriveMiniProgress({
      attempts: [{ questionId: "q-var-1", isCorrect: true }],
      dueReviews: 0
    });

    expect(progress.totalAttempts).toBe(1);
    expect(progress.status).toBe("诊断中");
  });
});
