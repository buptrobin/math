# 微信小程序本地存储 + AI MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增一个原生微信小程序 MVP，使用本地存储保存学习进度，并通过 `aiCoach` 云函数代理 DeepSeek 完成 AI 判题兜底和费曼反馈。

**Architecture:** 保留现有 Next.js 应用不动，在 `miniprogram/` 下新增小程序项目。小程序端复用题库、类型、确定性判题、复习计划等纯逻辑；运行时进度写入微信本地存储；AI 请求全部通过云函数代理，前端不包含密钥。

**Tech Stack:** 微信原生小程序、TypeScript、WXML/WXSS、微信云函数 Node.js、Vitest、现有 Next.js/TypeScript 项目工具链。

---

## 文件结构

- Create: `miniprogram/app.json`，小程序页面和全局窗口配置。
- Create: `miniprogram/app.ts`，初始化云开发并保持小程序入口最小化。
- Create: `miniprogram/app.wxss`，全局色彩、排版和安全区域样式。
- Create: `miniprogram/project.config.json`，微信开发者工具项目配置。
- Create: `miniprogram/pages/index/*`，学习首页、进度摘要、课程入口、重置入口。
- Create: `miniprogram/pages/lesson/*`，课程详情、题目流、费曼输出。
- Create: `miniprogram/pages/review/*`，本地到期错题复习。
- Create: `miniprogram/components/question-card/*`，题目展示、选项、输入、提示、提交状态。
- Create: `miniprogram/components/progress-summary/*`，首页进度摘要组件。
- Create: `miniprogram/shared/data/function-domain.seed.ts`，从现有 `data/function-domain.seed.ts` 复制并改为相对类型导入。
- Create: `miniprogram/shared/lib/types.ts`，从现有 `lib/types.ts` 复制。
- Create: `miniprogram/shared/lib/grading.ts`，从现有 `lib/grading.ts` 复制并改为相对类型导入。
- Create: `miniprogram/shared/lib/review-schedule.ts`，从现有 `lib/review-schedule.ts` 复制并改为相对类型导入。
- Create: `miniprogram/shared/lib/progress.ts`，适配小程序本地 attempt 记录的进度派生。
- Create: `miniprogram/shared/lib/math-text.ts`，把 seed 中的简单 LaTeX 降级为小程序可读文本。
- Create: `miniprogram/shared/lib/storage.ts`，封装本地存储仓库和内存适配器。
- Create: `miniprogram/shared/lib/ai-client.ts`，封装 `wx.cloud.callFunction` AI 调用和失败兜底。
- Create: `miniprogram/cloudfunctions/aiCoach/index.js`，DeepSeek 代理云函数。
- Create: `miniprogram/cloudfunctions/aiCoach/package.json`，云函数依赖。
- Create: `tests/miniprogram-storage.test.ts`，本地存储仓库测试。
- Create: `tests/miniprogram-ai-client.test.ts`，AI 客户端兜底测试。
- Modify: `.gitignore`，忽略微信开发者工具本地私有文件。

## Task 1: 小程序项目骨架

**Files:**
- Create: `miniprogram/app.json`
- Create: `miniprogram/app.ts`
- Create: `miniprogram/app.wxss`
- Create: `miniprogram/project.config.json`
- Create: `miniprogram/pages/index/index.json`
- Create: `miniprogram/pages/index/index.wxml`
- Create: `miniprogram/pages/index/index.wxss`
- Create: `miniprogram/pages/index/index.ts`
- Modify: `.gitignore`

- [ ] **Step 1: 创建最小小程序入口文件**

写入 `miniprogram/app.json`：

```json
{
  "pages": [
    "pages/index/index",
    "pages/lesson/lesson",
    "pages/review/review"
  ],
  "window": {
    "navigationBarTitleText": "函数定义域教练",
    "navigationBarBackgroundColor": "#1f4f46",
    "navigationBarTextStyle": "white",
    "backgroundColor": "#f6f2ea"
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}
```

写入 `miniprogram/app.ts`：

```ts
App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({ traceUser: true });
    }
  }
});
```

写入 `miniprogram/app.wxss`：

```css
page {
  min-height: 100%;
  background: #f6f2ea;
  color: #1f2933;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button {
  border-radius: 6px;
}

.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 28rpx;
}
```

- [ ] **Step 2: 创建微信开发者工具配置**

写入 `miniprogram/project.config.json`：

```json
{
  "description": "函数定义域教练小程序 MVP",
  "setting": {
    "urlCheck": true,
    "es6": true,
    "postcss": true,
    "minified": true,
    "enhance": true
  },
  "compileType": "miniprogram",
  "libVersion": "latest",
  "appid": "touristappid",
  "projectname": "function-domain-coach-miniprogram",
  "miniprogramRoot": "./",
  "cloudfunctionRoot": "cloudfunctions/"
}
```

