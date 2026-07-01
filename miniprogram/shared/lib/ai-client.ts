declare const wx: {
  cloud: {
    callFunction(input: { name: string; data: unknown }): Promise<{ result?: unknown }>;
  };
};

type CloudCall = (input: { name: string; data: unknown }) => Promise<{ result?: unknown }>;

export interface AiGradeClientResult {
  ok: boolean;
  isEquivalent?: boolean;
  reason?: string;
  error?: string;
}

export interface AiFeynmanClientResult {
  ok: boolean;
  score?: number;
  aiFeedback?: string;
  error?: string;
}

function defaultCloudCall(input: { name: string; data: unknown }) {
  return wx.cloud.callFunction(input);
}

export function createAiClient(callFunction: CloudCall = defaultCloudCall) {
  return {
    async gradeAnswerWithAi(questionId: string, userAnswer: string): Promise<AiGradeClientResult> {
      try {
        const response = await callFunction({ name: "aiCoach", data: { mode: "grade", questionId, userAnswer } });
        const result = response.result as { ok?: boolean; isEquivalent?: boolean; reason?: string; error?: string };
        if (result?.ok === true) {
          return { ok: true, isEquivalent: result.isEquivalent === true, reason: result.reason ?? "" };
        }
        return { ok: false, error: result?.error ?? "AI 暂不可用，请稍后再试。" };
      } catch {
        return { ok: false, error: "AI 暂不可用，请稍后再试。" };
      }
    },
    async evaluateFeynman(prompt: string, userText: string): Promise<AiFeynmanClientResult> {
      try {
        const response = await callFunction({ name: "aiCoach", data: { mode: "feynman", prompt, userText } });
        const result = response.result as { ok?: boolean; score?: number; aiFeedback?: string; error?: string };
        if (result?.ok === true) {
          return { ok: true, score: result.score ?? 0, aiFeedback: result.aiFeedback ?? "" };
        }
        return { ok: false, error: result?.error ?? "AI 暂不可用，请稍后再试。" };
      } catch {
        return { ok: false, error: "AI 暂不可用，请稍后再试。" };
      }
    }
  };
}
