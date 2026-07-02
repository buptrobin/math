"use strict";
Component({
    properties: {
        question: { type: Object, value: null },
        result: { type: Object, value: null }
    },
    data: {
        answer: "",
        selectedChoiceLabel: "",
        displayOptions: [],
        visibleHints: []
    },
    observers: {
        question(question) {
            const displayOptions = question?.options?.map((option, index) => ({
                label: String.fromCharCode(65 + index),
                value: option
            })) ?? [];
            this.setData({
                answer: "",
                selectedChoiceLabel: "",
                displayOptions,
                visibleHints: []
            });
        }
    },
    methods: {
        selectOption(event) {
            this.setData({
                answer: String(event.currentTarget.dataset.answer ?? ""),
                selectedChoiceLabel: String(event.currentTarget.dataset.label ?? "")
            });
        },
        onInput(event) {
            this.setData({ answer: event.detail.value, selectedChoiceLabel: "" });
        },
        showHint() {
            const question = this.properties.question;
            const hints = question?.hints ?? [];
            const next = hints.slice(0, this.data.visibleHints.length + 1);
            this.setData({ visibleHints: next });
        },
        submit() {
            const question = this.properties.question;
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
