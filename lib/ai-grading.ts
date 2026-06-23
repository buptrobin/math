import { gradeAnswer, type GradeResult } from "@/lib/grading";
import type { QuestionSeed } from "@/lib/types";

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface AiFallbackOptions {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  fetchImpl?: FetchLike;
}

export interface AiGradeResult extends GradeResult {
  source: "local" | "ai";
  aiReason?: string;
}

interface DeepSeekResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface EquivalenceResult {
  is_equivalent?: boolean;
  reason?: string;
}

export async function gradeAnswerWithAiFallback(
  question: QuestionSeed,
  userAnswer: string,
  options: AiFallbackOptions = {}
): Promise<AiGradeResult> {
  const local = gradeAnswer(question, userAnswer);
  if (local.isCorrect || !["fill_blank", "example"].includes(question.questionType)) {
    return { ...local, source: "local" };
  }

  const apiKey = options.apiKey ?? process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return { ...local, source: "local" };
  }

  try {
    const aiResult = await askDeepSeekForEquivalence(question, userAnswer, {
      apiKey,
      model: options.model ?? process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      endpoint: options.endpoint ?? process.env.DEEPSEEK_API_ENDPOINT ?? "https://api.deepseek.com/chat/completions",
      fetchImpl: options.fetchImpl ?? fetch
    });

    if (aiResult.is_equivalent === true) {
      return {
        ...local,
        isCorrect: true,
        source: "ai",
        aiReason: aiResult.reason
      };
    }

    return {
      ...local,
      source: "ai",
      aiReason: aiResult.reason
    };
  } catch (error) {
    return {
      ...local,
      source: "local",
      aiReason: error instanceof Error ? error.message : "AI 判题失败，已使用本地规则结果。"
    };
  }
}

async function askDeepSeekForEquivalence(
  question: QuestionSeed,
  userAnswer: string,
  options: Required<Pick<AiFallbackOptions, "apiKey" | "model" | "endpoint" | "fetchImpl">>
): Promise<EquivalenceResult> {
  const response = await options.fetchImpl(options.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`
    },
    body: JSON.stringify({
      model: options.model,
      response_format: { type: "json_object" },
      temperature: 0,
      stream: false,
      messages: [
        {
          role: "system",
          content:
            "你是高中数学填空题判题器。只判断学生答案是否与标准答案数学等价。不要因为表达形式不同判错。必须只输出 JSON，格式为 {\"is_equivalent\": boolean, \"reason\": string}。"
        },
        {
          role: "user",
          content: JSON.stringify({
            question: question.questionText,
            correctAnswer: question.correctAnswer,
            acceptedAnswers: question.acceptedAnswers ?? [],
            studentAnswer: userAnswer,
            gradingScope: "函数定义域。只判断定义域答案是否等价，不引入超纲知识。"
          })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek 判题请求失败：${response.status}`);
  }

  const payload = (await response.json()) as DeepSeekResponse;
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek 判题没有返回内容。");
  }

  return JSON.parse(content) as EquivalenceResult;
}
