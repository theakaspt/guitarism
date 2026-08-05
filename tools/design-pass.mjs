// Phase 3 디자인 패스 — 흩어진 글자 크기·간격 값을 척도에 맞춰 정리한다.
// 한 번 돌리면 끝나는 도구지만, 나중에 값이 다시 흐트러졌을 때 재실행할 수 있게 남겨 둔다.
//   node tools/design-pass.mjs          → 무엇이 바뀔지만 보여 준다
//   node tools/design-pass.mjs --write  → 실제로 고친다
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WRITE = process.argv.includes("--write");

// ── 척도 (src/theme.js 의 FS · SP 와 같은 값) ──────────
export const FONT_SCALE = [11, 13, 15, 19, 30];
export const DISPLAY_FONT = 46;   // 다이얼 가운데 키 — 유일한 예외
export const SPACE_STEP = 4;

const toFont = (v) => {
  if (v >= 40) return v;          // 디스플레이는 건드리지 않는다
  if (v >= 24) return 30;
  if (v >= 16) return 19;
  if (v >= 14) return 15;
  if (v >= 12) return 13;
  return 11;
};
// 4의 배수. 0~2는 실선 두께·미세 여백이라 그대로 둔다.
const toSpace = (v) => (v <= 2 ? v : Math.max(4, Math.round(v / SPACE_STEP) * SPACE_STEP));

const files = [];
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(e.name)) files.push(p);
  });
walk(path.join(ROOT, "src"));

let fontN = 0, spaceN = 0;
for (const f of files) {
  const before = fs.readFileSync(f, "utf8");
  let s = before;

  s = s.replace(/fontSize: ([0-9.]+)/g, (m, v) => {
    const n = toFont(parseFloat(v)); if (n !== parseFloat(v)) fontN++; return `fontSize: ${n}`;
  });
  s = s.replace(/fontSize=\{([0-9.]+)\}/g, (m, v) => {
    const n = toFont(parseFloat(v)); if (n !== parseFloat(v)) fontN++; return `fontSize={${n}}`;
  });
  // VWheel/WheelPicker 의 size 는 글자 크기다
  s = s.replace(/size=\{([0-9.]+)\}/g, (m, v) => {
    const n = toFont(parseFloat(v)); if (n !== parseFloat(v)) fontN++; return `size={${n}}`;
  });

  s = s.replace(/\b(gap|marginTop|marginBottom|marginLeft|marginRight|rowGap|columnGap): ([0-9]+)\b/g,
    (m, k, v) => { const n = toSpace(+v); if (n !== +v) spaceN++; return `${k}: ${n}`; });
  s = s.replace(/padding: "([^"]+)"/g, (m, val) => {
    const out = val.split(/\s+/).map((tok) => {
      const mm = tok.match(/^([0-9]+)px$/);
      if (!mm) return tok;
      const n = toSpace(+mm[1]); if (n !== +mm[1]) spaceN++;
      return n + "px";
    }).join(" ");
    return `padding: "${out}"`;
  });
  s = s.replace(/padding: ([0-9]+)\b/g, (m, v) => {
    const n = toSpace(+v); if (n !== +v) spaceN++; return `padding: ${n}`;
  });

  if (s !== before) {
    if (WRITE) fs.writeFileSync(f, s);
    console.log(`${WRITE ? "고침" : "고칠 것"}: ${path.relative(ROOT, f)}`);
  }
}
console.log(`글자 크기 ${fontN}곳 · 간격 ${spaceN}곳${WRITE ? " 정리 완료" : " (미리보기 — --write 를 붙이면 실제로 고칩니다)"}`);
