export function evaluateFeynmanOutput(userText: string) {
  const trimmed = userText.trim();
  const score = trimmed.length >= 30 ? 80 : trimmed.length >= 12 ? 60 : 40;
  const aiFeedback =
    score >= 80
      ? "你已经能用自己的话解释了。下一步要注意遇到题目时先找限制条件。"
      : score >= 60
        ? "表达有一些关键点，但还可以更完整：请说清楚 x 代入后为什么要让式子有意义。"
        : "这次说得太短。请至少说出：定义域是 x 的取值范围，以及为什么要检查分母或根号。";

  return { score, aiFeedback };
}
