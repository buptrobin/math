# Function Domain MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight deployable Next.js MVP for the “函数定义域” learning checkpoint with SQLite-backed attempts, error review, and Feynman output records.

**Architecture:** The app is a single Next.js App Router page with server actions for persistence. Fixed lesson content lives in a seed module derived from `docs/bixiu-1.pdf`; learner state is stored in a local SQLite database using Node 24 `node:sqlite`. UI components are split by learning shell, progress sidebar, question card, error tag picker, and review panel.

**Tech Stack:** Next.js, React, TypeScript, Node 24 `node:sqlite`, Vitest, CSS Modules/global CSS.

---

## File Structure

- Create `package.json`: scripts and dependencies.
- Create `next.config.ts`, `tsconfig.json`, `vitest.config.ts`: tool configuration.
- Create `app/layout.tsx`, `app/page.tsx`, `app/globals.css`: app entry and styling.
- Create `app/actions.ts`: server actions for attempts, reviews, Feynman outputs.
- Create `components/lesson-shell.tsx`: orchestrates the seven learning sections.
- Create `components/progress-sidebar.tsx`: status and section navigation.
- Create `components/question-card.tsx`: single choice, fill-in, and short-answer UI.
- Create `components/error-tag-picker.tsx`: fixed error reason selection.
- Create `components/review-panel.tsx`: due review task list and redo entry.
- Create `data/function-domain.seed.ts`: fixed lesson content and questions.
- Create `lib/types.ts`: shared data types.
- Create `lib/db.ts`: SQLite schema, seed, and query helpers.
- Create `lib/grading.ts`: answer normalization and grading.
- Create `lib/review-schedule.ts`: same-day, 3-day, 7-day task generation.
- Create `lib/ai-coach.ts`: no-network placeholder for future AI integration.
- Create `lib/progress.ts`: derived progress/status calculations.
- Create `tests/grading.test.ts`, `tests/review-schedule.test.ts`, `tests/db.test.ts`: focused unit tests.

## Task 1: Bootstrap Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Create package manifest**

Create `package.json`:

```json
{
  "name": "function-domain-coach",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm.cmd install`

Expected: `package-lock.json` is created and dependencies install successfully.

- [ ] **Step 3: Add TypeScript and Next config**

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb"
    }
  }
};

export default nextConfig;
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "types": ["node", "vitest/globals"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true
  }
});
```

- [ ] **Step 4: Add base app layout**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "函数定义域闯关教练",
  description: "高中数学函数基础学习 MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

Create `app/globals.css` with the final visual system from Task 7. For this task, use a temporary minimal stylesheet:

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, "Microsoft YaHei", sans-serif;
  color: #1f2937;
  background: #f6f7fb;
}

button,
input,
textarea,
select {
  font: inherit;
}
```

- [ ] **Step 5: Verify bootstrap**

Run: `npm.cmd test`

Expected: Vitest reports no test files or exits successfully after installation.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json vitest.config.ts app/layout.tsx app/globals.css
git commit -m "chore: bootstrap Next.js learning app"
```

## Task 2: Add Domain Types and Lesson Seed

**Files:**
- Create: `lib/types.ts`
- Create: `data/function-domain.seed.ts`

- [ ] **Step 1: Define shared types**

Create `lib/types.ts`:

```ts
export type SectionType =
  | "diagnostic"
  | "socratic"
  | "textbook_explanation"
  | "example_breakdown"
  | "variation_practice"
  | "feynman_output"
  | "review";

export type QuestionType = "single_choice" | "fill_blank" | "short_answer" | "example";

export type ErrorTag = "概念错" | "识别错" | "步骤错" | "计算错" | "审题错";

export type ReviewStage = "same_day" | "three_days" | "seven_days";

export type KnowledgeStatus = "未开始" | "诊断中" | "学习中" | "练习中" | "已通关";

export interface KnowledgePointSeed {
  id: string;
  title: string;
  module: string;
  orderIndex: number;
  description: string;
  prerequisiteIds: string[];
  status: KnowledgeStatus;
}

export interface LessonSeed {
  id: string;
  knowledgePointId: string;
  title: string;
  sectionType: SectionType;
  orderIndex: number;
}

export interface QuestionSeed {
  id: string;
  knowledgePointId: string;
  lessonId: string;
  questionText: string;
  questionType: QuestionType;
  options?: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  explanation: string;
  hints: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  source: "textbook" | "adapted" | "coach";
  textbookPage?: string;
  examPoint: string;
  commonMistake: string;
  errorTags: ErrorTag[];
}

export interface FeynmanPromptSeed {
  id: string;
  knowledgePointId: string;
  prompt: string;
}

export interface LessonContentSeed {
  knowledgePoint: KnowledgePointSeed;
  lessons: LessonSeed[];
  questions: QuestionSeed[];
  feynmanPrompts: FeynmanPromptSeed[];
  textbookExplanation: {
    formal: string;
    studentFriendly: string;
    ruleCards: string[];
  };
}
```

- [ ] **Step 2: Add fixed function-domain seed**

Create `data/function-domain.seed.ts`.

Use the PDF-derived textbook rule: if only an analytic expression is given, the function domain is the set of real numbers that make the expression meaningful. The page marker is kept as `"必修一 3.1"` because `pdftotext` text positions do not map cleanly to printed page numbers.

```ts
import type { LessonContentSeed } from "@/lib/types";

