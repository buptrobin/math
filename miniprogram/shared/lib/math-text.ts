const replacements: Array<[RegExp, string]> = [
  [/\$/g, ""],
  [/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "$1/($2)"],
  [/\\sqrt\{([^{}]+)\}/g, "√($1)"],
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
