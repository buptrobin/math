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
  const normalized = compact.replace(/>=/g, "≥").replace(/<=/g, "≤").replace(/!=/g, "≠");
  return normalizeConjunction(normalized);
}

function normalizeConjunction(value: string): string {
  if (!value.includes("且")) {
    return value;
  }

  return value
    .split("且")
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
    .join("且");
}

export function gradeAnswer(question: QuestionSeed, userAnswer: string): GradeResult {
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  const accepted = [question.correctAnswer, ...(question.acceptedAnswers ?? [])].map(normalizeAnswer);

  return {
    isCorrect: accepted.includes(normalizedUserAnswer),
    normalizedUserAnswer
  };
}
