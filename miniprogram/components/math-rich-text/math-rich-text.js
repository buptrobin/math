"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const math_render_1 = require("../../shared/lib/math-render");
Component({
    properties: {
        content: { type: String, value: "" }
    },
    data: {
        segments: []
    },
    observers: {
        content(content) {
            this.setData({ segments: (0, math_render_1.renderMathSegments)(content || "") });
        }
    }
});
