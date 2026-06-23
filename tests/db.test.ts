import { describe, expect, it } from "vitest";
import { createAppDatabase } from "@/lib/db";

describe("createAppDatabase", () => {
  it("seeds knowledge point, lessons, and questions", () => {
    const db = createAppDatabase(":memory:");

    expect(db.getKnowledgePoint()?.title).toBe("函数定义域");
    expect(db.getLessons()).toHaveLength(7);
    expect(db.getQuestionsByLesson("lesson-domain-diagnostic")).toHaveLength(5);

    db.close();
  });

  it("records wrong attempts and creates review tasks", () => {
    const db = createAppDatabase(":memory:");

    const attempt = db.recordAttempt({
      userId: "demo-student",
      questionId: "q-diagnostic-1",
      userAnswer: "可以",
      isCorrect: false,
      selectedErrorTag: "概念错",
      hintsUsed: 1
    });

    expect(attempt.id).toBeGreaterThan(0);
    expect(db.getDueReviewTasks("demo-student", new Date("2999-01-01T00:00:00.000Z"))).toHaveLength(3);

    db.close();
  });

  it("resets learner progress while keeping seeded lesson content", () => {
    const db = createAppDatabase(":memory:");

    db.recordAttempt({
      userId: "demo-student",
      questionId: "q-diagnostic-1",
      userAnswer: "可以",
      isCorrect: false,
      selectedErrorTag: "概念错",
      hintsUsed: 1
    });
    db.recordFeynmanOutput({
      userId: "demo-student",
      knowledgePointId: "kp-function-domain",
      prompt: "请用自己的话解释：什么是定义域？",
      userText: "定义域就是 x 可以取哪些值。",
      aiFeedback: "表达有一些关键点。",
      score: 60
    });

    db.resetUserProgress("demo-student");

    expect(db.getAttempts("demo-student")).toHaveLength(0);
    expect(db.getDueReviewTasks("demo-student", new Date("2999-01-01T00:00:00.000Z"))).toHaveLength(0);
    expect(db.getLessons()).toHaveLength(7);
    expect(db.getQuestionsByLesson("lesson-domain-diagnostic")).toHaveLength(5);

    db.close();
  });
});
