"use client";

import { useTransition } from "react";
import { completeReviewTaskAction } from "@/app/actions";
import type { ReviewTaskRow } from "@/lib/db";

export function ReviewPanel({ tasks }: { tasks: ReviewTaskRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (tasks.length === 0) {
    return <div className="emptyPanel">今天暂无到期错题。做错的题会安排当天、3 天后、7 天后复习。</div>;
  }

  return (
    <div className="reviewList">
      {tasks.map((task) => (
        <div key={task.id} className="reviewItem">
          <div>
            <strong>{task.question_id}</strong>
            <p>
              {task.review_stage} · {new Date(task.scheduled_at).toLocaleString("zh-CN")}
            </p>
          </div>
          <button type="button" disabled={isPending} onClick={() => startTransition(() => completeReviewTaskAction(task.id))}>
            标记已重做
          </button>
        </div>
      ))}
    </div>
  );
}
