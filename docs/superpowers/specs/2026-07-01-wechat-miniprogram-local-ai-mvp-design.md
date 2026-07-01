# WeChat Mini Program Local Storage + AI MVP Design

## Goal

Build a WeChat Mini Program MVP for the existing function-domain coach. The mini program should run as a native mini program, store student progress locally on the device, and call a cloud function for AI-powered answer equivalence checks and Feynman-style feedback.

The existing Next.js web app remains intact. The mini program is added under a separate `miniprogram/` directory so both surfaces can coexist.

## Non-Goals

- No multi-user cloud sync in the first mini program MVP.
- No migration away from the existing Next.js app.
- No AI API key in mini program frontend code.
- No full content management backend.
- No broad subject expansion beyond the current function-domain lesson seed.

## Architecture

The project will contain two runnable surfaces:

- Existing web app: current Next.js app, SQLite persistence, and server actions.
- New mini program: native WeChat Mini Program files under `miniprogram/`, local storage persistence, and one cloud function for AI.

The mini program reuses the stable, data-driven core where practical:

- `functionDomainSeed` for lessons, questions, explanations, hints, and Feynman prompts.
- `QuestionSeed`, `LessonSeed`, `SectionType`, and related TypeScript types.
- Deterministic answer normalization and grading before AI fallback.
- Progress derivation and review scheduling logic, adapted to mini program storage records.

React components, Next.js server actions, and SQLite database code are not reused directly because they depend on browser/server runtimes that do not exist inside a native mini program.

## Directory Layout

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

This layout keeps mini program-specific build assumptions away from the Next.js source tree.

## Product Scope

The MVP starts on a learning dashboard that shows the current knowledge point, progress summary, and lesson list. Students can enter each lesson and answer the questions in that lesson.

Lesson sections:

- Diagnostic
- Socratic prompts
- Textbook explanation
- Example breakdown
- Variation practice
- Gaokao challenge
- Feynman output
- Review

Question interactions:

- Single-choice questions use option buttons.
- Fill-blank and example questions use text input.
- Students can reveal hints one at a time.
- On submit, the mini program runs deterministic grading first.
- If deterministic grading says wrong and the question is fill-blank or example type, the mini program calls the AI cloud function for equivalence checking.
- The result shows correctness, explanation, common mistake, and whether grading came from local rules or AI.

Feynman output:

- Students type an explanation for each Feynman prompt.
- The mini program calls the same cloud function with `mode: "feynman"`.
- The response returns a score and short actionable feedback.

Review:

- Wrong attempts create local review tasks.
- The review page lists due tasks from local storage.
- Completing a review marks the task complete locally.

Reset:

- The dashboard exposes a reset action that clears local progress, attempts, review tasks, and AI feedback.

## Local Storage Model

Mini program progress is local-only in the MVP.

Storage keys:

- `mathCoachAttempts`
- `mathCoachReviewTasks`
- `mathCoachFeynmanOutputs`
- `mathCoachUiState`

Attempt record:

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

Review task record:

```ts
interface MiniReviewTask {
  id: string;
  questionId: string;
  scheduledAt: string;
  status: "pending" | "completed";
  reviewStage: ReviewStage;
}
```

Feynman output record:

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

## AI Cloud Function

The mini program calls one cloud function named `aiCoach`.

Request shape:

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

Grade response:

```ts
interface AiGradeResponse {
  ok: true;
  mode: "grade";
  isEquivalent: boolean;
  reason: string;
}
```

Feynman response:

```ts
interface AiFeynmanResponse {
  ok: true;
  mode: "feynman";
  score: number;
  aiFeedback: string;
}
```

Error response:

```ts
interface AiErrorResponse {
  ok: false;
  error: string;
}
```

Cloud function environment variables:

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_MODEL`, default `deepseek-chat`
- `DEEPSEEK_API_ENDPOINT`, default `https://api.deepseek.com/chat/completions`

The cloud function validates input, looks up questions from the seed data for grading requests, sends a constrained JSON-output prompt to DeepSeek, parses the result, and returns a small structured response. If DeepSeek fails or returns invalid JSON, the function returns `ok: false` without exposing the API key or raw provider payload.

## AI Safety Boundary

The mini program frontend never contains the DeepSeek API key. All AI requests go through the cloud function.

For grading, AI is only a fallback after deterministic grading fails. The prompt asks the model to judge set equivalence for function-domain answers, not to solve unrelated math or provide open-ended tutoring.

For Feynman feedback, the model gives short coaching feedback and a score. It should not introduce new curriculum beyond the current function-domain concept.

## Formula Rendering

The MVP uses mini program-friendly text rendering rather than trying to port KaTeX. Seed strings may keep readable notation such as `√(x-1)`, `x ≥ 1`, intervals, and union symbols. If a raw LaTeX fragment is present, the mini program should display a readable fallback by stripping simple `$` delimiters and common escape forms.

Rich LaTeX rendering can be added later with a mini program-compatible math component or pre-rendered formula images.

## Testing Strategy

The first implementation should preserve unit coverage for shared behavior:

- Deterministic grading normalization.
- Local storage repository operations using an in-memory storage adapter in tests.
- Review task creation after wrong attempts.
- AI client fallback behavior when the cloud function fails.

Manual verification will use WeChat Developer Tools:

- Launch mini program from `miniprogram/`.
- Answer a single-choice question.
- Answer a fill-blank question with a locally accepted equivalent answer.
- Answer a fill-blank question that requires AI equivalence.
- Submit a Feynman explanation.
- Confirm progress survives app restart.
- Reset progress and confirm local state is cleared.

## Acceptance Criteria

- The existing Next.js app still builds and tests as before.
- A native mini program project exists under `miniprogram/`.
- The dashboard, lesson view, review view, local progress, and reset flow work without cloud configuration.
- Deterministic grading works offline.
- Fill-blank AI fallback and Feynman feedback call the `aiCoach` cloud function when configured.
- Missing or failing AI configuration does not block normal local learning flows.
- No AI secret is committed or referenced in frontend code.
