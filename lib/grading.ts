import type { QuestionSeed } from "@/lib/types";

export interface GradeResult {
  isCorrect: boolean;
  normalizedUserAnswer: string;
}

const replacements: Array<[RegExp, string]> = [
  [/\s+/g, ""],
  [/U/g, "∪"],
  [/，/g, ","],
  [/<>/g, "!="],
  [/！=/g, "!="],
  [/≠/g, "!="],
  [/≥/g, ">="],
  [/≤/g, "<="],
  [/[ＸX]/g, "x"],
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
