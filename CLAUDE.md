# CLAUDE.md

本文档为 Claude Code (claude.ai/code) 在此仓库中工作提供指导。

## 项目概述

一个专注于单一知识点的数学辅导应用——高中函数定义域。包含两个并行的实现，共享相同的领域逻辑和种子数据：

- **Web 版本**（仓库根目录）— 一个 Next.js App Router 应用。
- **微信小程序**（`miniprogram/`）— Web 版本的移植版。Web 逻辑更新时，小程序的 `shared/` 副本通常需要同步修改。

两个版本都遵循相同的学习流程：诊断 → 苏格拉底法 → 教科书讲解 → 分步演示 → 变式练习 → 高考题 → 费曼自述 → 间隔复习。

## 常用命令

```bash
npm run dev              # Next.js 开发服务器 (localhost:3000)
npm run app:start        # 通过 scripts/start.ps1 后台启动开发服务器（日志写入 .data/）
npm run app:stop         # 停止后台开发服务器
npm run build            # next build
npm run lint             # next lint
npm test                 # vitest run（覆盖 Web lib/ 和小程序 shared/）
npm run test:watch       # vitest watch 模式
npx vitest run tests/grading.test.ts     # 运行单个测试文件
npm run miniprogram:build-js             # 编译小程序 TS → JS（tsc，.js 与 .ts 并存）
```

小程序无开发服务器：在微信开发者工具中打开 `miniprogram/`，然后点击**工具 → 构建 npm**（必须，否则 KaTeX 公式组件无法渲染）。云函数配置详见 `miniprogram/README.md`。

## 架构

### 核心逻辑位于 `lib/`（Web）并镜像到 `miniprogram/shared/lib/`

两个目录树有意重复相同的模块——`grading`、`review-schedule`、`progress`、`math-text`、`types`。将 `lib/*.ts` 视为源代码，保持 `miniprogram/shared/lib/*.ts` 同步。小程序版本还需要检入编译后的 `.js` 文件（与 `.ts` 并存，微信运行的是 `.js`）；通过 `npm run miniprogram:build-js` 重新生成。

### 种子数据作为内容模型

`data/function-domain.seed.ts`（镜像在 `miniprogram/shared/data/function-domain.seed.ts`）包含所有课程、题目、提示、讲解、错误标签和费曼提示。没有 CMS——编辑内容就是编辑种子文件。`lib/types.ts` 定义数据结构（`QuestionSeed`、`LessonSeed`、`SectionType`、`ErrorTag` 等）。

### 判题：本地确定性优先，AI 兜底

`lib/grading.ts` 规范化答案（去空格、全角字符、`U`→`∪`、`>=`→`≥`、排序 `且` 连接的条件）并与 `correctAnswer` + `acceptedAnswers` 比较。仅当本地检查失败**且**题目类型为 `fill_blank` 或 `example` 时，`lib/ai-grading.ts` 才调用 DeepSeek 判断集合等价性。AI 失败时静默回退到本地结果。修改规范化规则时需同时更新 `lib/grading.ts` 和 `miniprogram/shared/lib/grading.ts`。

### 间隔复习

错误尝试通过 `createReviewSchedule` 安排三个复习任务：当天、后 3 天、后 7 天。到期任务（`scheduled_at <= now`，`status = 'pending'`）驱动复习面板。

### Web 端：RSC + 服务端 Action + 按请求 SQLite

`app/page.tsx` 是服务端组件，打开数据库、读取状态、派生进度、关闭数据库。所有写操作通过 `app/actions.ts`（`"use server"`）：提交答案、保存错误标签、提交费曼输出、完成复习、重置进度。每个 Action 打开自己的 `createAppDatabase()`，执行变更，关闭，并 `revalidatePath("/")`。

`lib/db.ts` 使用 Node 内置 `node:sqlite`（`DatabaseSync`）——**不是** better-sqlite3。每次打开时创建连接、运行 `migrate()`（幂等的 `CREATE TABLE IF NOT EXISTS`）和 `seed()`（从种子 `INSERT OR IGNORE`）。数据库文件默认为 `.data/math-coach.sqlite`；通过 `MATH_COACH_DB_PATH` 环境变量覆盖（支持 `:memory:` 用于测试）。用户硬编码为 `demo-student`——这是单用户 MVP。

### 小程序端：wx 本地存储 + 云函数 AI

小程序不使用 SQLite，而是通过 `miniprogram/shared/lib/storage.ts` 将尝试/复习/费曼输出持久化到 `wx` 本地存储（具有可交换的 `StorageAdapter`——运行时用 `createWxStorageAdapter`，测试用 `createMemoryStorageAdapter`）。AI 运行在 `aiCoach` 云函数（`miniprogram/cloudfunctions/aiCoach/index.js`）中，服务端调用 DeepSeek，支持 `mode: "grade" | "feynman" | "health"`。客户端包装器是 `miniprogram/shared/lib/ai-client.ts`。即使未部署云函数，所有本地判题/进度/复习仍可正常工作。

### AI 配置

两个版本都使用 DeepSeek 作为 AI 后端。Web 从环境变量读取 `DEEPSEEK_API_KEY` / `DEEPSEEK_MODEL` / `DEEPSEEK_API_ENDPOINT`（`.env.local`，参考 `.env.example`）。小程序从 `aiCoach` 云函数的环境变量读取相同的值。API 密钥永不存储在客户端；通过测试调用 `{ "mode": "health" }` 验证云配置。

## 约定

- 路径别名 `@/*` 在 `tsconfig.json` 和 `vitest.config.ts` 中都映射到仓库根目录。
- Web tsconfig 是 `strict` 的；小程序 tsconfig 故意宽松（`strict: false`、`module: commonjs`、不包含 DOM）以匹配微信运行时。
- 设计文档和计划位于 `docs/superpowers/`；源教科书是 `docs/bixiu-1.*`。
