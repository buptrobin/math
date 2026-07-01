const replacements: Array<[RegExp, string]> = [
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

export function formatMathText(value: string): string {
  return replacements
    .reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
    .replace(/([≥≤≠])\s+/g, "$1")
    .trim();
}
