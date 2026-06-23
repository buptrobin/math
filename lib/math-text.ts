export type MathTextSegment = { type: "text" | "math"; value: string };

export function parseMathText(value: string): MathTextSegment[] {
  const segments: MathTextSegment[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    const start = value.indexOf("$", cursor);
    if (start === -1) {
      segments.push({ type: "text", value: value.slice(cursor) });
      break;
    }

    const end = value.indexOf("$", start + 1);
    if (end === -1) {
      segments.push({ type: "text", value: value.slice(cursor) });
      break;
    }

    if (start > cursor) {
      segments.push({ type: "text", value: value.slice(cursor, start) });
    }
    segments.push({ type: "math", value: value.slice(start + 1, end) });
    cursor = end + 1;
  }

  return segments.filter((segment) => segment.value.length > 0);
}