- [ ] **Step 3: 创建可启动首页占位**

写入 `miniprogram/pages/index/index.json`：

```json
{
  "navigationBarTitleText": "函数定义域教练"
}
```

写入 `miniprogram/pages/index/index.wxml`：

```xml
<view class="page indexPage">
  <view class="hero">
    <text class="eyebrow">函数基础</text>
    <text class="title">函数定义域教练</text>
    <text class="subtitle">先诊断，再练习，再复习。</text>
  </view>
</view>
```

写入 `miniprogram/pages/index/index.wxss`：

```css
.hero {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 28rpx;
  background: #ffffff;
  border: 1rpx solid #d8e2dc;
  border-radius: 8rpx;
}

.eyebrow {
  color: #2f6f62;
  font-size: 24rpx;
}

.title {
  font-size: 42rpx;
  font-weight: 700;
}

.subtitle {
  color: #52616b;
  font-size: 28rpx;
}
```

写入 `miniprogram/pages/index/index.ts`：

```ts
Page({});
```

- [ ] **Step 4: 更新忽略规则**

在 `.gitignore` 末尾追加：

```gitignore
miniprogram/project.private.config.json
miniprogram/miniprogram_npm/
```

- [ ] **Step 5: 验证当前 Web 测试仍通过**

Run: `npm.cmd test`

Expected: Vitest 现有测试通过。

- [ ] **Step 6: 提交骨架**

```powershell
git add .gitignore miniprogram
git commit -m "feat: add mini program shell"
```

## Task 2: 迁移共享题库和纯逻辑

**Files:**
- Create: `miniprogram/shared/lib/types.ts`
- Create: `miniprogram/shared/lib/grading.ts`
- Create: `miniprogram/shared/lib/review-schedule.ts`
- Create: `miniprogram/shared/lib/math-text.ts`
- Create: `miniprogram/shared/data/function-domain.seed.ts`
- Create: `tests/miniprogram-shared.test.ts`

- [ ] **Step 1: 先写共享逻辑测试**

写入 `tests/miniprogram-shared.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { functionDomainSeed } from "../miniprogram/shared/data/function-domain.seed";
import { gradeAnswer, normalizeAnswer } from "../miniprogram/shared/lib/grading";
import { createReviewSchedule } from "../miniprogram/shared/lib/review-schedule";
import { formatMathText } from "../miniprogram/shared/lib/math-text";

describe("mini program shared grading", () => {
  it("normalizes equivalent interval and inequality answers", () => {
    expect(normalizeAnswer("x >= 1 且 x != 3")).toBe("x≥1且x≠3");
  });

  it("grades seed answers with the migrated question data", () => {
    const question = functionDomainSeed.questions.find((item) => item.id === "q-diagnostic-3");
    expect(question).toBeDefined();
    expect(gradeAnswer(question!, "x >= 1 且 x != 3").isCorrect).toBe(true);
  });
});

describe("mini program review schedule", () => {
  it("creates same day, three day, and seven day review tasks", () => {
    const schedule = createReviewSchedule(new Date("2026-07-01T00:00:00.000Z"));
    expect(schedule).toEqual([
      { reviewStage: "same_day", scheduledAt: "2026-07-01T00:00:00.000Z" },
      { reviewStage: "three_days", scheduledAt: "2026-07-04T00:00:00.000Z" },
      { reviewStage: "seven_days", scheduledAt: "2026-07-08T00:00:00.000Z" }
    ]);
  });
});

describe("mini program math text fallback", () => {
  it("turns simple latex into readable text", () => {
    expect(formatMathText("$y=\\frac{1}{x-2}$，$x\\ge 1$")).toBe("y=1/(x-2)，x≥1");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm.cmd test -- tests/miniprogram-shared.test.ts`

Expected: FAIL，提示找不到 `miniprogram/shared/...` 模块。

- [ ] **Step 3: 复制类型并调整导入**

从 `lib/types.ts` 复制完整内容到 `miniprogram/shared/lib/types.ts`。

从 `lib/grading.ts` 复制到 `miniprogram/shared/lib/grading.ts`，把第一行改为：

```ts
import type { QuestionSeed } from "./types";
```

从 `lib/review-schedule.ts` 复制到 `miniprogram/shared/lib/review-schedule.ts`，把第一行改为：

```ts
import type { ReviewStage } from "./types";
```

- [ ] **Step 4: 复制题库并调整导入**

从 `data/function-domain.seed.ts` 复制完整内容到 `miniprogram/shared/data/function-domain.seed.ts`，把第一行改为：

