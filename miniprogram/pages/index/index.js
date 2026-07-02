"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const function_domain_seed_1 = require("../../shared/data/function-domain.seed");
const progress_1 = require("../../shared/lib/progress");
const storage_1 = require("../../shared/lib/storage");
Page({
    data: {
        knowledgePoint: function_domain_seed_1.functionDomainSeed.knowledgePoint,
        lessons: function_domain_seed_1.functionDomainSeed.lessons,
        progress: { totalAttempts: 0, wrongAttempts: 0, dueReviews: 0, status: "未开始" }
    },
    onShow() {
        const repo = (0, storage_1.createMiniStorageRepository)((0, storage_1.createWxStorageAdapter)());
        const dueReviews = repo.getDueReviewTasks().length;
        const attempts = repo.getAttempts().map((item) => ({ questionId: item.questionId, isCorrect: item.isCorrect }));
        this.setData({ progress: (0, progress_1.deriveMiniProgress)({ attempts, dueReviews }) });
    },
    openLesson(event) {
        wx.navigateTo({ url: `/pages/lesson/lesson?lessonId=${event.currentTarget.dataset.lessonId}` });
    },
    openReview() {
        wx.navigateTo({ url: "/pages/review/review" });
    },
    resetProgress() {
        (0, storage_1.createMiniStorageRepository)((0, storage_1.createWxStorageAdapter)()).resetAll();
        this.onShow();
    }
});
