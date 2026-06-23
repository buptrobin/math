"use client";

import type { ErrorTag } from "@/lib/types";

const tags: ErrorTag[] = ["概念错", "识别错", "步骤错", "计算错", "审题错"];

export function ErrorTagPicker({ value, onChange }: { value?: ErrorTag; onChange: (tag: ErrorTag) => void }) {
  return (
    <div className="tagGrid" aria-label="错因选择">
      {tags.map((tag) => (
        <button key={tag} type="button" className={value === tag ? "tag activeTag" : "tag"} onClick={() => onChange(tag)}>
          {tag}
        </button>
      ))}
    </div>
  );
}
