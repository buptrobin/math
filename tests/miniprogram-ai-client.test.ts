import { describe, expect, it } from "vitest";
import { createAiClient } from "../miniprogram/shared/lib/ai-client";

describe("mini program AI client", () => {
  it("returns grade result from cloud function", async () => {
    const client = createAiClient(async () => ({
      result: { ok: true, mode: "grade", isEquivalent: true, reason: "集合等价" }
    }));

    const result = await client.gradeAnswerWithAi("q-diagnostic-3", "x≥1且x≠3");

    expect(result).toEqual({ ok: true, isEquivalent: true, reason: "集合等价" });
  });

  it("returns a safe error when the cloud function rejects", async () => {
    const client = createAiClient(async () => {
      throw new Error("network failed");
    });

    const result = await client.evaluateFeynman("请解释定义域", "定义域是 x 的范围。");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("AI 暂不可用，请稍后再试。");
  });
});