```ts
import type { LessonContentSeed } from "../lib/types";
```

- [ ] **Step 5: 实现小程序公式文本降级**

写入 `miniprogram/shared/lib/math-text.ts`：

```ts
const replacements: Array<[RegExp, string]> = [
  [/\$/g, ""],
  [/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "$1/($2)"],
  [/\\sqrt\{([^{}]+)\}/g, "√($1)"],
  [/\\geq?/g, "≥"],
  [/\\leq?/g, "≤"],
  [/\\ne(q)?/g, "≠"],
  [/\\cup/g, "∪"],
  [/\\infty/g, "∞"],
  [/\s+/g, " "]
];

export function formatMathText(value: string): string {
  return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value).trim();
}
```

- [ ] **Step 6: 运行共享测试通过**

Run: `npm.cmd test -- tests/miniprogram-shared.test.ts`

Expected: PASS。

- [ ] **Step 7: 提交共享逻辑**

```powershell
git add miniprogram/shared tests/miniprogram-shared.test.ts
git commit -m "feat: add mini program shared lesson logic"
```

## Task 3: 本地存储仓库

**Files:**
- Create: `miniprogram/shared/lib/storage.ts`
- Create: `miniprogram/shared/lib/progress.ts`
- Create: `tests/miniprogram-storage.test.ts`

- [ ] **Step 1: 写本地存储测试**

写入 `tests/miniprogram-storage.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { createMiniStorageRepository, createMemoryStorageAdapter } from "../miniprogram/shared/lib/storage";
import { deriveMiniProgress } from "../miniprogram/shared/lib/progress";

describe("mini program local storage repository", () => {
  it("records attempts and creates review tasks for wrong answers", () => {
    const adapter = createMemoryStorageAdapter();
    const repo = createMiniStorageRepository(adapter, () => "2026-07-01T00:00:00.000Z");

    repo.recordAttempt({
      questionId: "q-diagnostic-3",
      userAnswer: "x>1",
      isCorrect: false,
      hintsUsed: 2,
      gradingSource: "local"
    });

    expect(repo.getAttempts()).toHaveLength(1);
    expect(repo.getReviewTasks()).toHaveLength(3);
    expect(repo.getDueReviewTasks(new Date("2026-07-01T00:00:01.000Z"))).toHaveLength(1);
  });

  it("clears attempts, review tasks, and feynman outputs", () => {
    const adapter = createMemoryStorageAdapter();
    const repo = createMiniStorageRepository(adapter, () => "2026-07-01T00:00:00.000Z");

    repo.recordAttempt({
      questionId: "q-diagnostic-1",
      userAnswer: "A",
      isCorrect: true,
      hintsUsed: 0,
      gradingSource: "local"
    });
    repo.recordFeynmanOutput({
      promptId: "feynman-1",
      prompt: "请解释定义域",
      userText: "定义域是 x 可以取的范围。",
      aiFeedback: "继续补充限制条件。",
      score: 60
    });

    repo.resetAll();

    expect(repo.getAttempts()).toEqual([]);
    expect(repo.getReviewTasks()).toEqual([]);
    expect(repo.getFeynmanOutputs()).toEqual([]);
  });
});

describe("mini program progress", () => {
  it("derives status from local attempt records", () => {
    const progress = deriveMiniProgress({
      attempts: [{ questionId: "q-var-1", isCorrect: true }],
      dueReviews: 0
    });

    expect(progress.totalAttempts).toBe(1);
    expect(progress.status).toBe("诊断中");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm.cmd test -- tests/miniprogram-storage.test.ts`

Expected: FAIL，提示找不到 `storage` 和 `progress` 模块。

- [ ] **Step 3: 实现进度派生**

写入 `miniprogram/shared/lib/progress.ts`：

```ts
import type { KnowledgeStatus } from "./types";

export interface MiniProgressSummary {
  totalAttempts: number;
  wrongAttempts: number;
  dueReviews: number;
  consecutiveVariationCorrect: number;
  status: KnowledgeStatus;
}

export function deriveMiniProgress(input: {
  attempts: Array<{ questionId: string; isCorrect: boolean }>;
  dueReviews: number;
}): MiniProgressSummary {
  const totalAttempts = input.attempts.length;
  const wrongAttempts = input.attempts.filter((attempt) => !attempt.isCorrect).length;
  const variationAttempts = input.attempts.filter((attempt) => attempt.questionId.startsWith("q-var-"));
  let consecutiveVariationCorrect = 0;

  for (const attempt of variationAttempts) {
    if (attempt.isCorrect) {
      consecutiveVariationCorrect += 1;
    } else {
      break;
    }
  }

  const status: KnowledgeStatus =
    totalAttempts === 0
      ? "未开始"
      : input.dueReviews > 0
        ? "练习中"
        : consecutiveVariationCorrect >= 3 && wrongAttempts > 0
          ? "已通关"
          : totalAttempts < 5
            ? "诊断中"
            : "学习中";

  return { totalAttempts, wrongAttempts, dueReviews: input.dueReviews, consecutiveVariationCorrect, status };
}
```

