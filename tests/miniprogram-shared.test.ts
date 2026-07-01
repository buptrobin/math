import { describe, expect, it } from "vitest";
import { functionDomainSeed } from "../miniprogram/shared/data/function-domain.seed";
import { gradeAnswer, normalizeAnswer } from "../miniprogram/shared/lib/grading";
import { createReviewSchedule } from "../miniprogram/shared/lib/review-schedule";
import { formatMathText } from "../miniprogram/shared/lib/math-text";
import { renderMathNodes, renderMathSegments } from "../miniprogram/shared/lib/math-render";

describe("mini program shared grading", () => {
  it("normalizes equivalent interval and inequality answers", () => {
    expect(normalizeAnswer("x >= 1 且 x != 3")).toBe("x≥1且x≠3");
  });

  it("grades seed answers with the migrated question data", () => {
    const question = functionDomainSeed.questions.find((item) => item.id === "q-diagnostic-3");
    expect(question).toBeDefined();
    expect(gradeAnswer(question!, "x >= 1 且 x != 3").isCorrect).toBe(true);
  });
});

describe("mini program review schedule", () => {
  it("creates same day, three day, and seven day review tasks", () => {
    const schedule = createReviewSchedule(new Date("2026-07-01T00:00:00.000Z"));
    expect(schedule).toEqual([
      { reviewStage: "same_day", scheduledAt: "2026-07-01T00:00:00.000Z" },
      { reviewStage: "three_days", scheduledAt: "2026-07-04T00:00:00.000Z" },
      { reviewStage: "seven_days", scheduledAt: "2026-07-08T00:00:00.000Z" }
    ]);
  });
});

describe("mini program math text fallback", () => {
  it("turns simple latex into readable text", () => {
    expect(formatMathText("$y=\\frac{1}{x-2}$，$x\\ge 1$")).toBe("y=1/(x-2)，x≥1");
  });

  it("removes inline math delimiters from simple inequality options", () => {
    expect(formatMathText("$x>1$")).toBe("x>1");
    expect(formatMathText("$x\\ge 1$")).toBe("x≥1");
  });

  it("formats square roots inside fractions without leaving latex commands", () => {
    expect(formatMathText("$y=\\frac{\\sqrt{x-1}}{x-3}$")).toBe("y=√(x-1)/(x-3)");
    expect(formatMathText("$y=\\frac{1}{\\sqrt{x-2}}$")).toBe("y=1/(√(x-2))");
  });
});

describe("mini program rich math rendering", () => {
  it("renders latex formulas into rich-text nodes", () => {
    const nodes = renderMathNodes("求 $y=\\frac{\\sqrt{x-1}}{x-3}$ 的定义域");

    expect(Array.isArray(nodes)).toBe(true);
    expect(JSON.stringify(nodes)).toContain("katex");
    expect(JSON.stringify(nodes)).toContain("sqrt");
  });

  it("splits complex formulas into scrollable math segments", () => {
    const segments = renderMathSegments("综合挑战：求函数 $y=\\frac{\\sqrt{x+1}}{\\sqrt{2-x}}+\\frac{1}{x^2-1}$ 的定义域。");

    expect(segments).toHaveLength(3);
    expect(segments[0]).toMatchObject({ type: "text", text: "综合挑战：求函数 " });
    expect(segments[1]).toMatchObject({ type: "math", block: true });
    expect(JSON.stringify(segments[1])).toContain("√(x+1)");
    expect(JSON.stringify(segments[1])).not.toContain("katex");
    expect(segments[2]).toMatchObject({ type: "text", text: " 的定义域。" });
  });

  it("keeps simple square-root formulas readable without katex sqrt layout", () => {
    const segments = renderMathSegments("A层：求 $y=\\sqrt{x+3}$ 的定义域。");

    expect(segments).toHaveLength(3);
    expect(segments[1]).toMatchObject({ type: "math", block: false });
    expect(JSON.stringify(segments[1])).toContain("y=√(x+3)");
    expect(JSON.stringify(segments[1])).not.toContain("sqrt");
  });
});
