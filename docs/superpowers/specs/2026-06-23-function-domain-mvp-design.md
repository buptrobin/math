# 高中数学函数定义域 MVP 设计

## 目标

第一版做一个轻量级可部署 Web MVP，只验证“函数定义域”这一关的学习闭环是否有效。系统不是电子课本，也不是普通题库，而是按小步诊断和追问推进的数学闯关教练。

核心闭环：

1. 诊断学生卡在哪里。
2. 用追问让学生自己说出规则。
3. 拆解课本母题。
4. 做分层变式练习。
5. 用自己的话解释概念。
6. 对错题做错因归类。
7. 安排当天、3 天后、7 天后复习。

## 第一版范围

只实现一个关卡：函数定义域。

包含 7 个环节：

1. 前置诊断：5 道基础题。
2. 概念追问：5 个小步问题。
3. 课本概念精读：把定义域解释成孩子能懂的话。
4. 课本例题拆解：2 道母题，按“看到什么、想到什么、怎么做、换皮怎么考”展示。
5. 变式练习：10 道题，覆盖只换数字、换结构、换问法、反向判断。
6. 费曼输出：2 到 3 个简答问题。
7. 错题复盘：错因选择、重做、复习任务。

暂不实现：

- 多用户注册登录。
- 排名、社交、积分商城。
- 视频课。
- 大规模题库后台。
- 电子课本导入。
- 真实 AI 接口调用。
- 完整 10 个函数基础关卡。

## 产品结构

首页直接进入“函数定义域”关卡，不做营销页。

页面采用“闯关教练式”布局：

- 左侧：7 个环节进度、当前状态、今日复习数、错题数。
- 右侧：当前学习任务。
- 底部或右侧辅助区：提示、解析、错因选择、下一步按钮。

学生操作路径：

1. 进入关卡。
2. 逐题作答。
3. 答错时先允许看提示，最多 3 次提示后展示解析。
4. 解析后选择错因标签。
5. 系统保存作答记录，并为错题生成复习任务。
6. 完成诊断、学习、练习、费曼输出后进入复习区。

## 学习状态

知识点状态：

- 未开始
- 诊断中
- 学习中
- 练习中
- 已通关

第一版通关条件采用简化规则：

1. 诊断题正确率达到 60% 以上，或完成对应补救说明。
2. 至少完成 2 道课本母题。
3. 变式练习中连续答对 3 道。
4. 完成至少 2 个费曼输出问题。
5. 错题复习任务中至少完成一次重做并答对。

## 技术结构

采用轻量 B 方案：

- 前端：Next.js App Router。
- 后端：Next.js Route Handlers 或 Server Actions。
- 数据库：SQLite。
- ORM/数据库访问：优先使用轻量直接访问层，后续可替换为 Prisma 或 Drizzle。
- 题库：第一版使用本地 seed 数据，启动或初始化时写入 SQLite。
- 用户：固定默认学生 `demo-student`，不做登录。

目录建议：

```text
app/
  page.tsx
  api/
    attempts/
    review-tasks/
    feynman/
components/
  lesson-shell.tsx
  question-card.tsx
  progress-sidebar.tsx
  error-tag-picker.tsx
  review-panel.tsx
lib/
  db.ts
  seed.ts
  lesson-data.ts
  grading.ts
  review-schedule.ts
  ai-coach.ts
data/
  function-domain.seed.ts
```

## 数据模型

第一版 SQLite 表：

### knowledge_points

- id
- title
- module
- order_index
- description
- prerequisite_ids
- status

### lessons

- id
- knowledge_point_id
- title
- section_type
- order_index

`section_type` 包括：

- diagnostic
- socratic
- textbook_explanation
- example_breakdown
- variation_practice
- feynman_output
- review

### questions

- id
- knowledge_point_id
- lesson_id
- question_text
- question_type
- options_json
- correct_answer
- explanation
- hints_json
- difficulty
- source
- textbook_page
- exam_point
- common_mistake
- error_tags_json

### attempts

- id
- user_id
- question_id
- user_answer
- is_correct
- selected_error_tag
- hints_used
- created_at
- retry_count

### review_tasks

- id
- user_id
- question_id
- scheduled_at
- status
- review_stage

`review_stage` 包括：

- same_day
- three_days
- seven_days

### feynman_outputs

- id
- user_id
- knowledge_point_id
- prompt
- user_text
- ai_feedback
- score
- created_at

## 题目内容策略

第一版题目全部固定写入 seed 数据，并人工控制难度，不接入自由生成。

题型包括：

- 单选题
- 填空题
- 简答题
- 例题拆解展示

判题策略：

- 单选题：精确匹配选项。
- 填空题：第一版使用规范答案匹配和少量等价答案列表，例如 `[1,3)∪(3,+∞)` 与 `x≥1且x≠3`。
- 简答题：第一版先保存文本，给出规则化反馈模板；真实 AI 判断后续接入。

## 错因与复习

错因标签固定为：

- 概念错
- 识别错
- 步骤错
- 计算错
- 审题错

答错后流程：

1. 展示“先想想错在哪里”的错因选择。
2. 保存 attempt。
3. 创建 3 个 review_tasks：
   - 当天
   - 3 天后
   - 7 天后
4. 复习区按 `scheduled_at <= now` 展示待复习题。

## AI 边界

第一版不直接调用真实大模型。

保留 `lib/ai-coach.ts` 服务层，用于后续接入：

- 费曼输出判断。
- 根据错因生成补救题。
- 把课本定义改写成孩子版。
- 生成同考点变式题。

页面不直接调用 AI SDK。后续接入时必须经过服务层，避免页面和模型强耦合。

AI 教练规则保留在代码常量或 prompt 模板中：

- 不直接给答案。
- 先问下一步。
- 答错先给提示。
- 最多提示 3 次。
- 不跳步。
- 不引入当前关卡之外的新知识点。

## 验证标准

MVP 完成后应能验证：

1. 用户可以进入“函数定义域”关卡。
2. 用户可以完成诊断题、追问、例题、变式、费曼输出。
3. 单选、填空、简答输入都能提交。
4. 提示按钮可用，并记录提示次数。
5. 答题后能看到解析。
6. 答错后能选择错因。
7. 作答记录写入 SQLite。
8. 错题生成复习任务。
9. 复习区能展示待复习题并支持重做。
10. 页面能显示简单学习进度。

## 非目标

本阶段不追求完整内容规模、复杂推荐算法、强 AI 能力或正式用户体系。第一目标是让一个基础薄弱的高中学生能按“诊断、追问、母题、变式、讲出来、错题复习”的路径真实学完定义域。