- [ ] **Step 4: 实现本地存储仓库**

写入 `miniprogram/shared/lib/storage.ts`：

```ts
import { createReviewSchedule } from "./review-schedule";
import type { ErrorTag, ReviewStage } from "./types";

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
```

- [ ] **Step 5: 运行存储测试通过**

Run: `npm.cmd test -- tests/miniprogram-storage.test.ts`

Expected: PASS。

- [ ] **Step 6: 提交本地存储**

```powershell
git add miniprogram/shared/lib/storage.ts miniprogram/shared/lib/progress.ts tests/miniprogram-storage.test.ts
git commit -m "feat: add mini program local progress storage"
```

## Task 4: AI 客户端和云函数

**Files:**
- Create: `miniprogram/shared/lib/ai-client.ts`
- Create: `tests/miniprogram-ai-client.test.ts`
- Create: `miniprogram/cloudfunctions/aiCoach/index.js`
- Create: `miniprogram/cloudfunctions/aiCoach/package.json`

- [ ] **Step 1: 写 AI 客户端测试**

写入 `tests/miniprogram-ai-client.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { createAiClient } from "../miniprogram/shared/lib/ai-client";

describe("mini program AI client", () => {
  it("returns grade result from cloud function", async () => {
    const client = createAiClient(async () => ({
      result: { ok: true, mode: "grade", isEquivalent: true, reason: "集合等价" }
    }));

    const result = await client.gradeAnswerWithAi("q-diagnostic-3", "x≥1且x≠3");

    expect(result).toEqual({ ok: true, isEquivalent: true, reason: "集合等价" });
  });

  it("returns a safe error when the cloud function rejects", async () => {
    const client = createAiClient(async () => {
      throw new Error("network failed");
    });

    const result = await client.evaluateFeynman("请解释定义域", "定义域是 x 的范围。");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("AI 暂不可用，请稍后再试。");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm.cmd test -- tests/miniprogram-ai-client.test.ts`

Expected: FAIL，提示找不到 `ai-client` 模块。

- [ ] **Step 3: 实现 AI 客户端**

写入 `miniprogram/shared/lib/ai-client.ts`：

```ts
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
```

- [ ] **Step 4: 运行 AI 客户端测试通过**

Run: `npm.cmd test -- tests/miniprogram-ai-client.test.ts`

Expected: PASS。

- [ ] **Step 5: 实现云函数 package**

写入 `miniprogram/cloudfunctions/aiCoach/package.json`：

```json
{
  "name": "ai-coach",
  "version": "1.0.0",
  "private": true,
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "latest"
  }
}
```

- [ ] **Step 6: 实现云函数**

写入 `miniprogram/cloudfunctions/aiCoach/index.js`：

