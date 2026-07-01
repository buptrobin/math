import { functionDomainSeed } from "../../shared/data/function-domain.seed";
import { createAiClient } from "../../shared/lib/ai-client";
import { gradeAnswer } from "../../shared/lib/grading";
import { createMiniStorageRepository, createWxStorageAdapter } from "../../shared/lib/storage";

Page({
  data: {
    lesson: null as unknown,
    questions: [] as unknown[],
    results: {} as Record<string, unknown>,
    isTextbook: false,
    isFeynman: false,
    textbookFormal: "",
    textbookFriendly: "",
    ruleCards: [] as string[],
    feynmanPrompts: functionDomainSeed.feynmanPrompts,
    feynmanText: {} as Record<string, string>,
    feynmanFeedback: {} as Record<string, string>
  },
  onLoad(this: any, query: Record<string, string | undefined>) {
    const lessonId = String(query.lessonId ?? functionDomainSeed.lessons[0].id);
    const lesson = functionDomainSeed.lessons.find((item) => item.id === lessonId) ?? functionDomainSeed.lessons[0];
    this.setData({
      lesson,
      questions: functionDomainSeed.questions.filter((item) => item.lessonId === lesson.id),
      isTextbook: lesson.sectionType === "textbook_explanation",
      isFeynman: lesson.sectionType === "feynman_output",
      textbookFormal: functionDomainSeed.textbookExplanation.formal,
      textbookFriendly: functionDomainSeed.textbookExplanation.studentFriendly,
      ruleCards: functionDomainSeed.textbookExplanation.ruleCards
    });
  },
  async submitAnswer(this: any, event: WechatMiniprogram.CustomEvent<{ questionId: string; userAnswer: string; hintsUsed: number }>) {
    const { questionId, userAnswer, hintsUsed } = event.detail;
    const question = functionDomainSeed.questions.find((item) => item.id === questionId);
    if (!question) return;

    const local = gradeAnswer(question, userAnswer);
    let isCorrect = local.isCorrect;
    let gradingSource: "local" | "ai" = "local";
    let aiReason = "";

    if (!isCorrect && (question.questionType === "fill_blank" || question.questionType === "example")) {
      const ai = await createAiClient().gradeAnswerWithAi(questionId, userAnswer);
      if (ai.ok) {
        isCorrect = ai.isEquivalent === true;
        gradingSource = "ai";
        aiReason = ai.reason ?? "";
      }
    }

    createMiniStorageRepository(createWxStorageAdapter()).recordAttempt({
      questionId,
      userAnswer,
      isCorrect,
      hintsUsed,
      gradingSource,
      aiReason
    });

    this.setData({
      [`results.${questionId}`]: {
        isCorrect,
        explanation: question.explanation,
        commonMistake: question.commonMistake,
        aiReason
      }
    });
  },
  onFeynmanInput(this: any, event: WechatMiniprogram.Input) {
    const promptId = String(event.currentTarget.dataset.id);
    this.setData({ [`feynmanText.${promptId}`]: event.detail.value });
  },
  async submitFeynman(this: any, event: WechatMiniprogram.TouchEvent) {
    const promptId = String(event.currentTarget.dataset.id);
    const prompt = String(event.currentTarget.dataset.prompt);
    const userText = this.data.feynmanText[promptId] ?? "";
    const result = await createAiClient().evaluateFeynman(prompt, userText);
    if (result.ok) {
      createMiniStorageRepository(createWxStorageAdapter()).recordFeynmanOutput({
        promptId,
        prompt,
        userText,
        aiFeedback: result.aiFeedback ?? "",
        score: result.score ?? 0
      });
      this.setData({ [`feynmanFeedback.${promptId}`]: result.aiFeedback ?? "" });
    } else {
      this.setData({ [`feynmanFeedback.${promptId}`]: result.error ?? "AI 暂不可用，请稍后再试。" });
    }
  }
});
