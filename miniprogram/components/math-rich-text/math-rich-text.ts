import { renderMathNodes } from "../../shared/lib/math-render";

Component({
  properties: {
    content: { type: String, value: "" }
  },
  data: {
    nodes: [] as unknown[]
  },
  observers: {
    content(this: any, content: string) {
      this.setData({ nodes: renderMathNodes(content || "") });
    }
  }
});