export const functionDomainSeed: LessonContentSeed = {
  knowledgePoint: {
    id: "kp-function-domain",
    title: "函数定义域",
    module: "函数基础",
    orderIndex: 4,
    description: "理解定义域就是让函数表达式有意义的所有自变量取值。",
    prerequisiteIds: ["kp-set-interval", "kp-function-concept"],
    status: "未开始"
  },
  lessons: [
    { id: "lesson-domain-diagnostic", knowledgePointId: "kp-function-domain", title: "前置诊断", sectionType: "diagnostic", orderIndex: 1 },
    { id: "lesson-domain-socratic", knowledgePointId: "kp-function-domain", title: "概念追问", sectionType: "socratic", orderIndex: 2 },
    { id: "lesson-domain-textbook", knowledgePointId: "kp-function-domain", title: "课本概念精读", sectionType: "textbook_explanation", orderIndex: 3 },
    { id: "lesson-domain-examples", knowledgePointId: "kp-function-domain", title: "课本例题拆解", sectionType: "example_breakdown", orderIndex: 4 },
    { id: "lesson-domain-variations", knowledgePointId: "kp-function-domain", title: "变式练习", sectionType: "variation_practice", orderIndex: 5 },
    { id: "lesson-domain-feynman", knowledgePointId: "kp-function-domain", title: "费曼输出", sectionType: "feynman_output", orderIndex: 6 },
    { id: "lesson-domain-review", knowledgePointId: "kp-function-domain", title: "错题复习", sectionType: "review", orderIndex: 7 }
  ],
  textbookExplanation: {
    formal: "如果只给出解析式 y=f(x)，而没有指明它的定义域，那么函数的定义域就是指能使这个式子有意义的实数的集合。",
    studentFriendly: "定义域就是 x 可以取哪些值。不是你想让 x 取什么都可以，而是要看代入后这个式子有没有意义。",
    ruleCards: ["遇到分母：分母不能等于 0。", "遇到偶次根号：根号里面要大于等于 0。", "多个限制：所有条件要同时满足，也就是取交集。", "实际问题：还要符合题目中的实际意义。"]
  },
  questions: [
    {
      id: "q-diagnostic-1",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-diagnostic",
      questionText: "y = 1 / (x - 2)，x 可以等于 2 吗？",
      questionType: "single_choice",
      options: ["可以", "不可以", "不确定"],
      correctAnswer: "不可以",
      acceptedAnswers: ["B", "不可以"],
      explanation: "如果 x = 2，那么分母 x - 2 = 0。分母不能为 0，所以 x 不能等于 2。",
      hints: ["先把 x = 2 代入 x - 2。", "想一想 1 / 0 有没有意义。", "分母为 0 时，式子没有意义。"],
      difficulty: 1,
      source: "coach",
      textbookPage: "必修一 3.1",
      examPoint: "分母不能为 0",
      commonMistake: "只看到 x 可以代入数字，没有检查分母是否为 0。",
      errorTags: ["概念错", "识别错", "审题错"]
    },
    {
      id: "q-diagnostic-2",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-diagnostic",
      questionText: "y = √(x - 1)，x 需要满足什么？",
      questionType: "single_choice",
      options: ["x > 1", "x ≥ 1", "x ≠ 1", "x 可以是任意实数"],
      correctAnswer: "x ≥ 1",
      acceptedAnswers: ["B", "x≥1", "x >= 1", "x ≥ 1"],
      explanation: "偶次根号内不能小于 0，所以 x - 1 ≥ 0，即 x ≥ 1。",
      hints: ["先看根号里面是什么。", "偶次根号里面不能是负数。", "把 x - 1 ≥ 0 解出来。"],
      difficulty: 1,
      source: "coach",
      textbookPage: "必修一 3.1",
      examPoint: "偶次根号内大于等于 0",
      commonMistake: "把 ≥ 写成 >，误以为根号里面不能等于 0。",
      errorTags: ["概念错", "计算错", "审题错"]
    },
    {
      id: "q-diagnostic-3",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-diagnostic",
      questionText: "y = √(x - 1) / (x - 3) 的定义域是什么？",
      questionType: "fill_blank",
      correctAnswer: "[1,3)∪(3,+∞)",
      acceptedAnswers: ["[1,3)∪(3,+∞)", "[1,3)U(3,+∞)", "x≥1且x≠3", "x >= 1 且 x != 3", "x≥1，x≠3"],
      explanation: "根号要求 x - 1 ≥ 0，所以 x ≥ 1。分母要求 x - 3 ≠ 0，所以 x ≠ 3。合起来是 x ≥ 1 且 x ≠ 3。",
      hints: ["先分别找根号和分母。", "根号给出 x - 1 ≥ 0。", "分母给出 x - 3 ≠ 0，两个条件要同时满足。"],
      difficulty: 2,
      source: "adapted",
      textbookPage: "必修一 3.1",
      examPoint: "多个限制取交集",
      commonMistake: "只处理根号，忘记排除分母为 0 的点。",
      errorTags: ["识别错", "步骤错", "计算错"]
    },
    {
      id: "q-diagnostic-4",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-diagnostic",
      questionText: "“函数有意义”更接近下面哪句话？",
      questionType: "single_choice",
      options: ["x 取任何数都可以", "代入 x 后，式子能正常计算", "函数图像一定是一条直线", "答案一定是正数"],
      correctAnswer: "代入 x 后，式子能正常计算",
      acceptedAnswers: ["B", "代入 x 后，式子能正常计算", "代入x后式子能正常计算"],
      explanation: "定义域关注的是 x 代入后式子有没有意义，常见限制来自分母和根号。",
      hints: ["定义域先不问图像长什么样。", "它问的是 x 能不能代进去。", "能正常计算，才叫有意义。"],
      difficulty: 1,
      source: "coach",
      textbookPage: "必修一 3.1",
      examPoint: "理解有意义",
      commonMistake: "把定义域和图像、值域混在一起。",
      errorTags: ["概念错", "审题错"]
    },
    {
      id: "q-diagnostic-5",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-diagnostic",
      questionText: "如果一个式子里既有分母又有根号，定义域要满足几个条件？",
      questionType: "single_choice",
      options: ["只满足分母条件", "只满足根号条件", "两个条件都要满足", "哪个简单就用哪个"],
      correctAnswer: "两个条件都要满足",
      acceptedAnswers: ["C", "两个条件都要满足", "都要满足"],
      explanation: "只要有一个条件不满足，式子就没有意义。因此多个限制要同时满足。",
      hints: ["分母限制和根号限制都会让式子没有意义。", "只满足一个，另一个不满足，式子仍然不成立。", "多个限制要取交集。"],
      difficulty: 1,
      source: "coach",
      textbookPage: "必修一 3.1",
      examPoint: "多个限制取交集",
      commonMistake: "只挑一个限制条件来做。",
      errorTags: ["概念错", "识别错"]
    },
    {
      id: "q-socratic-1",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-socratic",
      questionText: "如果 x = 2，那么 x - 2 等于多少？",
      questionType: "fill_blank",
      correctAnswer: "0",
      acceptedAnswers: ["0", "零"],
      explanation: "2 - 2 = 0。这个结果会让分母变成 0。",
      hints: ["把 2 代入 x。", "计算 2 - 2。", "结果是 0。"],
      difficulty: 1,
      source: "coach",
      textbookPage: "必修一 3.1",
      examPoint: "代入检查",
      commonMistake: "不代入，直接猜结论。",
      errorTags: ["计算错", "步骤错"]
    },
    {
      id: "q-socratic-2",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-socratic",
      questionText: "1 / 0 有意义吗？",
      questionType: "single_choice",
      options: ["有意义", "没有意义"],
      correctAnswer: "没有意义",
      acceptedAnswers: ["B", "没有意义", "无意义"],
      explanation: "除数不能为 0，所以 1 / 0 没有意义。",
      hints: ["想一想除法里除数能不能是 0。", "分母就是除数。", "除数为 0 没有意义。"],
      difficulty: 1,
      source: "coach",
      textbookPage: "必修一 3.1",
      examPoint: "分母不能为 0",
      commonMistake: "把 1 / 0 当成 0。",
      errorTags: ["概念错"]
    },
    {
      id: "q-socratic-3",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-socratic",
      questionText: "所以 y = 1 / (x - 2) 中，x 能不能等于 2？",
      questionType: "single_choice",
      options: ["能", "不能"],
      correctAnswer: "不能",
      acceptedAnswers: ["B", "不能", "不可以"],
      explanation: "x = 2 会让分母 x - 2 = 0，所以不能取。",
      hints: ["上一问已经知道 x - 2 会等于 0。", "分母不能为 0。", "因此 x 不能等于 2。"],
      difficulty: 1,
      source: "coach",
      textbookPage: "必修一 3.1",
      examPoint: "排除分母为 0 的点",
      commonMistake: "知道 1 / 0 不行，但没有迁移到 x - 2。",
      errorTags: ["识别错", "步骤错"]
    },
    {
      id: "q-socratic-4",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-socratic",
      questionText: "如果根号里面是 x - 1，那么 x - 1 可以小于 0 吗？",
      questionType: "single_choice",
      options: ["可以", "不可以"],
      correctAnswer: "不可以",
      acceptedAnswers: ["B", "不可以", "不能"],
      explanation: "在实数范围内，偶次根号里面不能小于 0。",
      hints: ["这里讨论高中函数的实数范围。", "偶次根号里面不能是负数。", "所以 x - 1 不可以小于 0。"],
      difficulty: 1,
      source: "coach",
      textbookPage: "必修一 3.1",
      examPoint: "偶次根号限制",
      commonMistake: "忘记根号内不能小于 0。",
      errorTags: ["概念错"]
    },
    {
      id: "q-socratic-5",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-socratic",
      questionText: "如果一个式子里既有根号又有分母，是只满足一个条件，还是两个条件都要满足？",
      questionType: "single_choice",
      options: ["只满足一个", "两个条件都要满足"],
      correctAnswer: "两个条件都要满足",
      acceptedAnswers: ["B", "两个条件都要满足", "都要满足"],
      explanation: "任何一个限制不满足，式子都会没有意义，所以要同时满足所有条件。",
      hints: ["根号和分母都会制造限制。", "其中一个不满足，式子就不能算。", "所以要同时满足。"],
      difficulty: 1,
      source: "coach",
      textbookPage: "必修一 3.1",
      examPoint: "限制条件取交集",
      commonMistake: "漏掉其中一个限制。",
      errorTags: ["识别错", "步骤错"]
    },
    {
      id: "q-example-1",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-examples",
      questionText: "母题拆解：求 y = √(x - 1) / (x - 3) 的定义域。",
      questionType: "example",
      correctAnswer: "[1,3)∪(3,+∞)",
      acceptedAnswers: ["[1,3)∪(3,+∞)", "x≥1且x≠3"],
      explanation: "看到根号，想到 x - 1 ≥ 0；看到分母，想到 x - 3 ≠ 0。合并得到 x ≥ 1 且 x ≠ 3，即 [1,3)∪(3,+∞)。",
      hints: ["先找题目表面有什么。", "根号和分母分别给条件。", "最后把条件合起来。"],
      difficulty: 2,
      source: "adapted",
      textbookPage: "必修一 3.1",
      examPoint: "根号与分母综合",
      commonMistake: "只写 x ≥ 1，忘记 x ≠ 3。",
      errorTags: ["识别错", "步骤错", "计算错"]
    },
    {
      id: "q-example-2",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-examples",
      questionText: "母题拆解：求 y = 1 / (x + 2) 的定义域。",
      questionType: "example",
      correctAnswer: "{x|x≠-2}",
      acceptedAnswers: ["{x|x≠-2}", "x≠-2", "(-∞,-2)∪(-2,+∞)"],
      explanation: "只看到分母 x + 2。分母不能为 0，所以 x + 2 ≠ 0，即 x ≠ -2。",
      hints: ["这个式子只有分母限制。", "让分母 x + 2 不等于 0。", "解出 x ≠ -2。"],
      difficulty: 1,
      source: "textbook",
      textbookPage: "必修一 3.1",
      examPoint: "分式函数定义域",
      commonMistake: "把 x + 2 ≠ 0 解成 x ≠ 2。",
      errorTags: ["计算错", "步骤错"]
    },
    {
      id: "q-var-1",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-variations",
      questionText: "A层：求 y = 1 / (x - 5) 的定义域。",
      questionType: "fill_blank",
      correctAnswer: "x≠5",
      acceptedAnswers: ["x≠5", "{x|x≠5}", "(-∞,5)∪(5,+∞)"],
      explanation: "分母 x - 5 不能等于 0，所以 x ≠ 5。",
      hints: ["只看分母。", "令 x - 5 ≠ 0。", "解出 x ≠ 5。"],
      difficulty: 1,
      source: "adapted",
      textbookPage: "必修一 3.1",
      examPoint: "只换数字的分母限制",
      commonMistake: "写成 x ≠ -5。",
      errorTags: ["计算错", "步骤错"]
    },
    {
      id: "q-var-2",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-variations",
      questionText: "A层：求 y = √(x + 3) 的定义域。",
      questionType: "fill_blank",
      correctAnswer: "x≥-3",
      acceptedAnswers: ["x≥-3", "[-3,+∞)", "x >= -3"],
      explanation: "根号内 x + 3 ≥ 0，所以 x ≥ -3。",
      hints: ["只看根号里面。", "写出 x + 3 ≥ 0。", "解出 x ≥ -3。"],
      difficulty: 1,
      source: "adapted",
      textbookPage: "必修一 3.1",
      examPoint: "只换数字的根号限制",
      commonMistake: "把 x ≥ -3 写成 x ≥ 3。",
      errorTags: ["计算错", "步骤错"]
    },
    {
      id: "q-var-3",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-variations",
      questionText: "A层：求 y = √(x - 4) 的定义域。",
      questionType: "fill_blank",
      correctAnswer: "x≥4",
      acceptedAnswers: ["x≥4", "[4,+∞)", "x >= 4"],
      explanation: "根号内 x - 4 ≥ 0，所以 x ≥ 4。",
      hints: ["根号里面不能小于 0。", "写出 x - 4 ≥ 0。", "解出 x ≥ 4。"],
      difficulty: 1,
      source: "adapted",
      textbookPage: "必修一 3.1",
      examPoint: "偶次根号定义域",
      commonMistake: "把 ≥ 写成 >。",
      errorTags: ["概念错", "计算错"]
    },
    {
      id: "q-var-4",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-variations",
      questionText: "B层：求 y = √(2x - 4) / (x + 1) 的定义域。",
      questionType: "fill_blank",
      correctAnswer: "[2,+∞)",
      acceptedAnswers: ["[2,+∞)", "x≥2", "x >= 2"],
      explanation: "根号要求 2x - 4 ≥ 0，所以 x ≥ 2。分母要求 x + 1 ≠ 0，所以 x ≠ -1。因为 x ≥ 2 时已经不可能等于 -1，所以定义域是 [2,+∞)。",
      hints: ["先分别列出两个条件。", "2x - 4 ≥ 0 得到 x ≥ 2。", "x ≠ -1 与 x ≥ 2 合并后仍是 x ≥ 2。"],
      difficulty: 2,
      source: "adapted",
      textbookPage: "必修一 3.1",
      examPoint: "根号与分母综合",
      commonMistake: "机械写出 x≥2 且 x≠-1，不会合并条件。",
      errorTags: ["步骤错", "计算错"]
    },
    {
      id: "q-var-5",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-variations",
      questionText: "B层：求 y = √(x + 2) / (x - 1) 的定义域。",
      questionType: "fill_blank",
      correctAnswer: "[-2,1)∪(1,+∞)",
      acceptedAnswers: ["[-2,1)∪(1,+∞)", "x≥-2且x≠1", "x >= -2 且 x != 1"],
      explanation: "根号要求 x + 2 ≥ 0，所以 x ≥ -2。分母要求 x - 1 ≠ 0，所以 x ≠ 1。合起来是 x ≥ -2 且 x ≠ 1。",
      hints: ["根号给一个条件。", "分母给一个条件。", "把 x ≥ -2 中的 x = 1 挖掉。"],
      difficulty: 2,
      source: "adapted",
      textbookPage: "必修一 3.1",
      examPoint: "多个限制取交集",
      commonMistake: "忘记排除 x = 1。",
      errorTags: ["识别错", "步骤错"]
    },
    {
      id: "q-var-6",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-variations",
      questionText: "B层：求 y = 1 / √(x - 2) 的定义域。",
      questionType: "fill_blank",
      correctAnswer: "x>2",
      acceptedAnswers: ["x>2", "(2,+∞)", "x > 2"],
      explanation: "根号在分母里。根号内要 ≥ 0，同时分母不能为 0，所以 √(x - 2) 不能等于 0，即 x - 2 > 0，得到 x > 2。",
      hints: ["这里根号本身在分母。", "根号内不能小于 0，分母还不能等于 0。", "所以 x - 2 要大于 0。"],
      difficulty: 3,
      source: "adapted",
      textbookPage: "必修一 3.1",
      examPoint: "根号作分母",
      commonMistake: "只写 x ≥ 2，没有排除让分母为 0 的 x = 2。",
      errorTags: ["识别错", "概念错", "步骤错"]
    },
    {
      id: "q-var-7",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-variations",
      questionText: "C层：函数 f(x) = √(x - 2) / x 有意义时，x 的取值范围是什么？",
      questionType: "fill_blank",
      correctAnswer: "[2,+∞)",
      acceptedAnswers: ["[2,+∞)", "x≥2", "x >= 2"],
      explanation: "有意义就是求定义域。根号要求 x - 2 ≥ 0，所以 x ≥ 2；分母要求 x ≠ 0。x ≥ 2 已经排除了 0，所以范围是 [2,+∞)。",
      hints: ["“有意义时”就是在问定义域。", "先看根号，再看分母。", "合并条件。"],
      difficulty: 2,
      source: "adapted",
      textbookPage: "必修一 3.1",
      examPoint: "换问法识别定义域",
      commonMistake: "看不出“有意义时”是在求定义域。",
      errorTags: ["识别错", "审题错"]
    },
    {
      id: "q-var-8",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-variations",
      questionText: "C层：要使式子 √(3 - x) 有意义，x 应满足什么？",
      questionType: "fill_blank",
      correctAnswer: "x≤3",
      acceptedAnswers: ["x≤3", "(-∞,3]", "x <= 3"],
      explanation: "根号内 3 - x ≥ 0，所以 x ≤ 3。",
      hints: ["“有意义”就是根号内不能小于 0。", "写出 3 - x ≥ 0。", "移项时注意不等号方向。"],
      difficulty: 2,
      source: "adapted",
      textbookPage: "必修一 3.1",
      examPoint: "换问法与不等式求解",
      commonMistake: "把 3 - x ≥ 0 解成 x ≥ 3。",
      errorTags: ["计算错", "步骤错"]
    },
    {
      id: "q-var-9",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-variations",
      questionText: "D层：下列哪个函数的定义域为 [3,+∞)？",
      questionType: "single_choice",
      options: ["y = √(x - 3)", "y = 1 / (x - 3)", "y = √(3 - x)", "y = √x - 3"],
      correctAnswer: "y = √(x - 3)",
      acceptedAnswers: ["A", "y = √(x - 3)", "√(x-3)"],
      explanation: "y = √(x - 3) 要求 x - 3 ≥ 0，所以 x ≥ 3，定义域是 [3,+∞)。",
      hints: ["逐个看每个选项的限制。", "定义域 [3,+∞) 表示 x ≥ 3。", "哪个根号内会给出 x ≥ 3？"],
      difficulty: 3,
      source: "adapted",
      textbookPage: "必修一 3.1",
      examPoint: "反向判断定义域",
      commonMistake: "把 √x - 3 看成 √(x - 3)。",
      errorTags: ["审题错", "识别错"]
    },
    {
      id: "q-var-10",
      knowledgePointId: "kp-function-domain",
      lessonId: "lesson-domain-variations",
      questionText: "D层：下列哪个说法正确？",
      questionType: "single_choice",
      options: ["y = 1 / (x + 1) 的定义域是 x≠1", "y = √(x + 1) 的定义域是 x≥-1", "y = √(x - 1) 的定义域是 x>1", "y = 1 / √(x - 1) 的定义域是 x≥1"],
      correctAnswer: "y = √(x + 1) 的定义域是 x≥-1",
      acceptedAnswers: ["B", "y = √(x + 1) 的定义域是 x≥-1", "√(x+1) x≥-1"],
      explanation: "√(x + 1) 要求 x + 1 ≥ 0，所以 x ≥ -1。其他选项分别错在符号、漏掉等号或没有排除分母为 0。",
      hints: ["每个选项只检查一个关键限制。", "注意 x + 1 ≥ 0 的解。", "注意根号在分母时不能等于 0。"],
      difficulty: 3,
      source: "adapted",
      textbookPage: "必修一 3.1",
      examPoint: "易错辨析",
      commonMistake: "漏看负号、等号和分母位置。",
      errorTags: ["审题错", "概念错", "计算错"]
    }
  ],
  feynmanPrompts: [
    { id: "feynman-1", knowledgePointId: "kp-function-domain", prompt: "请用自己的话解释：什么是定义域？" },
    { id: "feynman-2", knowledgePointId: "kp-function-domain", prompt: "为什么分母不能为 0？" },
    { id: "feynman-3", knowledgePointId: "kp-function-domain", prompt: "如果一个函数式子里有多个限制，应该怎么办？" }
  ]
};
```

- [ ] **Step 3: Run type check after app files exist**

Skip type check until Task 6 creates `app/page.tsx` and path alias support is validated.

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts data/function-domain.seed.ts
git commit -m "feat: add function domain lesson seed"
```

