"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeAnswer = normalizeAnswer;
exports.gradeAnswer = gradeAnswer;
const replacements = [
    [/\s+/g, ""],
    [/U/g, "∪"],
    [/，/g, ","],
    [/\$/g, ""],
    [/\\geq?/g, ">="],
    [/\\leq?/g, "<="],
    [/\\ne(q)?/g, "!="],
    [/<>/g, "!="],
    [/！=/g, "!="],
    [/≠/g, "!="],
    [/≥/g, ">="],
    [/≤/g, "<="],
    [/[ＸX]/g, "x"],
    [/＋/g, "+"],
    [/－/g, "-"]
];
function normalizeAnswer(value) {
    const compact = replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value.trim());
    const normalized = compact.replace(/>=/g, "≥").replace(/<=/g, "≤").replace(/!=/g, "≠");
    return normalizeConjunction(normalized);
}
function normalizeConjunction(value) {
    if (!value.includes("且")) {
        return value;
    }
    return value
        .split("且")
        .filter(Boolean)
        .sort(compareConjunctionPart)
        .join("且");
}
function compareConjunctionPart(left, right) {
    const leftRank = conjunctionPartRank(left);
    const rightRank = conjunctionPartRank(right);
    if (leftRank !== rightRank) {
        return leftRank - rightRank;
    }
    return left.localeCompare(right);
}
function conjunctionPartRank(value) {
    if (value.includes("≥") || value.includes(">") || value.includes("≤") || value.includes("<")) {
        return 0;
    }
    if (value.includes("≠")) {
        return 1;
    }
    return 2;
}
function gradeAnswer(question, userAnswer) {
    const normalizedUserAnswer = normalizeAnswer(userAnswer);
    const accepted = [question.correctAnswer, ...(question.acceptedAnswers ?? [])].map(normalizeAnswer);
    return {
        isCorrect: accepted.includes(normalizedUserAnswer),
        normalizedUserAnswer
    };
}