```js
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const questions = [
  {
    id: "q-diagnostic-3",
    questionText: "$y=\\frac{\\sqrt{x-1}}{x-3}$ 的定义域是什么？",
    correctAnswer: "[1,3)∪(3,+∞)",
    acceptedAnswers: ["[1,3)∪(3,+∞)", "[1,3)U(3,+∞)", "x≥1且x≠3", "x >= 1 且 x != 3", "x≥1，x≠3"]
  },
  {
    id: "q-example-1",
    questionText: "母题拆解：求 $y=\\frac{\\sqrt{x-1}}{x-3}$ 的定义域。",
    correctAnswer: "[1,3)∪(3,+∞)",
    acceptedAnswers: ["[1,3)∪(3,+∞)", "x≥1且x≠3"]
  }
];

exports.main = async (event) => {
  try {
    if (!event || typeof event.mode !== "string") {
      return { ok: false, error: "请求参数无效。" };
    }

    if (event.mode === "grade") {
      return await grade(event);
    }

    if (event.mode === "feynman") {
      return await feynman(event);
    }

    return { ok: false, error: "不支持的 AI 模式。" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "AI 请求失败。" };
  }
};

async function grade(event) {
  if (typeof event.questionId !== "string" || typeof event.userAnswer !== "string") {
    return { ok: false, error: "判题参数无效。" };
  }

  const question = questions.find((item) => item.id === event.questionId);
  if (!question) {
    return { ok: false, error: "未找到题目。" };
  }

  const result = await callDeepSeek([
    {
      role: "system",
      content:
        "你是高中数学函数定义域填空题判题器。只判断学生答案表示的自变量取值集合是否与标准答案相同。只输出 JSON：{\"is_equivalent\": boolean, \"reason\": string}。"
    },
    {
      role: "user",
      content: JSON.stringify({
        question: question.questionText,
        correctAnswer: question.correctAnswer,
        acceptedAnswers: question.acceptedAnswers,
        studentAnswer: event.userAnswer
      })
    }
  ]);

  return {
    ok: true,
    mode: "grade",
    isEquivalent: result.is_equivalent === true,
    reason: typeof result.reason === "string" ? result.reason : ""
  };
}

async function feynman(event) {
  if (typeof event.prompt !== "string" || typeof event.userText !== "string" || event.userText.trim().length === 0) {
    return { ok: false, error: "费曼输出参数无效。" };
  }

  const result = await callDeepSeek([
    {
      role: "system",
      content:
        "你是高中数学函数定义域学习教练。根据学生解释给出 40 到 100 的整数分数和一句简短反馈。只输出 JSON：{\"score\": number, \"aiFeedback\": string}。"
    },
    {
      role: "user",
      content: JSON.stringify({ prompt: event.prompt, studentText: event.userText })
    }
  ]);

  return {
    ok: true,
    mode: "feynman",
    score: Number.isFinite(result.score) ? Math.max(40, Math.min(100, Math.round(result.score))) : 60,
    aiFeedback: typeof result.aiFeedback === "string" ? result.aiFeedback : "请补充定义域与限制条件之间的关系。"
  };
}

async function callDeepSeek(messages) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("AI 未配置。");
  }

  const endpoint = process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com/chat/completions";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, response_format: { type: "json_object" }, temperature: 0, stream: false, messages })
  });

  if (!response.ok) {
    throw new Error(`AI 请求失败：${response.status}`);
  }

  const payload = await response.json();
  const content = payload && payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
  if (!content) {
    throw new Error("AI 没有返回内容。");
  }
  return JSON.parse(content);
}
```

- [ ] **Step 7: 运行相关测试**

Run: `npm.cmd test -- tests/miniprogram-ai-client.test.ts`

Expected: PASS。

- [ ] **Step 8: 提交 AI 客户端和云函数**

```powershell
git add miniprogram/shared/lib/ai-client.ts miniprogram/cloudfunctions/aiCoach tests/miniprogram-ai-client.test.ts
git commit -m "feat: add mini program ai coach function"
```

## Task 5: 首页、课程页和复习页

**Files:**
- Create: `miniprogram/components/progress-summary/*`
- Create: `miniprogram/components/question-card/*`
- Modify: `miniprogram/pages/index/*`
- Create: `miniprogram/pages/lesson/*`
- Create: `miniprogram/pages/review/*`

- [ ] **Step 1: 创建进度摘要组件**

写入 `miniprogram/components/progress-summary/progress-summary.json`：

```json
{
  "component": true
}
```

写入 `miniprogram/components/progress-summary/progress-summary.wxml`：

```xml
<view class="summary">
  <view><text class="label">状态</text><text class="value">{{status}}</text></view>
  <view><text class="label">作答</text><text class="value">{{totalAttempts}}</text></view>
  <view><text class="label">错题</text><text class="value">{{wrongAttempts}}</text></view>
  <view><text class="label">待复习</text><text class="value">{{dueReviews}}</text></view>
</view>
```

写入 `miniprogram/components/progress-summary/progress-summary.ts`：

```ts
Component({
  properties: {
    status: { type: String, value: "未开始" },
    totalAttempts: { type: Number, value: 0 },
    wrongAttempts: { type: Number, value: 0 },
    dueReviews: { type: Number, value: 0 }
  }
});
```

写入 `miniprogram/components/progress-summary/progress-summary.wxss`：

```css
.summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
  padding: 20rpx;
  background: #ffffff;
  border: 1rpx solid #d8e2dc;
  border-radius: 8rpx;
}

.label, .value {
  display: block;
  text-align: center;
}

.label {
  color: #667085;
  font-size: 22rpx;
}

.value {
  margin-top: 6rpx;
  font-size: 28rpx;
  font-weight: 700;
}
```

- [ ] **Step 2: 创建题目卡组件**

写入 `miniprogram/components/question-card/question-card.json`：

```json
{
  "component": true
}
```

写入 `miniprogram/components/question-card/question-card.wxml`：

