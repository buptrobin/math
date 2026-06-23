"use client";

import { useState, useTransition } from "react";
import { Lightbulb, Send } from "lucide-react";
import { saveErrorTagAction, submitAnswerAction } from "@/app/actions";
import { ErrorTagPicker } from "@/components/error-tag-picker";
import { MathText } from "@/components/math-text";
import { getChoiceLabel } from "@/lib/choice-label";
import type { ErrorTag, QuestionSeed } from "@/lib/types";

export function QuestionCard({ question }: { question: QuestionSeed }) {
  const [answer, setAnswer] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [selectedErrorTag, setSelectedErrorTag] = useState<ErrorTag | undefined>();
  const [errorTagSaved, setErrorTagSaved] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; explanation: string; commonMistake: string; gradingSource?: string; aiReason?: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const needsErrorTag = result?.isCorrect === false && !errorTagSaved;
  const canSubmit = answer.trim().length > 0;

  function submit() {
    startTransition(async () => {
      const response = await submitAnswerAction({
        questionId: question.id,
        userAnswer: answer,
        hintsUsed
      });
      setResult(response);
      setErrorTagSaved(response.isCorrect);
    });
  }

  function saveErrorTag() {
    if (!selectedErrorTag) return;
    startTransition(async () => {
      await saveErrorTagAction({ questionId: question.id, selectedErrorTag });
      setErrorTagSaved(true);
    });
  }

  return (
    <article className="questionCard">
      <div className="questionMeta">
        <span>难度 {question.difficulty}</span>
        <span>{question.examPoint}</span>
      </div>
      <h3>
        <MathText>{question.questionText}</MathText>
      </h3>
      {question.questionType === "example" && (
        <div className="exampleBox">
          <MathText>{question.explanation}</MathText>
        </div>
      )}
      {question.options?.length ? (
        <div className="optionList">
          {question.options.map((option, index) => {
            const label = getChoiceLabel(index);
            return (
              <button key={option} type="button" className={answer === label ? "option activeOption" : "option"} onClick={() => setAnswer(label)}>
                <strong>{label}.</strong> <MathText>{option}</MathText>
              </button>
            );
          })}
        </div>
      ) : question.questionType === "short_answer" ? (
        <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="请用自己的话写出来" rows={5} />
      ) : (
        <input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="填写答案，例如 x≥1 且 x≠3" />
      )}
      <div className="actions">
        <button type="button" onClick={() => setHintsUsed((value) => Math.min(value + 1, question.hints.length))} disabled={hintsUsed >= question.hints.length}>
          <Lightbulb size={16} /> 给一点提示
        </button>
        <button type="button" onClick={submit} disabled={!canSubmit || isPending}>
          <Send size={16} /> 提交
        </button>
      </div>
      {hintsUsed > 0 && (
        <div className="hintBox">
          {question.hints.slice(0, hintsUsed).map((hint) => (
            <p key={hint}>
              <MathText>{hint}</MathText>
            </p>
          ))}
        </div>
      )}
      {needsErrorTag && (
        <div className="errorReview">
          <h4>先归因：这题主要错在哪里？</h4>
          <ErrorTagPicker value={selectedErrorTag} onChange={setSelectedErrorTag} />
          <button type="button" onClick={saveErrorTag} disabled={!selectedErrorTag || isPending}>
            保存错因
          </button>
        </div>
      )}
      {result && (!needsErrorTag || errorTagSaved) && (
        <div className={result.isCorrect ? "resultBox correct" : "resultBox wrong"}>
          <strong>{result.isCorrect ? "答对了" : "这题先记入错题"}</strong>
          <p>
            <MathText>{result.explanation}</MathText>
          </p>
          {result.gradingSource === "ai" && result.aiReason && <p>AI 兜底判断：{result.aiReason}</p>}
          {!result.isCorrect && (
            <p>
              易错点：<MathText>{result.commonMistake}</MathText>
            </p>
          )}
        </div>
      )}
    </article>
  );
}
