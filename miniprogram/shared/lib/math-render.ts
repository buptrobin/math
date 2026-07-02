import parseLatex, { renderMathInText } from "@rojer/katex-mini";

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
  const pattern = /(\$\$[^$]+\$\$|\$[^$]+\$)/g;
  const matches = Array.from(content.matchAll(pattern));
  if (!matches.length) {
    return [{ type: "text", text: content }];
  }

  if (!matches.some((match) => shouldDisplayFormula(match[0]))) {
    return [{ type: "math", block: false, nodes: renderMathNodes(content) }];
  }

  const segments: MathSegment[] = [];
  let inlineRun = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      inlineRun += content.slice(lastIndex, match.index);
    }

    const raw = match[0];
    const isDisplay = raw.startsWith("$$");
    const latex = raw.slice(isDisplay ? 2 : 1, isDisplay ? -2 : -1);
    if (shouldDisplayFormula(raw)) {
      pushInlineRun(segments, inlineRun);
      inlineRun = "";
      segments.push({
        type: "math",
        block: true,
        nodes: renderLatexNodes(latex, true)
      });
    } else {
      inlineRun += raw;
    }
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < content.length) {
    inlineRun += content.slice(lastIndex);
  }
  pushInlineRun(segments, inlineRun);

  return segments.length ? segments : [{ type: "text", text: content }];
}

function pushInlineRun(segments: MathSegment[], content: string) {
  if (!content) {
    return;
  }
  segments.push({ type: "math", block: false, nodes: renderMathNodes(content) });
}

function renderLatexNodes(latex: string, displayMode: boolean) {
  try {
    return parseLatex(latex, { displayMode, throwError: false });
  } catch {
    return [{ type: "text", text: latex }];
  }
}

function isComplexFormula(latex: string) {
  return latex.includes("\\frac") || latex.includes("\\sqrt") || latex.length > 24;
}

function shouldDisplayFormula(raw: string) {
  const isDisplay = raw.startsWith("$$");
  const latex = raw.slice(isDisplay ? 2 : 1, isDisplay ? -2 : -1);
  return isDisplay || isComplexFormula(latex);
}