```xml
<view class="card">
  <view class="meta">
    <text>难度 {{question.difficulty}}</text>
    <text>{{question.examPoint}}</text>
  </view>
  <text class="question">{{displayQuestionText}}</text>

  <view wx:if="{{question.options && question.options.length}}" class="options">
    <button
      wx:for="{{question.options}}"
      wx:key="*this"
      class="option {{answer === item ? 'selected' : ''}}"
      data-answer="{{item}}"
      bindtap="selectOption"
    >{{item}}</button>
  </view>

  <input
    wx:else
    class="answerInput"
    value="{{answer}}"
    placeholder="请输入答案"
    bindinput="onInput"
  />

  <view class="hints" wx:if="{{visibleHints.length}}">
    <text wx:for="{{visibleHints}}" wx:key="*this" class="hint">{{item}}</text>
  </view>

  <view class="actions">
    <button size="mini" bindtap="showHint" disabled="{{visibleHints.length >= question.hints.length}}">提示</button>
    <button size="mini" type="primary" bindtap="submit" disabled="{{!answer}}">提交</button>
  </view>

  <view wx:if="{{result}}" class="result {{result.isCorrect ? 'correct' : 'wrong'}}">
    <text>{{result.isCorrect ? '回答正确' : '再想一想'}}</text>
    <text>{{result.explanation}}</text>
    <text wx:if="{{result.commonMistake}}">常见错误：{{result.commonMistake}}</text>
    <text wx:if="{{result.aiReason}}">AI 判断：{{result.aiReason}}</text>
  </view>
</view>
```

写入 `miniprogram/components/question-card/question-card.ts`：

```ts
import { formatMathText } from "../../shared/lib/math-text";

Component({
  properties: {
    question: { type: Object, value: null },
    result: { type: Object, value: null }
  },
  data: {
    answer: "",
    visibleHints: [] as string[],
    displayQuestionText: ""
  },
  observers: {
    question(question) {
      this.setData({
        answer: "",
        visibleHints: [],
        displayQuestionText: question ? formatMathText(question.questionText) : ""
      });
    }
  },
  methods: {
    selectOption(event: WechatMiniprogram.TouchEvent) {
      this.setData({ answer: String(event.currentTarget.dataset.answer ?? "") });
    },
    onInput(event: WechatMiniprogram.Input) {
      this.setData({ answer: event.detail.value });
    },
    showHint() {
      const question = this.properties.question as { hints?: string[] } | null;
      const hints = question?.hints ?? [];
      const next = hints.slice(0, this.data.visibleHints.length + 1);
      this.setData({ visibleHints: next });
    },
    submit() {
      const question = this.properties.question as { id: string } | null;
      if (!question || !this.data.answer.trim()) {
        return;
      }
      this.triggerEvent("submit", {
        questionId: question.id,
        userAnswer: this.data.answer,
        hintsUsed: this.data.visibleHints.length
      });
    }
  }
});
```

写入 `miniprogram/components/question-card/question-card.wxss`：

```css
.card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 22rpx;
  background: #ffffff;
  border: 1rpx solid #d8e2dc;
  border-radius: 8rpx;
}

.meta, .actions {
  display: flex;
  justify-content: space-between;
  gap: 12rpx;
  color: #667085;
  font-size: 22rpx;
}

.question {
  font-size: 30rpx;
  line-height: 1.55;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.option {
  text-align: left;
  background: #f8faf9;
}

.selected {
  border: 2rpx solid #2f6f62;
}

.answerInput {
  min-height: 72rpx;
  padding: 0 18rpx;
  background: #f8faf9;
  border: 1rpx solid #d8e2dc;
  border-radius: 6rpx;
}

.hint, .result text {
  display: block;
  margin-top: 8rpx;
}

.result {
  padding: 16rpx;
  border-radius: 6rpx;
}

.correct {
  background: #e8f5ee;
}

.wrong {
  background: #fff4e5;
}
```

- [ ] **Step 3: 实现首页数据绑定**

`miniprogram/pages/index/index.json` 增加组件：

```json
{
  "navigationBarTitleText": "函数定义域教练",
  "usingComponents": {
    "progress-summary": "../../components/progress-summary/progress-summary"
  }
}
```

`index.ts` 从 seed、storage、progress 读取数据，设置：

```ts
Page({
  data: {
    knowledgePoint: functionDomainSeed.knowledgePoint,
    lessons: functionDomainSeed.lessons,
    progress: { totalAttempts: 0, wrongAttempts: 0, dueReviews: 0, status: "未开始" }
  },
  onShow() {
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
  resetProgress() {
    createMiniStorageRepository(createWxStorageAdapter()).resetAll();
    this.onShow();
  }
});
```

- [ ] **Step 4: 实现课程页提交流**

写入 `miniprogram/pages/lesson/lesson.json`：

```json
{
  "navigationBarTitleText": "课程练习",
  "usingComponents": {
    "question-card": "../../components/question-card/question-card"
  }
}
```

