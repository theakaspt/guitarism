// 이관 전후 "최상위 선언 전수 대조표"를 만드는 도구.
//   node tools/inventory.mjs        → 표를 화면에 출력
//   tests/migration-inventory.test.js 에서 같은 함수를 불러 자동 검사
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEGACY = path.join(ROOT, "docs/legacy/guitar-theory-app.v45.jsx");
const SRC = path.join(ROOT, "src");

// 이관(v45) 이후 새로 생긴 선언. 여기 적힌 것 말고는 모르는 사이에 늘어나면 안 된다.
export const ADDED_IN_MIGRATION = [
  // ── Phase 0 (이관) ──
  // Scales 컴포넌트 안 클로저를 순수 함수로 옮긴 것 (값·수식 동일, 전수 대조로 확인)
  "scaleIvSet", "inScale", "cagedPositions", "build3nps", "diagFrom",
  // PWA 새 버전 알림 (원본에는 없던 화면)
  "UpdateToast",

  // ── Phase 1 (안정성·신뢰성) ──
  // 설정 저장 계층 (src/storage.js)
  "KEY", "VERSION", "cache", "flushTimer", "load", "flush",
  "get", "set", "clearAll", "_resetCache", "useStored",
  "intIn", "intInOrNull", "oneOf",
  // 에러 화면
  "ErrorBoundary", "TAB_LABEL",
  // 잼 스케줄러 견고화 · iOS 오디오
  "LOOKAHEAD_VISIBLE", "LOOKAHEAD_HIDDEN", "TONES", "ensureAudio",

  // ── Phase 2 (UI/UX) ──
  // 잼 재생 시각 피드백 + 보이싱 보기
  "JamVoicing", "voiceProgressionFull",
  // 첫 실행 코치마크
  "CoachMarks", "FLAG",
];

// 줄 맨 앞의 export / export default / async 를 걷어내고 순수한 선언만 남긴다
const strip = (line) =>
  line.replace(/^export\s+default\s+/, "").replace(/^export\s+/, "").replace(/^async\s+/, "");
const DECL = /^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/;

function namesIn(src) {
  const out = [];
  for (const raw of src.split("\n")) {
    const line = strip(raw);
    const m = line.match(DECL);
    if (!m) continue;
    out.push(m[1]);
    // 한 줄에 여러 개 선언한 경우 (예: const N = ..., STEP = ...;)
    const multi = line.match(/^(?:const|let|var)\s+(.+)$/);
    if (multi) {
      for (const part of multi[1].split(/,(?![^[\]{}()]*[\]})])/).slice(1)) {
        const mm = part.trim().match(/^([A-Za-z_$][\w$]*)\s*=/);
        if (mm) out.push(mm[1]);
      }
    }
  }
  return out;
}

export function legacyNames() {
  return namesIn(fs.readFileSync(LEGACY, "utf8"));
}

export function srcFiles() {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|jsx)$/.test(e.name)) out.push(p);
    }
  };
  walk(SRC);
  return out.sort();
}

export function srcNames() {
  const set = new Set();
  for (const f of srcFiles()) for (const n of namesIn(fs.readFileSync(f, "utf8"))) set.add(n);
  return set;
}

export function whereIs() {
  const map = new Map();
  for (const f of srcFiles()) {
    for (const n of namesIn(fs.readFileSync(f, "utf8"))) {
      map.set(n, path.relative(ROOT, f));
    }
  }
  return map;
}

if (process.argv[1] && process.argv[1].endsWith("inventory.mjs")) {
  const before = legacyNames();
  const where = whereIs();
  const after = srcNames();
  console.log("| # | 이관 전 선언 | 이관 후 위치 |");
  console.log("|---|---|---|");
  before.forEach((n, i) => console.log(`| ${i + 1} | \`${n}\` | ${where.get(n) || "**❌ 사라짐**"} |`));
  const missing = before.filter((n) => !after.has(n));
  const added = [...after].filter((n) => !before.includes(n)).sort();
  console.log(`\n이관 전 선언 ${before.length}개 · 누락 ${missing.length}개 · 새로 추가 ${added.length}개 (${added.join(", ")})`);
  process.exit(missing.length ? 1 : 0);
}
