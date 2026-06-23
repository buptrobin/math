import { describe, expect, it } from "vitest";
import { parseMathText } from "@/lib/math-text";

describe("parseMathText", () => {
  it("splits plain text and inline LaTeX segments", () => {
    expect(parseMathText("求 $y=\\frac{\\sqrt{x-1}}{x-3}$ 的定义域")).toEqual([
      { type: "text", value: "求 " },
      { type: "math", value: "y=\\frac{\\sqrt{x-1}}{x-3}" },
      { type: "text", value: " 的定义域" }
    ]);
  });

  it("keeps unmatched dollar signs as text", () => {
    expect(parseMathText("价格是 $5")).toEqual([{ type: "text", value: "价格是 $5" }]);
  });
});