写入 `miniprogram/pages/lesson/lesson.wxml`：

```xml
<view class="page lessonPage">
  <view class="sectionHeader">
    <text class="eyebrow">第 {{lesson.orderIndex}} 环节</text>
    <text class="title">{{lesson.title}}</text>
  </view>

  <view wx:if="{{isTextbook}}" class="textBlock">
    <text class="blockTitle">课本说法</text>
    <text>{{textbookFormal}}</text>
    <text class="blockTitle">孩子版解释</text>
    <text>{{textbookFriendly}}</text>
    <text wx:for="{{ruleCards}}" wx:key="*this" class="rule">{{item}}</text>
  </view>

  <view wx:if="{{isFeynman}}" class="feynmanList">
    <view wx:for="{{feynmanPrompts}}" wx:key="id" class="feynmanCard">
      <text>{{item.prompt}}</text>
      <textarea data-id="{{item.id}}" data-prompt="{{item.prompt}}" bindinput="onFeynmanInput" placeholder="用自己的话讲一遍" />
      <button type="primary" size="mini" data-id="{{item.id}}" data-prompt="{{item.prompt}}" bindtap="submitFeynman">提交讲解</button>
      <text wx:if="{{feynmanFeedback[item.id]}}">{{feynmanFeedback[item.id]}}</text>
    </view>
  </view>

  <question-card
    wx:for="{{questions}}"
    wx:key="id"
    question="{{item}}"
    result="{{results[item.id]}}"
    bind:submit="submitAnswer"
  />
</view>
```

写入 `miniprogram/pages/lesson/lesson.ts`：

```ts
import { functionDomainSeed } from "../../shared/data/function-domain.seed";
import { createAiClient } from "../../shared/lib/ai-client";
import { gradeAnswer } from "../../shared/lib/grading";
import { formatMathText } from "../../shared/lib/math-text";
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
  onLoad(query) {
    const lessonId = String(query.lessonId ?? functionDomainSeed.lessons[0].id);
    const lesson = functionDomainSeed.lessons.find((item) => item.id === lessonId) ?? functionDomainSeed.lessons[0];
    this.setData({
      lesson,
      questions: functionDomainSeed.questions.filter((item) => item.lessonId === lesson.id),
      isTextbook: lesson.sectionType === "textbook_explanation",
      isFeynman: lesson.sectionType === "feynman_output",
      textbookFormal: formatMathText(functionDomainSeed.textbookExplanation.formal),
      textbookFriendly: formatMathText(functionDomainSeed.textbookExplanation.studentFriendly),
      ruleCards: functionDomainSeed.textbookExplanation.ruleCards.map(formatMathText)
    });
  },
  async submitAnswer(event: WechatMiniprogram.CustomEvent) {
    const { questionId, userAnswer, hintsUsed } = event.detail as { questionId: string; userAnswer: string; hintsUsed: number };
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
        explanation: formatMathText(question.explanation),
        commonMistake: question.commonMistake,
        aiReason
      }
    });
  },
  onFeynmanInput(event: WechatMiniprogram.Input) {
    const promptId = String(event.currentTarget.dataset.id);
    this.setData({ [`feynmanText.${promptId}`]: event.detail.value });
  },
  async submitFeynman(event: WechatMiniprogram.TouchEvent) {
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
```

写入 `miniprogram/pages/lesson/lesson.wxss`：

```css
.lessonPage {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.sectionHeader, .textBlock, .feynmanCard {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 22rpx;
  background: #ffffff;
  border: 1rpx solid #d8e2dc;
  border-radius: 8rpx;
}

.eyebrow {
  color: #2f6f62;
  font-size: 24rpx;
}

.title {
  font-size: 38rpx;
  font-weight: 700;
}

.blockTitle {
  margin-top: 8rpx;
  font-weight: 700;
}

.rule {
  padding: 12rpx;
  background: #f8faf9;
  border-radius: 6rpx;
}

textarea {
  min-height: 150rpx;
  padding: 14rpx;
  background: #f8faf9;
  border: 1rpx solid #d8e2dc;
  border-radius: 6rpx;
}
```

- [ ] **Step 5: 实现费曼输出流**

费曼输出已包含在 Step 4 的 `lesson.wxml` 和 `lesson.ts` 中。执行时手动验证：打开“费曼输出”环节，输入“定义域是让式子有意义的 x 的取值范围”，点击提交。如果云函数未配置，应显示“AI 暂不可用，请稍后再试。”；如果云函数已配置，应显示 AI 反馈并写入 `mathCoachFeynmanOutputs`。

- [ ] **Step 6: 实现复习页**

