"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMathNodes = renderMathNodes;
exports.renderMathSegments = renderMathSegments;
const katex_mini_1 = __importStar(require("@rojer/katex-mini"));
const delimiters = [
    { left: "$$", right: "$$", display: true },
    { left: "$", right: "$", display: false }
];
function renderMathNodes(content) {
    try {
        return (0, katex_mini_1.renderMathInText)(content, {
            delimiters
        });
    }
    catch {
        return [{ type: "text", text: content }];
    }
}
function renderMathSegments(content) {
    const pattern = /(\$\$[^$]+\$\$|\$[^$]+\$)/g;
    const matches = Array.from(content.matchAll(pattern));
    if (!matches.length) {
        return [{ type: "text", text: content }];
    }
    if (!matches.some((match) => shouldDisplayFormula(match[0]))) {
        return [{ type: "math", block: false, nodes: renderMathNodes(content) }];
    }
    const segments = [];
    let inlineRun = "";
    let lastIndex = 0;
    let match;
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
        }
        else {
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
function pushInlineRun(segments, content) {
    if (!content) {
        return;
    }
    segments.push({ type: "math", block: false, nodes: renderMathNodes(content) });
}
function renderLatexNodes(latex, displayMode) {
    try {
        return (0, katex_mini_1.default)(latex, { displayMode, throwError: false });
    }
    catch {
        return [{ type: "text", text: latex }];
    }
}
function isComplexFormula(latex) {
    return latex.includes("\\frac") || latex.includes("\\sqrt") || latex.length > 24;
}
function shouldDisplayFormula(raw) {
    const isDisplay = raw.startsWith("$$");
    const latex = raw.slice(isDisplay ? 2 : 1, isDisplay ? -2 : -1);
    return isDisplay || isComplexFormula(latex);
}
