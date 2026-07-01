import { functionDomainSeed } from "../../shared/data/function-domain.seed";
import { deriveMiniProgress } from "../../shared/lib/progress";
import { createMiniStorageRepository, createWxStorageAdapter } from "../../shared/lib/storage";

Page({
  data: {
    knowledgePoint: functionDomainSeed.knowledgePoint,
    lessons: functionDomainSeed.lessons,
    progress: { totalAttempts: 0, wrongAttempts: 0, dueReviews: 0, status: "未开始" }
  },
  onShow(this: any) {
    const repo = createMiniStorageRepository(createWxStorageAdapter());
    const dueReviews = repo.getDueReviewTasks().length;
    const attempts = repo.getAttempts().map((item) => ({ questionId: item.questionId, isCorrect: item.isCorrect }));
    this.setData({ progress: deriveMiniProgress({ attempts, dueReviews }) });
  },
  openLesson(event: WechatMiniprogram.TouchEvent) {
    wx.navigateTo({ url: `/pages/lesson/lesson?lessonId=${event.currentTarget.dataset.lessonId}` });
  },
  openReview() {
    wx.navigateTo({ url: "/pages/review/review" });
  },
  resetProgress(this: any) {
    createMiniStorageRepository(createWxStorageAdapter()).resetAll();
    this.onShow();
  }
});
