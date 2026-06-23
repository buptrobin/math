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

export interface KnowledgePointRow {
  id: string;
  title: string;
  module: string;
  order_index: number;
  description: string;
  prerequisite_ids: string;
  status: string;
}

export interface LessonRow {
  id: string;
  knowledge_point_id: string;
  title: string;
  section_type: string;
  order_index: number;
}

export interface QuestionRow {
  id: string;
  knowledge_point_id: string;
  lesson_id: string;
  question_text: string;
  question_type: string;
  options_json: string;
  correct_answer: string;
  accepted_answers_json: string;
  explanation: string;
  hints_json: string;
  difficulty: number;
  source: string;
  textbook_page: string | null;
  exam_point: string;
  common_mistake: string;
  error_tags_json: string;
}

export interface AttemptRow {
  id: number;
  user_id: string;
  question_id: string;
  user_answer: string;
  is_correct: number;
  selected_error_tag: string | null;
  hints_used: number;
  created_at: string;
  retry_count: number;
}

export interface ReviewTaskRow {
  id: number;
  user_id: string;
  question_id: string;
  scheduled_at: string;
  status: string;
  review_stage: string;
}

export function getDefaultDbPath() {
  return process.env.MATH_COACH_DB_PATH ?? path.join(process.cwd(), ".data", "math-coach.sqlite");
}

export function createAppDatabase(dbPath = getDefaultDbPath()) {
  if (dbPath !== ":memory:") {
    mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const sqlite = new DatabaseSync(dbPath);
  sqlite.exec("PRAGMA foreign_keys = ON;");
  if (dbPath !== ":memory:") {
    sqlite.exec("PRAGMA journal_mode = WAL;");
  }
  migrate(sqlite);
  seed(sqlite);

  return {
    close: () => sqlite.close(),
    getKnowledgePoint: () =>
      sqlite.prepare("SELECT * FROM knowledge_points WHERE id = ?").get(functionDomainSeed.knowledgePoint.id) as unknown as KnowledgePointRow | undefined,
    getLessons: () => plainRows<LessonRow>(sqlite.prepare("SELECT * FROM lessons ORDER BY order_index").all()),
    getQuestionsByLesson: (lessonId: string) => plainRows<QuestionRow>(sqlite.prepare("SELECT * FROM questions WHERE lesson_id = ? ORDER BY id").all(lessonId)),
    getAllQuestions: () => plainRows<QuestionRow>(sqlite.prepare("SELECT * FROM questions ORDER BY lesson_id, id").all()),
    getAttempts: (userId: string) => plainRows<AttemptRow>(sqlite.prepare("SELECT * FROM attempts WHERE user_id = ? ORDER BY created_at DESC").all(userId)),
    getDueReviewTasks: (userId: string, now = new Date()) =>
      plainRows<ReviewTaskRow>(
        sqlite
          .prepare("SELECT * FROM review_tasks WHERE user_id = ? AND status = 'pending' AND scheduled_at <= ? ORDER BY scheduled_at")
          .all(userId, now.toISOString())
      ),
    recordAttempt: (input: AttemptInput) => recordAttempt(sqlite, input),
    updateLatestAttemptErrorTag: (userId: string, questionId: string, selectedErrorTag: ErrorTag) => {
      const latest = sqlite
        .prepare("SELECT id FROM attempts WHERE user_id = ? AND question_id = ? ORDER BY created_at DESC LIMIT 1")
        .get(userId, questionId) as unknown as { id: number } | undefined;
      if (latest) {
        sqlite.prepare("UPDATE attempts SET selected_error_tag = ? WHERE id = ?").run(selectedErrorTag, latest.id);
      }
    },
    completeReviewTask: (taskId: number) => {
      sqlite.prepare("UPDATE review_tasks SET status = 'completed' WHERE id = ?").run(taskId);
    },
    recordFeynmanOutput: (input: FeynmanInput) => recordFeynmanOutput(sqlite, input),
    resetUserProgress: (userId: string) => resetUserProgress(sqlite, userId)
  };
}

export type AppDatabase = ReturnType<typeof createAppDatabase>;

function plainRows<T>(rows: unknown[]): T[] {
  return rows.map((row) => ({ ...(row as Record<string, unknown>) }) as T);
}

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
    .prepare("INSERT INTO feynman_outputs (user_id, knowledge_point_id, prompt, user_text, ai_feedback, score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(input.userId, input.knowledgePointId, input.prompt, input.userText, input.aiFeedback, input.score, createdAt);

  return { id: Number(result.lastInsertRowid), createdAt };
}

function resetUserProgress(sqlite: DatabaseSync, userId: string) {
  sqlite.exec("BEGIN");
  try {
    sqlite.prepare("DELETE FROM attempts WHERE user_id = ?").run(userId);
    sqlite.prepare("DELETE FROM review_tasks WHERE user_id = ?").run(userId);
    sqlite.prepare("DELETE FROM feynman_outputs WHERE user_id = ?").run(userId);
    sqlite.exec("COMMIT");
  } catch (error) {
    sqlite.exec("ROLLBACK");
    throw error;
  }
}
