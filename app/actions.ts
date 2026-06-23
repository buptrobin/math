"use server";

import { revalidatePath } from "next/cache";
import { functionDomainSeed } from "@/data/function-domain.seed";
import { evaluateFeynmanOutput } from "@/lib/ai-coach";
import { createAppDatabase } from "@/lib/db";
import { gradeAnswer } from "@/lib/grading";
import type { ErrorTag } from "@/lib/types";

const demoUserId = "demo-student";

export async function submitAnswerAction(input: {
  questionId: string;
  userAnswer: string;
  hintsUsed: number;
}) {
  const question = functionDomainSeed.questions.find((item) => item.id === input.questionId);
  if (!question) {
    throw new Error(`Unknown question: ${input.questionId}`);
  }

  const grade = gradeAnswer(question, input.userAnswer);
  const db = createAppDatabase();
  try {
    db.recordAttempt({
      userId: demoUserId,
      questionId: input.questionId,
      userAnswer: input.userAnswer,
      isCorrect: grade.isCorrect,
      selectedErrorTag: undefined,
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

export async function saveErrorTagAction(input: { questionId: string; selectedErrorTag: ErrorTag }) {
  const db = createAppDatabase();
  try {
    db.updateLatestAttemptErrorTag(demoUserId, input.questionId, input.selectedErrorTag);
  } finally {
    db.close();
  }
  revalidatePath("/");
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

export async function resetProgressAction() {
  const db = createAppDatabase();
  try {
    db.resetUserProgress(demoUserId);
  } finally {
    db.close();
  }
  revalidatePath("/");
}