## Task 3: Implement Grading and Review Scheduling with Tests

**Files:**
- Create: `lib/grading.ts`
- Create: `lib/review-schedule.ts`
- Create: `tests/grading.test.ts`
- Create: `tests/review-schedule.test.ts`

- [ ] **Step 1: Write grading tests**

Create `tests/grading.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { gradeAnswer, normalizeAnswer } from "@/lib/grading";
import { functionDomainSeed } from "@/data/function-domain.seed";

describe("normalizeAnswer", () => {
  it("removes spaces and normalizes union symbols", () => {
    expect(normalizeAnswer("[1,3) U (3,+∞)")).toBe("[1,3)∪(3,+∞)");
  });
});

describe("gradeAnswer", () => {
  it("accepts exact single choice labels or text", () => {
    const question = functionDomainSeed.questions.find((item) => item.id === "q-diagnostic-1");
    expect(question).toBeDefined();
    expect(gradeAnswer(question!, "B").isCorrect).toBe(true);
    expect(gradeAnswer(question!, "不可以").isCorrect).toBe(true);
  });

  it("accepts equivalent fill blank answers", () => {
    const question = functionDomainSeed.questions.find((item) => item.id === "q-diagnostic-3");
    expect(question).toBeDefined();
    expect(gradeAnswer(question!, "x >= 1 且 x != 3").isCorrect).toBe(true);
  });
});
```

