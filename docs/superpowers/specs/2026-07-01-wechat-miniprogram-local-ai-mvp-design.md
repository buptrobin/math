# 微信小程序本地存储 + AI MVP 设计

## 目标

为现有“函数定义域教练”构建一个微信小程序 MVP。小程序应以原生小程序方式运行，学生进度先保存在本机，并通过云函数调用 AI，完成答案等价性判定和费曼输出反馈。

现有 Next.js Web 应用保持不变。小程序新增在独立的 `miniprogram/` 目录下，让 Web 版和小程序版可以并存。

## 非目标

- 第一版不做多设备云同步。
- 不迁移或替换现有 Next.js 应用。
- 小程序前端不包含任何 AI API Key。
- 不建设完整内容管理后台。
- 不扩展到当前“函数定义域”种子内容以外的知识点。

## 架构

项目会包含两个可运行入口：

- 现有 Web 应用：继续使用当前 Next.js、SQLite 持久化和 Server Actions。
- 新增小程序：原生微信小程序文件位于 `miniprogram/`，进度使用本地存储，AI 通过一个云函数代理。

小程序尽量复用稳定的数据和纯逻辑：

- `functionDomainSeed`：课程、题目、解释、提示和费曼提示。
- `QuestionSeed`、`LessonSeed`、`SectionType` 等 TypeScript 类型。
- 本地确定性答案归一化和判题逻辑。
- 进度派生和复习计划逻辑，并适配小程序本地存储记录。

React 组件、Next.js Server Actions 和 SQLite 数据库代码不直接复用，因为它们依赖原生小程序中不存在的浏览器或 Node 服务端运行时。

## 目录结构

```text
miniprogram/
  app.json
  app.ts
  app.wxss
  pages/
    index/
      index.json
      index.wxml
      index.wxss
      index.ts
    lesson/
      lesson.json
      lesson.wxml
      lesson.wxss
      lesson.ts
    review/
      review.json
      review.wxml
      review.wxss
      review.ts
  components/
    question-card/
      question-card.json
      question-card.wxml
      question-card.wxss
      question-card.ts
    progress-summary/
      progress-summary.json
      progress-summary.wxml
      progress-summary.wxss
      progress-summary.ts
  shared/
    data/
      function-domain.seed.ts
    lib/
      ai-client.ts
      grading.ts
      progress.ts
      review-schedule.ts
      storage.ts
      types.ts
  cloudfunctions/
    aiCoach/
      index.js
      package.json
```

这个结构把小程序构建假设隔离在 `miniprogram/` 内，不影响 Next.js 源码树。

## 产品范围

MVP 从学习首页开始，展示当前知识点、进度摘要和课程环节列表。学生可以进入每个环节，完成该环节内的题目。

课程环节：

- 前置诊断
- 概念追问
- 课本概念精读
- 课本例题拆解
- 变式练习
- 高考综合挑战
- 费曼输出
- 错题复习

题目交互：

- 单选题使用选项按钮。
- 填空题和例题使用文本输入。
- 学生可以逐条查看提示。
- 提交后，小程序先执行本地确定性判题。
- 如果本地判题认为错误，且题型是填空题或例题，小程序调用 AI 云函数做等价性判定。
- 结果展示正误、解析、常见错误，以及判题来源是本地规则还是 AI。

费曼输出：

- 学生针对每个费曼提示输入自己的解释。
- 小程序以 `mode: "feynman"` 调用同一个云函数。
- 云函数返回分数和简短可执行反馈。

错题复习：

- 错误作答会创建本地复习任务。
- 复习页从本地存储读取到期任务。
- 完成复习后，本地标记任务为已完成。

重置：

- 首页提供重置入口，清空本地进度、答题记录、复习任务和 AI 反馈。

## 本地存储模型

MVP 中学生进度只保存在本机。

存储键：

- `mathCoachAttempts`
- `mathCoachReviewTasks`
- `mathCoachFeynmanOutputs`
- `mathCoachUiState`

答题记录：

```ts
interface MiniAttempt {
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
```

复习任务记录：

```ts
interface MiniReviewTask {
  id: string;
  questionId: string;
  scheduledAt: string;
  status: "pending" | "completed";
  reviewStage: ReviewStage;
}
```

费曼输出记录：

```ts
interface MiniFeynmanOutput {
  id: string;
  promptId: string;
  prompt: string;
  userText: string;
  aiFeedback: string;
  score: number;
  createdAt: string;
}
```

## AI 云函数

小程序调用一个名为 `aiCoach` 的云函数。

请求结构：

```ts
type AiCoachRequest =
  | {
      mode: "grade";
      questionId: string;
      userAnswer: string;
    }
  | {
      mode: "feynman";
      prompt: string;
      userText: string;
    };
```

判题响应：

```ts
interface AiGradeResponse {
  ok: true;
  mode: "grade";
  isEquivalent: boolean;
  reason: string;
}
```

费曼反馈响应：

```ts
interface AiFeynmanResponse {
  ok: true;
  mode: "feynman";
  score: number;
  aiFeedback: string;
}
```

错误响应：

```ts
interface AiErrorResponse {
  ok: false;
  error: string;
}
```

云函数环境变量：

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_MODEL`，默认 `deepseek-chat`
- `DEEPSEEK_API_ENDPOINT`，默认 `https://api.deepseek.com/chat/completions`

云函数负责校验输入。判题请求会从种子数据中查找题目，构造约束为 JSON 输出的 DeepSeek 提示词，解析结果后返回小型结构化响应。如果 DeepSeek 请求失败或返回非法 JSON，云函数返回 `ok: false`，不暴露 API Key 或原始供应商响应。

## AI 安全边界

小程序前端永远不包含 DeepSeek API Key。所有 AI 请求都通过云函数。

判题场景中，AI 只作为本地确定性判题失败后的兜底。提示词要求模型只判断函数定义域答案表示的集合是否等价，不做无关数学求解，也不做开放式辅导。

费曼反馈场景中，模型只返回简短学习反馈和分数，不引入当前函数定义域概念之外的新课程内容。

## 公式渲染

MVP 使用小程序友好的文本展示，不尝试移植 KaTeX。种子内容可以保留 `√(x-1)`、`x ≥ 1`、区间、并集符号等可读写法。如果存在原始 LaTeX 片段，小程序应通过去掉简单 `$` 分隔符和常见转义形式来展示可读降级文本。

后续可以接入小程序兼容的数学公式组件，或使用预渲染公式图片。

## 测试策略

第一版实现应保留共享行为的单元测试：

- 确定性判题归一化。
- 使用内存存储适配器测试本地存储仓库操作。
- 错误作答后创建复习任务。
- 云函数失败时 AI 客户端的兜底行为。

手动验证使用微信开发者工具：

- 从 `miniprogram/` 启动小程序。
- 完成一道单选题。
- 提交一个本地规则可接受的填空等价答案。
- 提交一个需要 AI 等价性判定的填空答案。
- 提交一段费曼解释。
- 确认重启后进度仍保留。
- 重置进度并确认本地状态清空。

## 验收标准

- 现有 Next.js 应用仍可按原方式构建和测试。
- `miniprogram/` 下存在原生小程序项目。
- 首页、课程页、复习页、本地进度和重置流程在没有云配置时也可使用。
- 确定性判题可离线工作。
- 配置云函数后，填空题 AI 兜底和费曼反馈会调用 `aiCoach`。
- AI 配置缺失或调用失败不会阻塞普通本地学习流程。
- 不提交任何 AI 密钥，也不在前端代码中引用密钥。
