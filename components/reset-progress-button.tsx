"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { resetProgressAction } from "@/app/actions";

export function ResetProgressButton() {
  const [isPending, startTransition] = useTransition();

  function resetProgress() {
    const confirmed = window.confirm("确定要重置当前学习进度吗？作答记录、错题复习和费曼输出都会清空，题库内容会保留。");
    if (!confirmed) return;

    startTransition(async () => {
      await resetProgressAction();
      window.location.reload();
    });
  }

  return (
    <button type="button" className="resetButton" onClick={resetProgress} disabled={isPending}>
      <RotateCcw size={16} />
      重新开始
    </button>
  );
}
