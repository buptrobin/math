# AGENT.md

本文档总结本项目的产品设计、技术实现和后续协作约定，供 AI 编码代理在本仓库中继续工作时参考。

## 项目定位

本项目是一个面向高中数学「函数定义域」知识点的学习教练。目标不是做完整题库平台，而是围绕一个知识点完成闭环学习：

1. 前置诊断：先发现学生是否理解分母、偶次根号、多个限制条件。
2. 概念追问：用苏格拉底式小问题拆开关键误区。
3. 课本概念精读：把课本定义转成学生能直接操作的判断规则。
4. 课本例题拆解：展示从识别限制到合并条件的完整步骤。
5. 变式练习：覆盖分母、根号、组合限制、区间表达。
6. 高考综合挑战：加入参数、复合函数、反向推理等综合题。
7. 费曼输出：让学生用自己的话解释定义域判断方法。
8. 错题复习：基于错误尝试生成当天、3 天后、7 天后的复习任务。

设计原则是小而完整：内容固定、流程清晰、可以持久化学习进度，并且在没有 AI 或云函数时仍能完成核心学习。

## 双端实现

仓库包含两个并行版本：

- Web 版：根目录下的 Next.js App Router 应用。
- 微信小程序版：`miniprogram/` 目录。

两个版本共享同一套领域模型、种子内容和核心学习逻辑。Web 侧的源模块位于 `lib/` 和 `data/`，小程序侧镜像在 `miniprogram/shared/lib/` 和 `miniprogram/shared/data/`。修改核心逻辑或课程内容时，通常要同步两边。

小程序运行的是编译后的 `.js` 文件，因此改动 `miniprogram/**/*.ts` 后必须执行：

```bash
npm run miniprogram:build-js
```

## 内容模型

课程内容集中在：

- `data/function-domain.seed.ts`
- `miniprogram/shared/data/function-domain.seed.ts`

种子数据包含：

- `knowledgePoint`：知识点元信息。
- `lessons`：学习环节顺序和类型。
- `textbookExplanation`：正式定义、学生化解释、规则卡片。
- `questions`：题目、选项、标准答案、可接受答案、讲解、提示、难度、考点、常见错误和错误标签。
- `feynmanPrompts`：费曼输出提示。

类型定义在：

- `lib/types.ts`
- `miniprogram/shared/lib/types.ts`

`SectionType` 是封闭联合类型。新增课程环节时，需要同步更新类型、种子数据和相关测试。

## 判题设计

判题采用「确定性优先，AI 兜底」：

1. 本地判题先运行 `gradeAnswer`。
2. 本地判题会做规范化：去空格、兼容 `U/∪`、`>=/≤`、`!=/≠`、大小写 `x`、LaTeX 包裹和部分条件重排。
3. 单选题提交的是 `A/B/C/D` 选项标识，同时选项正文仍用 KaTeX/LaTeX 渲染。
4. 只有 `fill_blank` 和 `example` 在本地判错后才进入 AI 等价判断。
5. AI 失败时回退到本地结果，不阻断学习流程。

相关文件：

- Web：`lib/grading.ts`、`lib/ai-grading.ts`
- 小程序：`miniprogram/shared/lib/grading.ts`、`miniprogram/shared/lib/ai-client.ts`
- 云函数：`miniprogram/cloudfunctions/aiCoach/index.js`

## 持久化设计

Web 版使用 SQLite：

- 数据库实现：`lib/db.ts`
- 默认数据库路径：`.data/math-coach.sqlite`
- 可通过 `MATH_COACH_DB_PATH` 覆盖。
- 每次打开连接时执行幂等迁移和种子写入。
- 当前是单用户 MVP，用户固定为 `demo-student`。

小程序版使用微信本地存储：

- 存储实现：`miniprogram/shared/lib/storage.ts`
- 存储内容包括答题尝试、复习任务、费曼输出和 UI 状态。
- 提供 `createWxStorageAdapter` 和 `createMemoryStorageAdapter`，便于运行时和测试复用。

错题复习由 `createReviewSchedule` 生成三次任务：当天、3 天后、7 天后。

## 小程序页面结构

主要页面：

- `miniprogram/pages/index/`：首页和学习进度入口。
- `miniprogram/pages/lesson/`：课程练习页，承载诊断题、讲解、例题、变式、高考题和费曼输出。
- `miniprogram/pages/review/`：错题复习页。

主要组件：

- `miniprogram/components/question-card/`：题卡、选项、填空、提示、提交和结果展示。
- `miniprogram/components/math-rich-text/`：混排文本和公式渲染。
- `miniprogram/components/progress-summary/`：进度摘要。

公式渲染使用 `@rojer/katex-mini`。微信开发者工具导入 `miniprogram/` 后必须执行「工具 -> 构建 npm」，否则公式组件不会正常渲染。

## 公式渲染实现

小程序公式渲染入口是：

- `miniprogram/shared/lib/math-render.ts`
- `miniprogram/components/math-rich-text/math-rich-text.*`

实现要点：

- 普通文本和简单行内公式保持行内展示。
- 包含 `\frac`、`\sqrt` 或较长 LaTeX 的公式会拆成块级公式。
- 块级公式放入横向 `scroll-view`，避免窄屏手机横向截断。
- iPhone 上 `scroll-view` 对 KaTeX 复杂结构高度计算偏保守，容易裁掉分式或根号；因此 `mathScroll` 和 `mathBlockContent` 必须保留稳定的最小高度和上下内边距。

如果继续调整公式样式，要重点验证 iPhone 真机或 iOS 模拟器上的分式、根号、长区间表达式。

## AI 云函数

小程序 AI 能力由 `aiCoach` 云函数提供，支持：

- `mode: "health"`：检查云函数和环境变量。
- `mode: "grade"`：判断填空或例题答案是否等价。
- `mode: "feynman"`：评价学生的费曼输出。

云函数环境变量：

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_MODEL`
- `DEEPSEEK_API_ENDPOINT`

API Key 只放在服务端环境变量中，不能写入小程序前端代码。

## 常用命令

```bash
npm run dev
npm run app:start
npm run app:stop
npm run build
npm test
npm run miniprogram:build-js
```

在 Windows/Git Bash 场景下，优先使用 `restart.cmd` 启停 Web 开发服务。

## 修改约定

- 修改 Web 共享逻辑时，同步检查 `miniprogram/shared/lib/`。
- 修改课程内容时，同步检查 `data/function-domain.seed.ts` 和 `miniprogram/shared/data/function-domain.seed.ts`。
- 修改小程序 TypeScript 后，运行 `npm run miniprogram:build-js` 并提交生成的 `.js`。
- 修改判题规范化时，补充或更新对应测试。
- 修改公式渲染时，至少覆盖分式、根号、长定义域表达式，并注意 iPhone 裁剪问题。
- 不要把 `.env.local`、真实 API Key、`.data/` 运行数据提交到仓库。

## 当前实现状态

当前版本已经具备：

- 函数定义域完整学习链路。
- Web 端 SQLite 持久化。
- 小程序端本地存储持久化。
- 本地确定性判题。
- DeepSeek AI 兜底判题和费曼反馈。
- 错题间隔复习。
- KaTeX 公式渲染。
- 小程序 iPhone 复杂公式显示裁剪修复。

后续扩展建议保持小步推进：优先继续围绕函数定义域做内容质量、错因分析和复习体验，而不是过早扩成通用学习平台。
