"use client";

import { useMemo, useState, useTransition } from "react";
import { submitFeynmanAction } from "@/app/actions";
import { QuestionCard } from "@/components/question-card";
import { ReviewPanel } from "@/components/review-panel";
import { functionDomainSeed } from "@/data/function-domain.seed";
import type { ReviewTaskRow } from "@/lib/db";
import type { LessonSeed, QuestionSeed } from "@/lib/types";

export function LessonShell({ lessons, questions, reviewTasks }: { lessons: LessonSeed[]; questions: QuestionSeed[]; reviewTasks: ReviewTaskRow[] }) {
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
                {functionDomainSeed.textbookExplanation.ruleCards.map((rule) => (
                  <div key={rule}>{rule}</div>
                ))}
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
          {(questionsByLesson[lesson.id] ?? []).map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </section>
      ))}
    </main>
  );
}
