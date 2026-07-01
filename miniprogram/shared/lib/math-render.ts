import parseLatex, { renderMathInText } from "@rojer/katex-mini";
import { formatMathText } from "./math-text";

const delimiters = [
  { left: "$$", right: "$$", display: true },
  { left: "$", right: "$", display: false }
];

export function renderMathNodes(content: string) {
  try {
    return renderMathInText(content, {
      delimiters
    });
  } catch {
    return [{ type: "text", text: content }];
  }
}

export type MathSegment =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "math";
      block: boolean;
      nodes: unknown[];
    };

export function renderMathSegments(content: string): MathSegment[] {
  const segments: MathSegment[] = [];
  const pattern = /(\$\$[^$]+\$\$|\$[^$]+\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", text: content.slice(lastIndex, match.index) });
    }

    const raw = match[0];
    const isDisplay = raw.startsWith("$$");
    const latex = raw.slice(isDisplay ? 2 : 1, isDisplay ? -2 : -1);
    const block = isDisplay || isComplexFormula(latex);
    segments.push({
      type: "math",
      block,
      nodes: renderLatexNodes(latex, block)
    });
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", text: content.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: "text", text: content }];
}

function renderLatexNodes(latex: string, displayMode: boolean) {
  if (latex.includes("\\sqrt")) {
    return [{ type: "text", text: formatMathText(`$${latex}$`) }];
  }

  try {
    return parseLatex(latex, { displayMode, throwError: false });
  } catch {
    return [{ type: "text", text: latex }];
  }
}

function isComplexFormula(latex: string) {
  return latex.includes("\\frac") || latex.length > 24;
}
