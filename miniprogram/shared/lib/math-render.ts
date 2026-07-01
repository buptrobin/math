import { renderMathInText } from "@rojer/katex-mini";

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