- [ ] **Step 2: Run grading test to verify failure**

Run: `npm.cmd test -- tests/grading.test.ts`

Expected: FAIL because `lib/grading.ts` does not exist.

- [ ] **Step 3: Implement grading**

Create `lib/grading.ts`:

```ts
import type { QuestionSeed } from "@/lib/types";

export interface GradeResult {
  isCorrect: boolean;
  normalizedUserAnswer: string;
}

const replacements: Array<[RegExp, string]> = [
  [/\s+/g, ""],
  [/U/g, "∪"],
  [/∪/g, "∪"],
  [/，/g, ","],
  [/！=/g, "!="],
  [/≠/g, "!="],
  [/≥/g, ">="],
  [/≤/g, "<="],
  [/＋/g, "+"],
  [/－/g, "-"]
];

export function normalizeAnswer(value: string): string {
  const compact = replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value.trim());
  return compact.replace(/>=/g, "≥").replace(/<=/g, "≤").replace(/!=/g, "≠");
}

export function gradeAnswer(question: QuestionSeed, userAnswer: string): GradeResult {
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  const accepted = [question.correctAnswer, ...(question.acceptedAnswers ?? [])].map(normalizeAnswer);

  return {
    isCorrect: accepted.includes(normalizedUserAnswer),
    normalizedUserAnswer
  };
}
```

- [ ] **Step 4: Write review schedule tests**

Create `tests/review-schedule.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createReviewSchedule } from "@/lib/review-schedule";

describe("createReviewSchedule", () => {
  it("creates same-day, 3-day, and 7-day review dates", () => {
    const base = new Date("2026-06-23T08:00:00.000Z");
    const tasks = createReviewSchedule(base);

    expect(tasks).toEqual([
      { reviewStage: "same_day", scheduledAt: "2026-06-23T08:00:00.000Z" },
      { reviewStage: "three_days", scheduledAt: "2026-06-26T08:00:00.000Z" },
      { reviewStage: "seven_days", scheduledAt: "2026-06-30T08:00:00.000Z" }
    ]);
  });
});
```

