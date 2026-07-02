"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAiClient = createAiClient;
function defaultCloudCall(input) {
    return wx.cloud.callFunction(input);
}
function createAiClient(callFunction = defaultCloudCall) {
    return {
        async gradeAnswerWithAi(questionId, userAnswer) {
            try {
                const response = await callFunction({ name: "aiCoach", data: { mode: "grade", questionId, userAnswer } });
                const result = response.result;
                if (result?.ok === true) {
                    return { ok: true, isEquivalent: result.isEquivalent === true, reason: result.reason ?? "" };
                }
                return { ok: false, error: result?.error ?? "AI 暂不可用，请稍后再试。" };
            }
            catch {
                return { ok: false, error: "AI 暂不可用，请稍后再试。" };
            }
        },
        async evaluateFeynman(prompt, userText) {
            try {
                const response = await callFunction({ name: "aiCoach", data: { mode: "feynman", prompt, userText } });
                const result = response.result;
                if (result?.ok === true) {
                    return { ok: true, score: result.score ?? 0, aiFeedback: result.aiFeedback ?? "" };
                }
                return { ok: false, error: result?.error ?? "AI 暂不可用，请稍后再试。" };
            }
            catch {
                return { ok: false, error: "AI 暂不可用，请稍后再试。" };
            }
        }
    };
}
