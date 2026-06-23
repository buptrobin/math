import { ResetProgressButton } from "@/components/reset-progress-button";
import type { LessonSeed } from "@/lib/types";

export function ProgressSidebar({
  lessons,
  currentLessonId,
  totalAttempts,
  wrongAttempts,
  dueReviews,
  status
}: {
  lessons: LessonSeed[];
  currentLessonId: string;
  totalAttempts: number;
  wrongAttempts: number;
  dueReviews: number;
  status: string;
}) {
  return (
    <aside className="sidebar">
      <div className="brandBlock">
        <span className="eyebrow">函数基础</span>
        <h1>定义域闯关</h1>
        <p>状态：{status}</p>
      </div>
      <div className="statGrid">
        <div>
          <strong>{totalAttempts}</strong>
          <span>作答</span>
        </div>
        <div>
          <strong>{wrongAttempts}</strong>
          <span>错题</span>
        </div>
        <div>
          <strong>{dueReviews}</strong>
          <span>待复习</span>
        </div>
      </div>
      <nav className="sectionNav">
        {lessons.map((lesson) => (
          <a key={lesson.id} href={`#${lesson.id}`} className={lesson.id === currentLessonId ? "activeSection" : ""}>
            <span>{lesson.orderIndex}</span>
            {lesson.title}
          </a>
        ))}
      </nav>
      <div className="sidebarActions">
        <ResetProgressButton />
      </div>
    </aside>
  );
}
