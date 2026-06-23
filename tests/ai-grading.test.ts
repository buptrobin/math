import { describe, expect, it } from "vitest";
import { functionDomainSeed } from "@/data/function-domain.seed";
import { gradeAnswerWithAiFallback } from "@/lib/ai-grading";

describe("gradeAnswerWithAiFallback", () => {
  it("does not call DeepSeek when local grading already accepts the answer", async () => {
    let calls = 0;
    const question = functionDomainSeed.questions.find((item) => item.id === "q-example-1");
    expect(question).toBeDefined();

    const result = await gradeAnswerWithAiFallback(question!, "x>=1且x<>3", {
      apiKey: "test-key",
      fetchImpl: async () => {
        calls += 1;
        throw new Error("fetch should not be called");
      }
    });

    expect(result.isCorrect).toBe(true);
    expect(result.source).toBe("local");
    expect(calls).toBe(0);
  });

  it("uses DeepSeek as a fallback for fill blank answers rejected locally", async () => {
    const question = functionDomainSeed.questions.find((item) => item.id === "q-example-1");
    expect(question).toBeDefined();

    const result = await gradeAnswerWithAiFallback(question!, "x不能等于3，并且x至少是1", {
      apiKey: "test-key",
      fetchImpl: async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        expect(body.model).toBe("deepseek-chat");
        expect(body.response_format).toEqual({ type: "json_object" });

        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    is_equivalent: true,
                    reason: "学生答案表达的是 x >= 1 且 x != 3，与标准答案等价。"
                  })
                }
              }
            ]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    });

    expect(result.isCorrect).toBe(true);
    expect(result.source).toBe("ai");
    expect(result.aiReason).toContain("等价");
  });

  it("keeps local result when no DeepSeek API key is configured", async () => {
    const question = functionDomainSeed.questions.find((item) => item.id === "q-example-1");
    expect(question).toBeDefined();

    const result = await gradeAnswerWithAiFallback(question!, "x不能等于3，并且x至少是1", {
      apiKey: "",
      fetchImpl: async () => {
        throw new Error("fetch should not be called");
      }
    });

    expect(result.isCorrect).toBe(false);
    expect(result.source).toBe("local");
  });
});
