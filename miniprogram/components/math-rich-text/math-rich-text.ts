import { renderMathSegments } from "../../shared/lib/math-render";

Component({
  properties: {
    content: { type: String, value: "" }
  },
  data: {
    segments: [] as unknown[]
  },
  observers: {
    content(this: any, content: string) {
      this.setData({ segments: renderMathSegments(content || "") });
    }
  }
});
