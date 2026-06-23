export type SectionType =
  | "diagnostic"
  | "socratic"
  | "textbook_explanation"
  | "example_breakdown"
  | "variation_practice"
  | "feynman_output"
  | "review";

export type QuestionType = "single_choice" | "fill_blank" | "short_answer" | "example";

export type ErrorTag = "概念错" | "识别错" | "步骤错" | "计算错" | "审题错";

export type ReviewStage = "same_day" | "three_days" | "seven_days";

export type KnowledgeStatus = "未开始" | "诊断中" | "学习中" | "练习中" | "已通关";

export interface KnowledgePointSeed {
  id: string;
  title: string;
  module: string;
  orderIndex: number;
  description: string;
  prerequisiteIds: string[];
  status: KnowledgeStatus;
}

export interface LessonSeed {
  id: string;
  knowledgePointId: string;
  title: string;
  sectionType: SectionType;
  orderIndex: number;
}

export interface QuestionSeed {
  id: string;
  knowledgePointId: string;
  lessonId: string;
  questionText: string;
  questionType: QuestionType;
  options?: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  explanation: string;
  hints: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  source: "textbook" | "adapted" | "coach";
  textbookPage?: string;
  examPoint: string;
  commonMistake: string;
  errorTags: ErrorTag[];
}

export interface FeynmanPromptSeed {
  id: string;
  knowledgePointId: string;
  prompt: string;
}

export interface LessonContentSeed {
  knowledgePoint: KnowledgePointSeed;
  lessons: LessonSeed[];
  questions: QuestionSeed[];
  feynmanPrompts: FeynmanPromptSeed[];
  textbookExplanation: {
    formal: string;
    studentFriendly: string;
    ruleCards: string[];
  };
}
