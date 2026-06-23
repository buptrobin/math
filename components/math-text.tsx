import katex from "katex";
import { parseMathText } from "@/lib/math-text";

export function MathText({ children }: { children: string }) {
  return (
    <>
      {parseMathText(children).map((segment, index) => {
        if (segment.type === "text") {
          return <span key={index}>{segment.value}</span>;
        }

        return (
          <span
            key={index}
            className="mathInline"
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(segment.value, {
                throwOnError: false,
                strict: false
              })
            }}
          />
        );
      })}
    </>
  );
}