- [ ] **Step 5: Run review test to verify failure**

Run: `npm.cmd test -- tests/review-schedule.test.ts`

Expected: FAIL because `lib/review-schedule.ts` does not exist.

- [ ] **Step 6: Implement review schedule**

Create `lib/review-schedule.ts`:

```ts
import type { ReviewStage } from "@/lib/types";

export interface ReviewScheduleItem {
  reviewStage: ReviewStage;
  scheduledAt: string;
}

const offsets: Array<[ReviewStage, number]> = [
  ["same_day", 0],
  ["three_days", 3],
  ["seven_days", 7]
];

export function createReviewSchedule(baseDate = new Date()): ReviewScheduleItem[] {
  return offsets.map(([reviewStage, days]) => {
    const scheduled = new Date(baseDate);
    scheduled.setUTCDate(scheduled.getUTCDate() + days);
    return {
      reviewStage,
      scheduledAt: scheduled.toISOString()
    };
  });
}
```

- [ ] **Step 7: Run tests**

Run: `npm.cmd test -- tests/grading.test.ts tests/review-schedule.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/grading.ts lib/review-schedule.ts tests/grading.test.ts tests/review-schedule.test.ts
git commit -m "feat: add grading and review scheduling"
```

## Task 4: Implement SQLite Data Layer

**Files:**
- Create: `lib/db.ts`
- Create: `tests/db.test.ts`

- [ ] **Step 1: Write DB tests**

Create `tests/db.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { createAppDatabase } from "@/lib/db";

describe("createAppDatabase", () => {
  const dbPath = ":memory:";

  afterEach(() => {
    delete process.env.MATH_COACH_DB_PATH;
  });

  it("seeds knowledge point, lessons, and questions", () => {
    process.env.MATH_COACH_DB_PATH = dbPath;
    const db = createAppDatabase(dbPath);

    expect(db.getKnowledgePoint()?.title).toBe("函数定义域");
    expect(db.getLessons()).toHaveLength(7);
    expect(db.getQuestionsByLesson("lesson-domain-diagnostic")).toHaveLength(5);

    db.close();
  });

  it("records wrong attempts and creates review tasks", () => {
    const db = createAppDatabase(dbPath);

    const attempt = db.recordAttempt({
      userId: "demo-student",
      questionId: "q-diagnostic-1",
      userAnswer: "可以",
      isCorrect: false,
      selectedErrorTag: "概念错",
      hintsUsed: 1
    });

    expect(attempt.id).toBeGreaterThan(0);
    expect(db.getDueReviewTasks("demo-student", new Date("2999-01-01T00:00:00.000Z"))).toHaveLength(3);

    db.close();
  });
});
```

- [ ] **Step 2: Run DB test to verify failure**

Run: `npm.cmd test -- tests/db.test.ts`

Expected: FAIL because `lib/db.ts` does not exist.

- [ ] **Step 3: Implement DB layer**

Create `lib/db.ts`:

```ts
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { functionDomainSeed } from "@/data/function-domain.seed";
import { createReviewSchedule } from "@/lib/review-schedule";
import type { ErrorTag } from "@/lib/types";

export interface AttemptInput {
  userId: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  selectedErrorTag?: ErrorTag;
  hintsUsed: number;
}

export interface FeynmanInput {
  userId: string;
  knowledgePointId: string;
  prompt: string;
  userText: string;
  aiFeedback: string;
  score: number;
}

export function getDefaultDbPath() {
  return process.env.MATH_COACH_DB_PATH ?? path.join(process.cwd(), ".data", "math-coach.sqlite");
}

export function createAppDatabase(dbPath = getDefaultDbPath()) {
  if (dbPath !== ":memory:") {
    mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const sqlite = new DatabaseSync(dbPath);
  sqlite.exec("PRAGMA journal_mode = WAL;");
  sqlite.exec("PRAGMA foreign_keys = ON;");
  migrate(sqlite);
  seed(sqlite);

  return {
    close: () => sqlite.close(),
    getKnowledgePoint: () => sqlite.prepare("SELECT * FROM knowledge_points WHERE id = ?").get(functionDomainSeed.knowledgePoint.id) as any,
    getLessons: () => sqlite.prepare("SELECT * FROM lessons ORDER BY order_index").all() as any[],
    getQuestionsByLesson: (lessonId: string) => sqlite.prepare("SELECT * FROM questions WHERE lesson_id = ? ORDER BY id").all(lessonId) as any[],
    getAllQuestions: () => sqlite.prepare("SELECT * FROM questions ORDER BY lesson_id, id").all() as any[],
    getAttempts: (userId: string) => sqlite.prepare("SELECT * FROM attempts WHERE user_id = ? ORDER BY created_at DESC").all(userId) as any[],
    getDueReviewTasks: (userId: string, now = new Date()) =>
      sqlite
        .prepare("SELECT * FROM review_tasks WHERE user_id = ? AND status = 'pending' AND scheduled_at <= ? ORDER BY scheduled_at")
        .all(userId, now.toISOString()) as any[],
    recordAttempt: (input: AttemptInput) => recordAttempt(sqlite, input),
    completeReviewTask: (taskId: number) => {
      sqlite.prepare("UPDATE review_tasks SET status = 'completed' WHERE id = ?").run(taskId);
    },
    recordFeynmanOutput: (input: FeynmanInput) => recordFeynmanOutput(sqlite, input)
  };
}

export type AppDatabase = ReturnType<typeof createAppDatabase>;

function migrate(sqlite: DatabaseSync) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_points (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      module TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      description TEXT NOT NULL,
      prerequisite_ids TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      knowledge_point_id TEXT NOT NULL,
      title TEXT NOT NULL,
      section_type TEXT NOT NULL,
      order_index INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      knowledge_point_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      accepted_answers_json TEXT NOT NULL,
      explanation TEXT NOT NULL,
      hints_json TEXT NOT NULL,
      difficulty INTEGER NOT NULL,
      source TEXT NOT NULL,
      textbook_page TEXT,
      exam_point TEXT NOT NULL,
      common_mistake TEXT NOT NULL,
      error_tags_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      user_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      selected_error_tag TEXT,
      hints_used INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS review_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      status TEXT NOT NULL,
      review_stage TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feynman_outputs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      knowledge_point_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      user_text TEXT NOT NULL,
      ai_feedback TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function seed(sqlite: DatabaseSync) {
  const kp = functionDomainSeed.knowledgePoint;
  sqlite
    .prepare("INSERT OR IGNORE INTO knowledge_points VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(kp.id, kp.title, kp.module, kp.orderIndex, kp.description, JSON.stringify(kp.prerequisiteIds), kp.status);

  const lessonInsert = sqlite.prepare("INSERT OR IGNORE INTO lessons VALUES (?, ?, ?, ?, ?)");
  for (const lesson of functionDomainSeed.lessons) {
    lessonInsert.run(lesson.id, lesson.knowledgePointId, lesson.title, lesson.sectionType, lesson.orderIndex);
  }

  const questionInsert = sqlite.prepare(`
    INSERT OR IGNORE INTO questions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const question of functionDomainSeed.questions) {
    questionInsert.run(
      question.id,
      question.knowledgePointId,
      question.lessonId,
      question.questionText,
      question.questionType,
      JSON.stringify(question.options ?? []),
      question.correctAnswer,
      JSON.stringify(question.acceptedAnswers ?? []),
      question.explanation,
      JSON.stringify(question.hints),
      question.difficulty,
      question.source,
      question.textbookPage ?? null,
      question.examPoint,
      question.commonMistake,
      JSON.stringify(question.errorTags)
    );
  }
}

