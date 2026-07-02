"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMathText = formatMathText;
const replacements = [
    [/\$/g, ""],
    [/\\sqrt\{([^{}]+)\}/g, "√($1)"],
    [/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "$1/($2)"],
    [/\\geq?/g, "≥"],
    [/\\leq?/g, "≤"],
    [/\\ne(q)?/g, "≠"],
    [/\\cup/g, "∪"],
    [/\\infty/g, "∞"],
    [/\s+/g, " "]
];
function formatMathText(value) {
    return replacements
        .reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
        .replace(/([≥≤≠])\s+/g, "$1")
        .trim();
}