写入 `miniprogram/pages/review/review.json`：

```json
{
  "navigationBarTitleText": "错题复习"
}
```

写入 `miniprogram/pages/review/review.wxml`：

```xml
<view class="page reviewPage">
  <view class="header">
    <text class="title">错题复习</text>
    <text class="subtitle">到期任务 {{tasks.length}} 个</text>
  </view>
  <view wx:if="{{!tasks.length}}" class="empty">当前没有到期复习任务。</view>
  <view wx:for="{{tasks}}" wx:key="id" class="task">
    <text>{{item.questionText}}</text>
    <text class="stage">{{item.reviewStage}}</text>
    <button size="mini" type="primary" data-id="{{item.id}}" bindtap="completeTask">完成复习</button>
  </view>
</view>
```

写入 `miniprogram/pages/review/review.ts`：

```ts
import { functionDomainSeed } from "../../shared/data/function-domain.seed";
import { formatMathText } from "../../shared/lib/math-text";
import { createMiniStorageRepository, createWxStorageAdapter } from "../../shared/lib/storage";

Page({
  data: {
    tasks: [] as Array<{ id: string; questionText: string; reviewStage: string }>
  },
  onShow() {
    this.refresh();
  },
  refresh() {
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
  completeTask(event: WechatMiniprogram.TouchEvent) {
    const taskId = String(event.currentTarget.dataset.id);
    createMiniStorageRepository(createWxStorageAdapter()).completeReviewTask(taskId);
    this.refresh();
  }
});
```

写入 `miniprogram/pages/review/review.wxss`：

```css
.reviewPage {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.header, .task, .empty {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 22rpx;
  background: #ffffff;
  border: 1rpx solid #d8e2dc;
  border-radius: 8rpx;
}

.title {
  font-size: 38rpx;
  font-weight: 700;
}

.subtitle, .stage, .empty {
  color: #667085;
}
```

- [ ] **Step 7: 运行全量测试**

Run: `npm.cmd test`

Expected: PASS。

- [ ] **Step 8: 提交页面实现**

```powershell
git add miniprogram/components miniprogram/pages
git commit -m "feat: build mini program learning flow"
```

## Task 6: 验证和使用说明

**Files:**
- Create: `miniprogram/README.md`

- [ ] **Step 1: 写小程序运行说明**

写入 `miniprogram/README.md`：

```md
# 函数定义域教练小程序

## 本地打开

1. 打开微信开发者工具。
2. 导入 `miniprogram/` 目录。
3. AppID 可先使用测试号或替换 `project.config.json` 中的 `appid`。
4. 未部署云函数时，本地确定性判题、进度保存、错题复习和重置仍可使用。

## AI 云函数

1. 在微信开发者工具中上传并部署 `cloudfunctions/aiCoach`。
2. 在云函数环境变量中配置 `DEEPSEEK_API_KEY`。
3. 可选配置 `DEEPSEEK_MODEL` 和 `DEEPSEEK_API_ENDPOINT`。
4. 前端不会保存或提交 API Key。

## 验证清单

- 首页能看到课程环节。
- 单选题提交后能显示解析。
- 填空题本地等价答案能判对。
- AI 配置后，填空题本地判错时会尝试 AI 兜底。
- 费曼输出配置 AI 后能返回反馈。
- 重启小程序后本地进度仍存在。
- 点击重置后本地进度清空。
```

- [ ] **Step 2: 运行最终测试**

Run: `npm.cmd test`

Expected: PASS。

- [ ] **Step 3: 运行 TypeScript 检查**

Run: `npx.cmd tsc --noEmit`

Expected: PASS。

- [ ] **Step 4: 检查没有密钥**

Run: `rg "DEEPSEEK_API_KEY|sk-|Bearer " miniprogram`

Expected: 只允许出现 `DEEPSEEK_API_KEY` 环境变量说明和云函数中的 `Bearer ${apiKey}`，不能出现真实密钥。

- [ ] **Step 5: 提交文档和最终验证**

```powershell
git add miniprogram/README.md
git commit -m "docs: document mini program setup"
```

## 自审

- 规格覆盖：计划覆盖独立 `miniprogram/` 目录、本地存储、AI 云函数、安全边界、公式降级、测试和手动验证。
- 范围控制：第一版只做当前函数定义域知识点，不做云同步和后台管理。
- 类型一致性：`MiniAttempt`、`MiniReviewTask`、`MiniFeynmanOutput`、AI 请求和响应字段与规格一致。
- 风险：云函数中为避免运行时引用 TypeScript seed，第一版只内置 AI 兜底常用题目的最小题目字段；如果要让所有填空题都走 AI，执行时应把 seed 导出成云函数可直接加载的 JSON。