function recordAttempt(sqlite: DatabaseSync, input: AttemptInput) {
  const createdAt = new Date().toISOString();
  const result = sqlite
    .prepare(
      "INSERT INTO attempts (user_id, question_id, user_answer, is_correct, selected_error_tag, hints_used, created_at, retry_count) VALUES (?, ?, ?, ?, ?, ?, ?, 0)"
    )
    .run(input.userId, input.questionId, input.userAnswer, input.isCorrect ? 1 : 0, input.selectedErrorTag ?? null, input.hintsUsed, createdAt);

  if (!input.isCorrect) {
    const insertReview = sqlite.prepare("INSERT INTO review_tasks (user_id, question_id, scheduled_at, status, review_stage) VALUES (?, ?, ?, 'pending', ?)");
    for (const item of createReviewSchedule(new Date(createdAt))) {
      insertReview.run(input.userId, input.questionId, item.scheduledAt, item.reviewStage);
    }
  }

  return { id: Number(result.lastInsertRowid), createdAt };
}

function recordFeynmanOutput(sqlite: DatabaseSync, input: FeynmanInput) {
  const createdAt = new Date().toISOString();
  const result = sqlite
    .prepare(
      "INSERT INTO feynman_outputs (user_id, knowledge_point_id, prompt, user_text, ai_feedback, score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(input.userId, input.knowledgePointId, input.prompt, input.userText, input.aiFeedback, input.score, createdAt);

  return { id: Number(result.lastInsertRowid), createdAt };
}
```

- [ ] **Step 4: Run DB tests**

Run: `npm.cmd test -- tests/db.test.ts`

Expected: PASS. If TypeScript cannot resolve `node:sqlite`, add a local declaration file `types/node-sqlite.d.ts` with the minimal `DatabaseSync` type used above.

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts tests/db.test.ts
git commit -m "feat: add SQLite learning data layer"
```

## Task 5: Add Progress, AI Placeholder, and Server Actions

**Files:**
- Create: `lib/progress.ts`
- Create: `lib/ai-coach.ts`
- Create: `app/actions.ts`

- [ ] **Step 1: Add progress helper**

Create `lib/progress.ts`:

```ts
export interface ProgressSummary {
  totalAttempts: number;
  wrongAttempts: number;
  dueReviews: number;
  consecutiveVariationCorrect: number;
  status: "未开始" | "诊断中" | "学习中" | "练习中" | "已通关";
}

export function deriveProgress(input: {
  attempts: Array<{ lesson_id?: string; question_id: string; is_correct: number }>;
  dueReviews: number;
}): ProgressSummary {
  const totalAttempts = input.attempts.length;
  const wrongAttempts = input.attempts.filter((attempt) => attempt.is_correct === 0).length;
  const variationAttempts = input.attempts.filter((attempt) => attempt.question_id.startsWith("q-var-"));
  let consecutiveVariationCorrect = 0;
  for (const attempt of variationAttempts) {
    if (attempt.is_correct === 1) consecutiveVariationCorrect += 1;
    else break;
  }

  const status =
    totalAttempts === 0
      ? "未开始"
      : input.dueReviews > 0
        ? "练习中"
        : consecutiveVariationCorrect >= 3 && wrongAttempts > 0
          ? "已通关"
          : totalAttempts < 5
            ? "诊断中"
            : "学习中";

  return {
    totalAttempts,
    wrongAttempts,
    dueReviews: input.dueReviews,
    consecutiveVariationCorrect,
    status
  };
}
```

- [ ] **Step 2: Add AI placeholder**

Create `lib/ai-coach.ts`:

```ts
export function evaluateFeynmanOutput(userText: string) {
  const trimmed = userText.trim();
  const score = trimmed.length >= 30 ? 80 : trimmed.length >= 12 ? 60 : 40;
  const aiFeedback =
    score >= 80
      ? "你已经能用自己的话解释了。下一步要注意遇到题目时先找限制条件。"
      : score >= 60
        ? "表达有一些关键点，但还可以更完整：请说清楚 x 代入后为什么要让式子有意义。"
        : "这次说得太短。请至少说出：定义域是 x 的取值范围，以及为什么要检查分母或根号。";

  return { score, aiFeedback };
}
```

- [ ] **Step 3: Add server actions**

Create `app/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { evaluateFeynmanOutput } from "@/lib/ai-coach";
import { createAppDatabase } from "@/lib/db";
import { gradeAnswer } from "@/lib/grading";
import { functionDomainSeed } from "@/data/function-domain.seed";
import type { ErrorTag } from "@/lib/types";

const demoUserId = "demo-student";

export async function submitAnswerAction(input: {
  questionId: string;
  userAnswer: string;
  selectedErrorTag?: ErrorTag;
  hintsUsed: number;
}) {
  const question = functionDomainSeed.questions.find((item) => item.id === input.questionId);
  if (!question) throw new Error(`Unknown question: ${input.questionId}`);

  const grade = gradeAnswer(question, input.userAnswer);
  const db = createAppDatabase();
  try {
    db.recordAttempt({
      userId: demoUserId,
      questionId: input.questionId,
      userAnswer: input.userAnswer,
      isCorrect: grade.isCorrect,
      selectedErrorTag: input.selectedErrorTag,
      hintsUsed: input.hintsUsed
    });
  } finally {
    db.close();
  }

  revalidatePath("/");
  return {
    isCorrect: grade.isCorrect,
    explanation: question.explanation,
    commonMistake: question.commonMistake
  };
}

export async function submitFeynmanAction(input: { prompt: string; userText: string }) {
  const feedback = evaluateFeynmanOutput(input.userText);
  const db = createAppDatabase();
  try {
    db.recordFeynmanOutput({
      userId: demoUserId,
      knowledgePointId: functionDomainSeed.knowledgePoint.id,
      prompt: input.prompt,
      userText: input.userText,
      aiFeedback: feedback.aiFeedback,
      score: feedback.score
    });
  } finally {
    db.close();
  }

  revalidatePath("/");
  return feedback;
}

export async function completeReviewTaskAction(taskId: number) {
  const db = createAppDatabase();
  try {
    db.completeReviewTask(taskId);
  } finally {
    db.close();
  }
  revalidatePath("/");
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/progress.ts lib/ai-coach.ts app/actions.ts
git commit -m "feat: add learning actions and progress helpers"
```

## Task 6: Build the Learning UI

**Files:**
- Create: `components/error-tag-picker.tsx`
- Create: `components/question-card.tsx`
- Create: `components/progress-sidebar.tsx`
- Create: `components/review-panel.tsx`
- Create: `components/lesson-shell.tsx`
- Create: `app/page.tsx`

- [ ] **Step 1: Add error tag picker**

Create `components/error-tag-picker.tsx`:

```tsx
"use client";

import type { ErrorTag } from "@/lib/types";

const tags: ErrorTag[] = ["概念错", "识别错", "步骤错", "计算错", "审题错"];

export function ErrorTagPicker({ value, onChange }: { value?: ErrorTag; onChange: (tag: ErrorTag) => void }) {
  return (
    <div className="tagGrid" aria-label="错因选择">
      {tags.map((tag) => (
        <button key={tag} type="button" className={value === tag ? "tag activeTag" : "tag"} onClick={() => onChange(tag)}>
          {tag}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add question card**

Create `components/question-card.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { Lightbulb, Send } from "lucide-react";
import { submitAnswerAction } from "@/app/actions";
import { ErrorTagPicker } from "@/components/error-tag-picker";
import type { ErrorTag, QuestionSeed } from "@/lib/types";

export function QuestionCard({ question }: { question: QuestionSeed }) {
  const [answer, setAnswer] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [selectedErrorTag, setSelectedErrorTag] = useState<ErrorTag | undefined>();
  const [result, setResult] = useState<{ isCorrect: boolean; explanation: string; commonMistake: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const needsErrorTag = result?.isCorrect === false;
  const canSubmit = answer.trim().length > 0 && (!needsErrorTag || selectedErrorTag);

  function submit() {
    startTransition(async () => {
      const response = await submitAnswerAction({
        questionId: question.id,
        userAnswer: answer,
        selectedErrorTag,
        hintsUsed
      });
      setResult(response);
    });
  }

  return (
    <article className="questionCard">
      <div className="questionMeta">
        <span>难度 {question.difficulty}</span>
        <span>{question.examPoint}</span>
      </div>
      <h3>{question.questionText}</h3>
      {question.questionType === "example" && <div className="exampleBox">{question.explanation}</div>}
      {question.options?.length ? (
        <div className="optionList">
          {question.options.map((option, index) => (
            <button key={option} type="button" className={answer === option ? "option activeOption" : "option"} onClick={() => setAnswer(option)}>
              <strong>{String.fromCharCode(65 + index)}.</strong> {option}
            </button>
          ))}
        </div>
      ) : question.questionType === "short_answer" ? (
        <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="请用自己的话写出来" rows={5} />
      ) : (
        <input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="填写答案，例如 x≥1 且 x≠3" />
      )}
      <div className="actions">
        <button type="button" onClick={() => setHintsUsed((value) => Math.min(value + 1, question.hints.length))} disabled={hintsUsed >= question.hints.length}>
          <Lightbulb size={16} /> 给一点提示
        </button>
        <button type="button" onClick={submit} disabled={!canSubmit || isPending}>
          <Send size={16} /> 提交
        </button>
      </div>
      {hintsUsed > 0 && (
        <div className="hintBox">
          {question.hints.slice(0, hintsUsed).map((hint) => (
            <p key={hint}>{hint}</p>
          ))}
        </div>
      )}
      {needsErrorTag && (
        <div className="errorReview">
          <h4>先归因：这题主要错在哪里？</h4>
          <ErrorTagPicker value={selectedErrorTag} onChange={setSelectedErrorTag} />
          <button type="button" onClick={submit} disabled={!selectedErrorTag || isPending}>
            保存错因并生成复习
          </button>
        </div>
      )}
      {result && (!needsErrorTag || selectedErrorTag) && (
        <div className={result.isCorrect ? "resultBox correct" : "resultBox wrong"}>
          <strong>{result.isCorrect ? "答对了" : "这题先记入错题"}</strong>
          <p>{result.explanation}</p>
          {!result.isCorrect && <p>易错点：{result.commonMistake}</p>}
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 3: Add progress sidebar**

Create `components/progress-sidebar.tsx`:

```tsx
import type { LessonSeed } from "@/lib/types";

export function ProgressSidebar({
  lessons,
  currentLessonId,
  totalAttempts,
  wrongAttempts,
  dueReviews,
  status
}: {
  lessons: LessonSeed[];
  currentLessonId: string;
  totalAttempts: number;
  wrongAttempts: number;
  dueReviews: number;
  status: string;
}) {
  return (
    <aside className="sidebar">
      <div className="brandBlock">
        <span className="eyebrow">函数基础</span>
        <h1>定义域闯关</h1>
        <p>状态：{status}</p>
      </div>
      <div className="statGrid">
        <div><strong>{totalAttempts}</strong><span>作答</span></div>
        <div><strong>{wrongAttempts}</strong><span>错题</span></div>
        <div><strong>{dueReviews}</strong><span>待复习</span></div>
      </div>
      <nav className="sectionNav">
        {lessons.map((lesson) => (
          <a key={lesson.id} href={`#${lesson.id}`} className={lesson.id === currentLessonId ? "activeSection" : ""}>
            <span>{lesson.orderIndex}</span>
            {lesson.title}
          </a>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 4: Add review panel**

Create `components/review-panel.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { completeReviewTaskAction } from "@/app/actions";

export function ReviewPanel({ tasks }: { tasks: Array<{ id: number; question_id: string; review_stage: string; scheduled_at: string }> }) {
  const [isPending, startTransition] = useTransition();

  if (tasks.length === 0) {
    return <div className="emptyPanel">今天暂无到期错题。做错的题会安排当天、3 天后、7 天后复习。</div>;
  }

  return (
    <div className="reviewList">
      {tasks.map((task) => (
        <div key={task.id} className="reviewItem">
          <div>
            <strong>{task.question_id}</strong>
            <p>{task.review_stage} · {new Date(task.scheduled_at).toLocaleString("zh-CN")}</p>
          </div>
          <button type="button" disabled={isPending} onClick={() => startTransition(() => completeReviewTaskAction(task.id))}>
            标记已重做
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Add lesson shell**

Create `components/lesson-shell.tsx`:

```tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { submitFeynmanAction } from "@/app/actions";
import { QuestionCard } from "@/components/question-card";
import { ReviewPanel } from "@/components/review-panel";
import { functionDomainSeed } from "@/data/function-domain.seed";
import type { LessonSeed, QuestionSeed } from "@/lib/types";

export function LessonShell({
  lessons,
  questions,
  reviewTasks
}: {
  lessons: LessonSeed[];
  questions: QuestionSeed[];
  reviewTasks: Array<{ id: number; question_id: string; review_stage: string; scheduled_at: string }>;
}) {
  const [feynmanText, setFeynmanText] = useState<Record<string, string>>({});
  const [feynmanFeedback, setFeynmanFeedback] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const questionsByLesson = useMemo(() => {
    return questions.reduce<Record<string, QuestionSeed[]>>((acc, question) => {
      acc[question.lessonId] = [...(acc[question.lessonId] ?? []), question];
      return acc;
    }, {});
  }, [questions]);

  return (
    <main className="lessonMain">
      {lessons.map((lesson) => (
        <section key={lesson.id} id={lesson.id} className="lessonSection">
          <div className="sectionHeader">
            <span>第 {lesson.orderIndex} 环节</span>
            <h2>{lesson.title}</h2>
          </div>
          {lesson.sectionType === "textbook_explanation" && (
            <div className="textbookBlock">
              <h3>课本说法</h3>
              <p>{functionDomainSeed.textbookExplanation.formal}</p>
              <h3>孩子版解释</h3>
              <p>{functionDomainSeed.textbookExplanation.studentFriendly}</p>
              <div className="ruleCards">
                {functionDomainSeed.textbookExplanation.ruleCards.map((rule) => <div key={rule}>{rule}</div>)}
              </div>
            </div>
          )}
          {lesson.sectionType === "feynman_output" && (
            <div className="feynmanList">
              {functionDomainSeed.feynmanPrompts.map((prompt) => (
                <div key={prompt.id} className="feynmanCard">
                  <h3>{prompt.prompt}</h3>
                  <textarea rows={4} value={feynmanText[prompt.id] ?? ""} onChange={(event) => setFeynmanText({ ...feynmanText, [prompt.id]: event.target.value })} />
                  <button
                    type="button"
                    disabled={isPending || !(feynmanText[prompt.id] ?? "").trim()}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await submitFeynmanAction({ prompt: prompt.prompt, userText: feynmanText[prompt.id] ?? "" });
                        setFeynmanFeedback({ ...feynmanFeedback, [prompt.id]: result.aiFeedback });
                      })
                    }
                  >
                    提交讲解
                  </button>
                  {feynmanFeedback[prompt.id] && <p className="feedback">{feynmanFeedback[prompt.id]}</p>}
                </div>
              ))}
            </div>
          )}
          {lesson.sectionType === "review" && <ReviewPanel tasks={reviewTasks} />}
          {(questionsByLesson[lesson.id] ?? []).map((question) => <QuestionCard key={question.id} question={question} />)}
        </section>
      ))}
    </main>
  );
}
```

- [ ] **Step 6: Add page composition**

Create `app/page.tsx`:

```tsx
import { LessonShell } from "@/components/lesson-shell";
import { ProgressSidebar } from "@/components/progress-sidebar";
import { functionDomainSeed } from "@/data/function-domain.seed";
import { createAppDatabase } from "@/lib/db";
import { deriveProgress } from "@/lib/progress";

const demoUserId = "demo-student";

export default function HomePage() {
  const db = createAppDatabase();
  const attempts = db.getAttempts(demoUserId);
  const dueReviewTasks = db.getDueReviewTasks(demoUserId);
  db.close();

  const progress = deriveProgress({ attempts, dueReviews: dueReviewTasks.length });

  return (
    <div className="appShell">
      <ProgressSidebar
        lessons={functionDomainSeed.lessons}
        currentLessonId="lesson-domain-diagnostic"
        totalAttempts={progress.totalAttempts}
        wrongAttempts={progress.wrongAttempts}
        dueReviews={progress.dueReviews}
        status={progress.status}
      />
      <LessonShell lessons={functionDomainSeed.lessons} questions={functionDomainSeed.questions} reviewTasks={dueReviewTasks} />
    </div>
  );
}
```

- [ ] **Step 7: Run build**

Run: `npm.cmd run build`

Expected: PASS. If Next reports `node:sqlite` cannot run in edge runtime, add `export const runtime = "nodejs";` to `app/page.tsx` and `app/actions.ts`.

- [ ] **Step 8: Commit**

```bash
git add app/page.tsx components app/actions.ts lib/progress.ts lib/ai-coach.ts
git commit -m "feat: build function domain learning flow"
```

## Task 7: Add Polished Responsive Styling

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace stylesheet**

Replace `app/globals.css` with a restrained operational learning-tool style:

```css
* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  font-family: Arial, "Microsoft YaHei", sans-serif;
  color: #1f2937;
  background: #f6f7fb;
}

button, input, textarea, select { font: inherit; }

button {
  border: 1px solid #cfd7e6;
  background: #ffffff;
  color: #1f2937;
  border-radius: 6px;
  padding: 10px 12px;
  cursor: pointer;
}

button:disabled { cursor: not-allowed; opacity: 0.55; }

input, textarea {
  width: 100%;
  border: 1px solid #cfd7e6;
  border-radius: 6px;
  padding: 12px;
  background: #ffffff;
  color: #111827;
}

.appShell {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: auto;
  padding: 24px;
  background: #ffffff;
  border-right: 1px solid #dbe2ef;
}

.brandBlock h1 { margin: 8px 0; font-size: 28px; }
.brandBlock p { margin: 0; color: #667085; }
.eyebrow { color: #0f766e; font-weight: 700; font-size: 13px; }

.statGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 22px 0;
}

.statGrid div {
  border: 1px solid #dbe2ef;
  border-radius: 6px;
  padding: 10px;
  background: #f8fafc;
}

.statGrid strong { display: block; font-size: 22px; }
.statGrid span { color: #667085; font-size: 12px; }

.sectionNav {
  display: grid;
  gap: 8px;
}

.sectionNav a {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #1f2937;
  padding: 10px;
  border-radius: 6px;
}

.sectionNav span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e6f4f1;
  color: #0f766e;
  font-size: 13px;
  font-weight: 700;
}

.activeSection, .sectionNav a:hover { background: #eef6ff; }

.lessonMain {
  width: min(980px, 100%);
  padding: 28px;
}

.lessonSection {
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #dbe2ef;
}

.sectionHeader span {
  color: #0f766e;
  font-weight: 700;
  font-size: 13px;
}

.sectionHeader h2 {
  margin: 6px 0 16px;
  font-size: 24px;
}

.questionCard, .textbookBlock, .feynmanCard, .emptyPanel, .reviewItem {
  border: 1px solid #dbe2ef;
  border-radius: 8px;
  background: #ffffff;
  padding: 18px;
  margin: 14px 0;
}

.questionMeta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #667085;
  font-size: 13px;
}

.questionCard h3 { margin: 12px 0; font-size: 20px; }

.optionList, .tagGrid, .actions, .ruleCards {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.option {
  width: 100%;
  text-align: left;
}

.activeOption, .activeTag {
  border-color: #0f766e;
  background: #e6f4f1;
}

.actions { margin-top: 12px; }
.actions button, .errorReview button, .feynmanCard button, .reviewItem button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.hintBox, .resultBox, .errorReview, .feedback, .exampleBox {
  margin-top: 12px;
  border-radius: 6px;
  padding: 12px;
}

.hintBox { background: #fff7ed; border: 1px solid #fed7aa; }
.correct { background: #ecfdf3; border: 1px solid #a6f4c5; }
.wrong, .errorReview { background: #fff1f2; border: 1px solid #fecdd3; }
.exampleBox, .feedback { background: #eef6ff; border: 1px solid #bfdbfe; }

.ruleCards div {
  flex: 1 1 190px;
  border: 1px solid #cfd7e6;
  border-radius: 6px;
  padding: 12px;
  background: #f8fafc;
}

.reviewList { display: grid; gap: 10px; }
.reviewItem { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.reviewItem p { margin: 4px 0 0; color: #667085; }

@media (max-width: 820px) {
  .appShell { grid-template-columns: 1fr; }
  .sidebar {
    position: static;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid #dbe2ef;
  }
  .lessonMain { padding: 18px; }
  .reviewItem { align-items: stretch; flex-direction: column; }
}
```

- [ ] **Step 2: Run build**

Run: `npm.cmd run build`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: polish learning coach interface"
```

## Task 8: Verify End-to-End Locally

**Files:**
- Modify only if verification exposes bugs.

- [ ] **Step 1: Run tests**

Run: `npm.cmd test`

Expected: PASS for grading, review schedule, and DB tests.

- [ ] **Step 2: Run production build**

Run: `npm.cmd run build`

Expected: PASS.

- [ ] **Step 3: Start dev server**

Run: `npm.cmd run dev -- --port 3000`

Expected: Next dev server starts at `http://localhost:3000`.

- [ ] **Step 4: Manual browser smoke test**

Open `http://localhost:3000` and verify:

- The page loads directly into “定义域闯关”.
- Diagnostic questions render.
- Hint button reveals hints.
- A correct answer shows explanation.
- A wrong answer asks for error tag and creates review tasks.
- Feynman output saves and returns rule-based feedback.
- Review panel displays due tasks after a wrong answer.

- [ ] **Step 5: Commit bug fixes if needed**

If any bug is found, make the smallest fix and commit:

```bash
git add <changed-files>
git commit -m "fix: address MVP smoke test issue"
```

## Self-Review

- Spec coverage: the plan covers the single “函数定义域” checkpoint, 7 learning sections, fixed seed content, SQLite attempts, error tags, review tasks, Feynman output persistence, and simple progress state.
- Scope control: no multi-user login, no real AI calls, no full 10-checkpoint course, no rankings, no video, and no textbook import pipeline beyond using the supplied PDF as source material for seed content.
- Placeholder scan: no `TBD` or incomplete implementation steps are required to build the MVP.
- Type consistency: shared names use `lessonId` and database rows use `lesson_id`; UI consumes seed objects directly, while DB persists attempt/review state.
