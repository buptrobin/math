"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const function_domain_seed_1 = require("../../shared/data/function-domain.seed");
const math_text_1 = require("../../shared/lib/math-text");
const storage_1 = require("../../shared/lib/storage");
Page({
    data: {
        tasks: []
    },
    onShow() {
        this.refresh();
    },
    refresh() {
        const repo = (0, storage_1.createMiniStorageRepository)((0, storage_1.createWxStorageAdapter)());
        const tasks = repo.getDueReviewTasks().map((task) => {
            const question = function_domain_seed_1.functionDomainSeed.questions.find((item) => item.id === task.questionId);
            return {
                id: task.id,
                questionText: question ? (0, math_text_1.formatMathText)(question.questionText) : task.questionId,
                reviewStage: task.reviewStage
            };
        });
        this.setData({ tasks });
    },
    completeTask(event) {
        const taskId = String(event.currentTarget.dataset.id);
        (0, storage_1.createMiniStorageRepository)((0, storage_1.createWxStorageAdapter)()).completeReviewTask(taskId);
        this.refresh();
    }
});
