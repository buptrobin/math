import { LessonShell } from "@/components/lesson-shell";
import { ProgressSidebar } from "@/components/progress-sidebar";
import { functionDomainSeed } from "@/data/function-domain.seed";
import { createAppDatabase } from "@/lib/db";
import { deriveProgress } from "@/lib/progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const demoUserId = "demo-student";

export default function HomePage() {
  const db = createAppDatabase();
  const attempts = db.getAttempts(demoUserId);
  const dueReviewTasks = db.getDueReviewTasks(demoUserId);
  db.close();

  const progress = deriveProgress({ attempts, dueReviews: dueReviewTasks.length });

  return (
    <div className="appShell">
      <ProgressSidebar
        lessons={functionDomainSeed.lessons}
        currentLessonId="lesson-domain-diagnostic"
        totalAttempts={progress.totalAttempts}
        wrongAttempts={progress.wrongAttempts}
        dueReviews={progress.dueReviews}
        status={progress.status}
      />
      <LessonShell lessons={functionDomainSeed.lessons} questions={functionDomainSeed.questions} reviewTasks={dueReviewTasks} />
    </div>
  );
}
