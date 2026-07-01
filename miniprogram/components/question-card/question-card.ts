import { formatMathText } from "../../shared/lib/math-text";

Component({
  properties: {
    question: { type: Object, value: null },
    result: { type: Object, value: null }
  },
  data: {
    answer: "",
    selectedChoiceLabel: "",
    visibleHints: [] as string[],
    displayQuestionText: ""
  },
  observers: {
    question(this: any, question: { questionText: string } | null) {
      this.setData({
        answer: "",
        selectedChoiceLabel: "",
        visibleHints: [],
        displayQuestionText: question ? formatMathText(question.questionText) : ""
      });
    }
  },
  methods: {
    selectOption(this: any, event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index ?? 0);
      this.setData({
        answer: String(event.currentTarget.dataset.answer ?? ""),
        selectedChoiceLabel: String.fromCharCode(65 + index)
      });
    },
    onInput(this: any, event: WechatMiniprogram.Input) {
      this.setData({ answer: event.detail.value, selectedChoiceLabel: "" });
    },
    showHint(this: any) {
      const question = this.properties.question as { hints?: string[] } | null;
      const hints = question?.hints ?? [];
      const next = hints.slice(0, this.data.visibleHints.length + 1);
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
