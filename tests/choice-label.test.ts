import { describe, expect, it } from "vitest";
import { getChoiceLabel } from "@/lib/choice-label";

describe("getChoiceLabel", () => {
  it("returns A/B/C/D labels for zero-based option indexes", () => {
    expect(getChoiceLabel(0)).toBe("A");
    expect(getChoiceLabel(1)).toBe("B");
    expect(getChoiceLabel(2)).toBe("C");
    expect(getChoiceLabel(3)).toBe("D");
  });
});
