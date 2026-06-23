import { describe, expect, it } from "vitest";
import { functionDomainSeed } from "@/data/function-domain.seed";
import { gradeAnswer, normalizeAnswer } from "@/lib/grading";

describe("normalizeAnswer", () => {
  it("removes spaces and normalizes union symbols", () => {
    expect(normalizeAnswer("[1,3) U (3,+∞)")).toBe("[1,3)∪(3,+∞)");
  });
});

describe("gradeAnswer", () => {
  it("accepts exact single choice labels or text", () => {
    const question = functionDomainSeed.questions.find((item) => item.id === "q-diagnostic-1");
    expect(question).toBeDefined();
    expect(gradeAnswer(question!, "B").isCorrect).toBe(true);
    expect(gradeAnswer(question!, "不可以").isCorrect).toBe(true);
  });

  it("accepts equivalent fill blank answers", () => {
    const question = functionDomainSeed.questions.find((item) => item.id === "q-diagnostic-3");
    expect(question).toBeDefined();
    expect(gradeAnswer(question!, "x >= 1 且 x != 3").isCorrect).toBe(true);
  });

  it("accepts uppercase X in equivalent algebra answers", () => {
    const question = functionDomainSeed.questions.find((item) => item.id === "q-example-1");
    expect(question).toBeDefined();
    expect(gradeAnswer(question!, "X≥1且X≠3").isCorrect).toBe(true);
  });

  it("accepts angle bracket not-equal syntax", () => {
    const question = functionDomainSeed.questions.find((item) => item.id === "q-example-1");
    expect(question).toBeDefined();
    expect(gradeAnswer(question!, "x>=1且x<>3").isCorrect).toBe(true);
  });

  it("accepts reordered conjunction conditions", () => {
    const question = functionDomainSeed.questions.find((item) => item.id === "q-example-1");
    expect(question).toBeDefined();
    expect(gradeAnswer(question!, "x<>3且x>=1").isCorrect).toBe(true);
  });
});
