"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const function_domain_seed_1 = require("../../shared/data/function-domain.seed");
const ai_client_1 = require("../../shared/lib/ai-client");
const grading_1 = require("../../shared/lib/grading");
const storage_1 = require("../../shared/lib/storage");
Page({
    data: {
        lesson: null,
        questions: [],
        results: {},
        isTextbook: false,
        isFeynman: false,
        textbookFormal: "",
        textbookFriendly: "",
        ruleCards: [],
        feynmanPrompts: function_domain_seed_1.functionDomainSeed.feynmanPrompts,
        feynmanText: {},
        feynmanFeedback: {}
    },
    onLoad(query) {
        const lessonId = String(query.lessonId ?? function_domain_seed_1.functionDomainSeed.lessons[0].id);
        const lesson = function_domain_seed_1.functionDomainSeed.lessons.find((item) => item.id === lessonId) ?? function_domain_seed_1.functionDomainSeed.lessons[0];
        this.setData({
            lesson,
            questions: function_domain_seed_1.functionDomainSeed.questions.filter((item) => item.lessonId === lesson.id),
            isTextbook: lesson.sectionType === "textbook_explanation",
            isFeynman: lesson.sectionType === "feynman_output",
            textbookFormal: function_domain_seed_1.functionDomainSeed.textbookExplanation.formal,
            textbookFriendly: function_domain_seed_1.functionDomainSeed.textbookExplanation.studentFriendly,
            ruleCards: function_domain_seed_1.functionDomainSeed.textbookExplanation.ruleCards
        });
    },
    async submitAnswer(event) {
        const { questionId, userAnswer, hintsUsed } = event.detail;
        const question = function_domain_seed_1.functionDomainSeed.questions.find((item) => item.id === questionId);
        if (!question)
            return;
        const local = (0, grading_1.gradeAnswer)(question, userAnswer);
        let isCorrect = local.isCorrect;
        let gradingSource = "local";
        let aiReason = "";
        if (!isCorrect && (question.questionType === "fill_blank" || question.questionType === "example")) {
            const ai = await (0, ai_client_1.createAiClient)().gradeAnswerWithAi(questionId, userAnswer);
            if (ai.ok) {
                isCorrect = ai.isEquivalent === true;
                gradingSource = "ai";
                aiReason = ai.reason ?? "";
            }
        }
        (0, storage_1.createMiniStorageRepository)((0, storage_1.createWxStorageAdapter)()).recordAttempt({
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
    onFeynmanInput(event) {
        const promptId = String(event.currentTarget.dataset.id);
        this.setData({ [`feynmanText.${promptId}`]: event.detail.value });
    },
    async submitFeynman(event) {
        const promptId = String(event.currentTarget.dataset.id);
        const prompt = String(event.currentTarget.dataset.prompt);
        const userText = this.data.feynmanText[promptId] ?? "";
        const result = await (0, ai_client_1.createAiClient)().evaluateFeynman(prompt, userText);
        if (result.ok) {
            (0, storage_1.createMiniStorageRepository)((0, storage_1.createWxStorageAdapter)()).recordFeynmanOutput({
                promptId,
                prompt,
                userText,
                aiFeedback: result.aiFeedback ?? "",
                score: result.score ?? 0
            });
            this.setData({ [`feynmanFeedback.${promptId}`]: result.aiFeedback ?? "" });
        }
        else {
            this.setData({ [`feynmanFeedback.${promptId}`]: result.error ?? "AI 暂不可用，请稍后再试。" });
        }
    }
});
