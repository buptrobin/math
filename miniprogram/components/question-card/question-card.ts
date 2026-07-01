import { formatMathText } from "../../shared/lib/math-text";

Component({
  properties: {
    question: { type: Object, value: null },
    result: { type: Object, value: null }
  },
  data: {
    answer: "",
    selectedChoiceLabel: "",
    displayOptions: [] as Array<{ label: string; value: string; text: string }>,
    visibleHints: [] as string[],
    displayQuestionText: ""
  },
  observers: {
    question(this: any, question: { questionText: string; options?: string[] } | null) {
      const displayOptions =
        question?.options?.map((option, index) => ({
          label: String.fromCharCode(65 + index),
          value: option,
          text: formatMathText(option)
        })) ?? [];
      this.setData({
        answer: "",
        selectedChoiceLabel: "",
        displayOptions,
        visibleHints: [],
        displayQuestionText: question ? formatMathText(question.questionText) : ""
      });
    }
  },
  methods: {
    selectOption(this: any, event: WechatMiniprogram.TouchEvent) {
      this.setData({
        answer: String(event.currentTarget.dataset.answer ?? ""),
        selectedChoiceLabel: String(event.currentTarget.dataset.label ?? "")
      });
    },
    onInput(this: any, event: WechatMiniprogram.Input) {
      this.setData({ answer: event.detail.value, selectedChoiceLabel: "" });
    },
    showHint(this: any) {
      const question = this.properties.question as { hints?: string[] } | null;
      const hints = question?.hints ?? [];
      const next = hints.slice(0, this.data.visibleHints.length + 1).map(formatMathText);
      this.setData({ visibleHints: next });
    },
    submit(this: any) {
      const question = this.properties.question as { id: string } | null;
      const userAnswer = this.data.selectedChoiceLabel || this.data.answer;
      if (!question || !userAnswer.trim()) {
        return;
      }
      this.triggerEvent("submit", {
        questionId: question.id,
        userAnswer,
        hintsUsed: this.data.visibleHints.length
      });
    }
  }
});
