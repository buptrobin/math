"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWxStorageAdapter = createWxStorageAdapter;
exports.createMemoryStorageAdapter = createMemoryStorageAdapter;
exports.createMiniStorageRepository = createMiniStorageRepository;
const review_schedule_1 = require("./review-schedule");
const ATTEMPTS_KEY = "mathCoachAttempts";
const REVIEW_TASKS_KEY = "mathCoachReviewTasks";
const FEYNMAN_OUTPUTS_KEY = "mathCoachFeynmanOutputs";
const UI_STATE_KEY = "mathCoachUiState";
function createWxStorageAdapter() {
    return {
        get(key, fallback) {
            const value = wx.getStorageSync(key);
            return value === "" || value === undefined || value === null ? fallback : value;
        },
        set(key, value) {
            wx.setStorageSync(key, value);
        },
        remove(key) {
            wx.removeStorageSync(key);
        }
    };
}
function createMemoryStorageAdapter() {
    const store = new Map();
    return {
        get(key, fallback) {
            return store.has(key) ? store.get(key) : fallback;
        },
        set(key, value) {
            store.set(key, value);
        },
        remove(key) {
            store.delete(key);
        }
    };
}
function createMiniStorageRepository(adapter, nowIso = () => new Date().toISOString()) {
    const readAttempts = () => adapter.get(ATTEMPTS_KEY, []);
    const writeAttempts = (attempts) => adapter.set(ATTEMPTS_KEY, attempts);
    const readReviewTasks = () => adapter.get(REVIEW_TASKS_KEY, []);
    const writeReviewTasks = (tasks) => adapter.set(REVIEW_TASKS_KEY, tasks);
    const readFeynmanOutputs = () => adapter.get(FEYNMAN_OUTPUTS_KEY, []);
    const writeFeynmanOutputs = (outputs) => adapter.set(FEYNMAN_OUTPUTS_KEY, outputs);
    return {
        getAttempts: readAttempts,
        getReviewTasks: readReviewTasks,
        getFeynmanOutputs: readFeynmanOutputs,
        getDueReviewTasks(now = new Date()) {
            return readReviewTasks().filter((task) => task.status === "pending" && task.scheduledAt <= now.toISOString());
        },
        recordAttempt(input) {
            const createdAt = nowIso();
            const attempt = { ...input, id: `attempt-${createdAt}-${input.questionId}`, createdAt };
            writeAttempts([attempt, ...readAttempts()]);
            if (!input.isCorrect) {
                const reviewTasks = (0, review_schedule_1.createReviewSchedule)(new Date(createdAt)).map((item) => ({
                    id: `review-${createdAt}-${input.questionId}-${item.reviewStage}`,
                    questionId: input.questionId,
                    scheduledAt: item.scheduledAt,
                    status: "pending",
                    reviewStage: item.reviewStage
                }));
                writeReviewTasks([...reviewTasks, ...readReviewTasks()]);
            }
            return attempt;
        },
        completeReviewTask(taskId) {
            writeReviewTasks(readReviewTasks().map((task) => (task.id === taskId ? { ...task, status: "completed" } : task)));
        },
        recordFeynmanOutput(input) {
            const createdAt = nowIso();
            const output = { ...input, id: `feynman-${createdAt}-${input.promptId}`, createdAt };
            writeFeynmanOutputs([output, ...readFeynmanOutputs()]);
            return output;
        },
        resetAll() {
            adapter.remove(ATTEMPTS_KEY);
            adapter.remove(REVIEW_TASKS_KEY);
            adapter.remove(FEYNMAN_OUTPUTS_KEY);
            adapter.remove(UI_STATE_KEY);
        }
    };
}
