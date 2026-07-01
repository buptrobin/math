const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const questions = [
  {
    id: "q-diagnostic-3",
    questionText: "$y=\\frac{\\sqrt{x-1}}{x-3}$ 的定义域是什么？",
    correctAnswer: "[1,3)∪(3,+∞)",
    acceptedAnswers: ["[1,3)∪(3,+∞)", "[1,3)U(3,+∞)", "x≥1且x≠3", "x >= 1 且 x != 3", "x≥1，x≠3"]
  },
  {
    id: "q-example-1",
    questionText: "母题拆解：求 $y=\\frac{\\sqrt{x-1}}{x-3}$ 的定义域。",
    correctAnswer: "[1,3)∪(3,+∞)",
    acceptedAnswers: ["[1,3)∪(3,+∞)", "x≥1且x≠3"]
  }
];

exports.main = async (event) => {
  try {
    if (!event || typeof event.mode !== "string") {
      return { ok: false, error: "请求参数无效。" };
    }

    if (event.mode === "grade") {
      return await grade(event);
    }

    if (event.mode === "feynman") {
      return await feynman(event);
    }

    return { ok: false, error: "不支持的 AI 模式。" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "AI 请求失败。" };
  }
};

async function grade(event) {
  if (typeof event.questionId !== "string" || typeof event.userAnswer !== "string") {
    return { ok: false, error: "判题参数无效。" };
  }

  const question = questions.find((item) => item.id === event.questionId);
  if (!question) {
    return { ok: false, error: "未找到题目。" };
  }

  const result = await callDeepSeek([
    {
      role: "system",
      content:
        "你是高中数学函数定义域填空题判题器。只判断学生答案表示的自变量取值集合是否与标准答案相同。只输出 JSON：{\"is_equivalent\": boolean, \"reason\": string}。"
    },
    {
      role: "user",
      content: JSON.stringify({
        question: question.questionText,
        correctAnswer: question.correctAnswer,
        acceptedAnswers: question.acceptedAnswers,
        studentAnswer: event.userAnswer
      })
    }
  ]);

  return {
    ok: true,
    mode: "grade",
    isEquivalent: result.is_equivalent === true,
    reason: typeof result.reason === "string" ? result.reason : ""
  };
}

async function feynman(event) {
  if (typeof event.prompt !== "string" || typeof event.userText !== "string" || event.userText.trim().length === 0) {
    return { ok: false, error: "费曼输出参数无效。" };
  }

  const result = await callDeepSeek([
    {
      role: "system",
      content:
        "你是高中数学函数定义域学习教练。根据学生解释给出 40 到 100 的整数分数和一句简短反馈。只输出 JSON：{\"score\": number, \"aiFeedback\": string}。"
    },
    {
      role: "user",
      content: JSON.stringify({ prompt: event.prompt, studentText: event.userText })
    }
  ]);

  return {
    ok: true,
    mode: "feynman",
    score: Number.isFinite(result.score) ? Math.max(40, Math.min(100, Math.round(result.score))) : 60,
    aiFeedback: typeof result.aiFeedback === "string" ? result.aiFeedback : "请补充定义域与限制条件之间的关系。"
  };
}

async function callDeepSeek(messages) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("AI 未配置。");
  }

  const endpoint = process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com/chat/completions";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, response_format: { type: "json_object" }, temperature: 0, stream: false, messages })
  });

  if (!response.ok) {
    throw new Error(`AI 请求失败：${response.status}`);
  }

  const payload = await response.json();
  const content = payload && payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
  if (!content) {
    throw new Error("AI 没有返回内容。");
  }
  return JSON.parse(content);
}
