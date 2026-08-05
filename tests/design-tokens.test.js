// 디자인 척도 지키기 (작업지시서 Phase 3)
// 값이 다시 흩어지지 않도록 소스를 정적으로 훑는다.
// 여기서 걸리면 src/theme.js 의 FS · SP 중에서 고르거나, 정말 필요하면 척도부터 논의할 것.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { FS, FS_DISPLAY, SP, SP_HAIR } from "../src/theme.js";

const SRC = path.resolve("src");
const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(e.name)) files.push(p);
  }
};
walk(SRC);
const read = (f) => ({ rel: path.relative(SRC, f), src: fs.readFileSync(f, "utf8") });
const all = files.map(read);

const FONT_OK = new Set([...Object.values(FS), FS_DISPLAY]);
const SPACE_OK = (n) => n === 0 || n === 1 || n === SP_HAIR || n % 4 === 0;

describe("글자 크기 척도", () => {
  it("척도(11·13·15·19·30, 다이얼 46)에 없는 크기를 쓰지 않는다", () => {
    const bad = [];
    for (const { rel, src } of all) {
      src.split("\n").forEach((line, i) => {
        for (const m of line.matchAll(/fontSize[:=]\s*\{?([0-9.]+)/g)) {
          const n = parseFloat(m[1]);
          if (!FONT_OK.has(n)) bad.push(`${rel}:${i + 1} → ${n}px`);
        }
        for (const m of line.matchAll(/\bsize=\{([0-9.]+)\}/g)) {
          const n = parseFloat(m[1]);
          if (!FONT_OK.has(n)) bad.push(`${rel}:${i + 1} → 휠 글자 ${n}px`);
        }
      });
    }
    expect(bad, `척도 밖 글자 크기:\n${bad.join("\n")}`).toEqual([]);
  });

  it("척도가 5단계 그대로다 (마음대로 늘리지 않았는지)", () => {
    expect(Object.values(FS)).toEqual([11, 13, 15, 19, 30]);
    // 가장 작은 값이 11 미만으로 내려가면 접근성 검사와 충돌한다
    expect(Math.min(...Object.values(FS))).toBeGreaterThanOrEqual(11);
  });
});

describe("여백 척도", () => {
  it("gap·margin 이 4의 배수다", () => {
    const bad = [];
    for (const { rel, src } of all) {
      src.split("\n").forEach((line, i) => {
        for (const m of line.matchAll(/\b(gap|marginTop|marginBottom|marginLeft|marginRight|rowGap|columnGap):\s*([0-9]+)\b/g)) {
          const n = parseInt(m[2]);
          if (!SPACE_OK(n)) bad.push(`${rel}:${i + 1} → ${m[1]} ${n}px`);
        }
      });
    }
    expect(bad, `4의 배수가 아닌 여백:\n${bad.join("\n")}`).toEqual([]);
  });

  it("padding 이 4의 배수다", () => {
    const bad = [];
    for (const { rel, src } of all) {
      src.split("\n").forEach((line, i) => {
        for (const m of line.matchAll(/padding:\s*"([^"]+)"/g)) {
          for (const tok of m[1].split(/\s+/)) {
            const mm = tok.match(/^([0-9]+)px$/);
            if (mm && !SPACE_OK(parseInt(mm[1]))) bad.push(`${rel}:${i + 1} → padding ${mm[1]}px`);
          }
        }
        for (const m of line.matchAll(/padding:\s*([0-9]+)\b/g)) {
          const n = parseInt(m[1]);
          if (!SPACE_OK(n)) bad.push(`${rel}:${i + 1} → padding ${n}px`);
        }
      });
    }
    expect(bad, `4의 배수가 아닌 padding:\n${bad.join("\n")}`).toEqual([]);
  });
});

describe("색 위계 — 금색은 선택된 것에만", () => {
  it("동작 버튼(듣기·보기)이 금색 테두리를 쓰지 않는다", () => {
    // 예전 패턴: background transparent + color brass + border brass  = 동작인데 선택처럼 보임
    const bad = [];
    for (const { rel, src } of all) {
      if (rel.startsWith("components/CoachMarks") || rel.startsWith("UpdateToast")) continue; // 1회성 안내는 예외
      src.split("\n").forEach((line, i) => {
        if (/background:\s*"transparent"/.test(line) &&
            /color:\s*C\.brass/.test(line) &&
            /border:\s*`1px solid \$\{C\.brass\}`/.test(line)) {
          bad.push(`${rel}:${i + 1}`);
        }
      });
    }
    expect(bad, `동작 버튼에 금색 테두리가 남아 있음:\n${bad.join("\n")}`).toEqual([]);
  });

  it("theme.js 에 동작 버튼 표준이 정의돼 있다", async () => {
    const { ACTION, ACTION_ON, C } = await import("../src/theme.js");
    expect(ACTION.background).toBe(C.hub);
    expect(ACTION.color).toBe(C.text);
    expect(ACTION_ON.background).toBe(C.brass); // 선택·활성일 때만 금색
  });
});
