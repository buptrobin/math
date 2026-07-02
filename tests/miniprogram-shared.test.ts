import { readFileSync } from "node:fs";
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
    expect(segments[0]).toMatchObject({ type: "math", block: false });
    expect(JSON.stringify(segments[0])).toContain("综合挑战：求函数");
    expect(segments[1]).toMatchObject({ type: "math", block: true });
    expect(JSON.stringify(segments[1])).toContain("katex");
    expect(JSON.stringify(segments[1])).toContain("sqrt");
    expect(segments[2]).toMatchObject({ type: "math", block: false });
    expect(JSON.stringify(segments[2])).toContain("的定义域");
  });

  it("renders square-root formulas as standalone display formulas with full-width text around them", () => {
    const segments = renderMathSegments("A层：求 $y=\\sqrt{x+3}$ 的定义域。");

    expect(segments).toHaveLength(3);
    expect(segments[0]).toMatchObject({ type: "math", block: false });
    expect(JSON.stringify(segments[0])).toContain("A层：求");
    expect(segments[1]).toMatchObject({ type: "math", block: true });
    expect(JSON.stringify(segments[1])).toContain("katex");
    expect(JSON.stringify(segments[1])).toContain("sqrt");
    expect(segments[2]).toMatchObject({ type: "math", block: false });
    expect(JSON.stringify(segments[2])).toContain("的定义域");
  });

  it("keeps text after a display formula in one full-width inline rich text run", () => {
    const segments = renderMathSegments("$y=\\frac{1}{x-2}$，$x$ 可以等于 $2$ 吗？");

    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ type: "math", block: true });
    expect(segments[1]).toMatchObject({ type: "math", block: false });
    expect(JSON.stringify(segments[1])).toContain("katex");
    expect(JSON.stringify(segments[1])).toContain("可以等于");
  });

  it("loads katex styles inside the mini program math component", () => {
    const json = JSON.parse(readFileSync("miniprogram/components/math-rich-text/math-rich-text.json", "utf8"));
    const wxss = readFileSync("miniprogram/components/math-rich-text/math-rich-text.wxss", "utf8");

    expect(json.options.styleIsolation).toBe("shared");
    expect(wxss).toContain("@rojer/katex-mini/index.wxss");
    expect(wxss).toContain(":host");
    expect(wxss).toContain("width: 100%");
  });

  it("keeps choice buttons full width with body-sized bold text", () => {
    const wxss = readFileSync("miniprogram/components/question-card/question-card.wxss", "utf8");

    expect(wxss).toContain(".option");
    expect(wxss).toContain("width: 100%");
    expect(wxss).toContain("font-size: 30rpx");
    expect(wxss).toContain("font-weight: 700");
    expect(wxss).toContain("white-space: normal");
    expect(wxss).toContain("min-width: 0");
  });

  it("commits generated javascript entry files for WeChat DevTools", () => {
    expect(readFileSync("miniprogram/app.js", "utf8")).toContain("App(");
    expect(readFileSync("miniprogram/pages/index/index.js", "utf8")).toContain("Page(");
    expect(readFileSync("miniprogram/pages/lesson/lesson.js", "utf8")).toContain("Page(");
    expect(readFileSync("miniprogram/pages/review/review.js", "utf8")).toContain("Page(");
  });
});
