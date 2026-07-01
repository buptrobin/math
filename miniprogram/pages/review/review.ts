import { functionDomainSeed } from "../../shared/data/function-domain.seed";
import { formatMathText } from "../../shared/lib/math-text";
import { createMiniStorageRepository, createWxStorageAdapter } from "../../shared/lib/storage";

Page({
  data: {
    tasks: [] as Array<{ id: string; questionText: string; reviewStage: string }>
  },
  onShow(this: any) {
    this.refresh();
  },
  refresh(this: any) {
    const repo = createMiniStorageRepository(createWxStorageAdapter());
    const tasks = repo.getDueReviewTasks().map((task) => {
      const question = functionDomainSeed.questions.find((item) => item.id === task.questionId);
      return {
        id: task.id,
        questionText: question ? formatMathText(question.questionText) : task.questionId,
        reviewStage: task.reviewStage
      };
    });
    this.setData({ tasks });
  },
  completeTask(this: any, event: WechatMiniprogram.TouchEvent) {
    const taskId = String(event.currentTarget.dataset.id);
    createMiniStorageRepository(createWxStorageAdapter()).completeReviewTask(taskId);
    this.refresh();
  }
});
