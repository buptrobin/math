import { createReviewSchedule } from "./review-schedule";
import type { ErrorTag, ReviewStage } from "./types";

declare const wx: {
  getStorageSync(key: string): unknown;
  setStorageSync(key: string, value: unknown): void;
  removeStorageSync(key: string): void;
};

const ATTEMPTS_KEY = "mathCoachAttempts";
const REVIEW_TASKS_KEY = "mathCoachReviewTasks";
const FEYNMAN_OUTPUTS_KEY = "mathCoachFeynmanOutputs";
const UI_STATE_KEY = "mathCoachUiState";

export interface MiniAttempt {
  id: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  selectedErrorTag?: ErrorTag;
  hintsUsed: number;
  gradingSource: "local" | "ai";
  aiReason?: string;
  createdAt: string;
}

export interface MiniReviewTask {
  id: string;
  questionId: string;
  scheduledAt: string;
  status: "pending" | "completed";
  reviewStage: ReviewStage;
}

export interface MiniFeynmanOutput {
  id: string;
  promptId: string;
  prompt: string;
  userText: string;
  aiFeedback: string;
  score: number;
  createdAt: string;
}

export interface StorageAdapter {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

export function createWxStorageAdapter(): StorageAdapter {
  return {
    get<T>(key: string, fallback: T): T {
      const value = wx.getStorageSync(key);
      return value === "" || value === undefined || value === null ? fallback : (value as T);
    },
    set<T>(key: string, value: T) {
      wx.setStorageSync(key, value);
    },
    remove(key: string) {
      wx.removeStorageSync(key);
    }
  };
}

export function createMemoryStorageAdapter(): StorageAdapter {
  const store = new Map<string, unknown>();
  return {
    get<T>(key: string, fallback: T): T {
      return store.has(key) ? (store.get(key) as T) : fallback;
    },
    set<T>(key: string, value: T) {
      store.set(key, value);
    },
    remove(key: string) {
      store.delete(key);
    }
  };
}

export function createMiniStorageRepository(adapter: StorageAdapter, nowIso = () => new Date().toISOString()) {
  const readAttempts = () => adapter.get<MiniAttempt[]>(ATTEMPTS_KEY, []);
  const writeAttempts = (attempts: MiniAttempt[]) => adapter.set(ATTEMPTS_KEY, attempts);
  const readReviewTasks = () => adapter.get<MiniReviewTask[]>(REVIEW_TASKS_KEY, []);
  const writeReviewTasks = (tasks: MiniReviewTask[]) => adapter.set(REVIEW_TASKS_KEY, tasks);
  const readFeynmanOutputs = () => adapter.get<MiniFeynmanOutput[]>(FEYNMAN_OUTPUTS_KEY, []);
  const writeFeynmanOutputs = (outputs: MiniFeynmanOutput[]) => adapter.set(FEYNMAN_OUTPUTS_KEY, outputs);

  return {
    getAttempts: readAttempts,
    getReviewTasks: readReviewTasks,
    getFeynmanOutputs: readFeynmanOutputs,
    getDueReviewTasks(now = new Date()) {
      return readReviewTasks().filter((task) => task.status === "pending" && task.scheduledAt <= now.toISOString());
    },
    recordAttempt(input: Omit<MiniAttempt, "id" | "createdAt">) {
      const createdAt = nowIso();
      const attempt: MiniAttempt = { ...input, id: `attempt-${createdAt}-${input.questionId}`, createdAt };
      writeAttempts([attempt, ...readAttempts()]);

      if (!input.isCorrect) {
        const reviewTasks = createReviewSchedule(new Date(createdAt)).map((item) => ({
          id: `review-${createdAt}-${input.questionId}-${item.reviewStage}`,
          questionId: input.questionId,
          scheduledAt: item.scheduledAt,
          status: "pending" as const,
          reviewStage: item.reviewStage
        }));
        writeReviewTasks([...reviewTasks, ...readReviewTasks()]);
      }

      return attempt;
    },
    completeReviewTask(taskId: string) {
      writeReviewTasks(readReviewTasks().map((task) => (task.id === taskId ? { ...task, status: "completed" } : task)));
    },
    recordFeynmanOutput(input: Omit<MiniFeynmanOutput, "id" | "createdAt">) {
      const createdAt = nowIso();
      const output: MiniFeynmanOutput = { ...input, id: `feynman-${createdAt}-${input.promptId}`, createdAt };
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
