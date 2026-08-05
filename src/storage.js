// ══════════════════════════════════════════════════════
//  저장 계층 — 앱의 설정을 폰/브라우저에 기억시키는 곳
//
//  ▸ 다른 파일에서 localStorage를 직접 부르지 말 것.
//    나중에 클라우드 저장(Supabase 등)으로 바꿀 때 이 파일만 갈아끼우면 되게 하려는 것이다.
//  ▸ 저장이 막혀 있는 환경(사파리 시크릿 모드 등)에서도 앱이 죽지 않아야 하므로
//    모든 접근을 try-catch로 감쌌다. 저장이 안 되면 그냥 "기억을 못 할 뿐" 정상 동작한다.
// ══════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";

const KEY = "guitarism";
const VERSION = 1; // 저장 형식이 크게 바뀌면 이 숫자를 올린다 → 옛 데이터는 무시된다

let cache = null;
let flushTimer = null;

function load() {
  if (cache) return cache;
  cache = {};
  try {
    const raw = globalThis.localStorage && localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.v === VERSION && parsed.d && typeof parsed.d === "object") {
        cache = parsed.d;
      }
    }
  } catch (e) {
    // 저장된 값이 깨졌거나 저장소를 못 읽는 상황 — 기본값으로 시작한다
    console.warn("[Guitarism] 저장된 설정을 읽지 못해 기본값으로 시작합니다.", e);
    cache = {};
  }
  return cache;
}

function flush() {
  flushTimer = null;
  try {
    if (globalThis.localStorage) {
      localStorage.setItem(KEY, JSON.stringify({ v: VERSION, d: cache }));
    }
  } catch (e) {
    // 용량 초과·저장 차단 등 — 조용히 넘어간다
  }
}

/** 저장된 값 읽기. 없으면 fallback */
export function get(name, fallback) {
  const d = load();
  return Object.prototype.hasOwnProperty.call(d, name) ? d[name] : fallback;
}

/** 값 저장. BPM 슬라이더처럼 연달아 바뀌는 값이 있어 조금 모아서 쓴다(120ms) */
export function set(name, value) {
  const d = load();
  if (d[name] === value) return;
  d[name] = value;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 120);
}

/** 저장된 설정을 전부 지운다 (에러 화면의 "설정까지 초기화"용) */
export function clearAll() {
  cache = {};
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  try {
    if (globalThis.localStorage) localStorage.removeItem(KEY);
  } catch (e) {}
}

/** 테스트용: 다음 읽기 때 저장소에서 다시 읽게 한다 */
export function _resetCache() {
  cache = null;
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
}

// ── 화면에서 쓰는 부분 ────────────────────────────────
// useState와 똑같이 쓰되, 값이 바뀔 때마다 알아서 저장되고 앱을 다시 켜면 복원된다.
//   const [root, setRoot] = useStored("chord.root", 0, intIn(0, 11));
export function useStored(name, initial, coerce) {
  const [value, setValue] = useState(() => {
    const raw = get(name, undefined);
    if (raw === undefined) return initial;
    const ok = coerce ? coerce(raw) : raw;
    return ok === undefined ? initial : ok;
  });
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; } // 켜자마자 똑같은 값을 다시 쓰지 않도록
    set(name, value);
  }, [name, value]);
  return [value, setValue];
}

// ── 저장된 값 검사기 ──────────────────────────────────
// 저장 이후 목록이 줄어들면(예: 스케일 13종 → 10종) 옛 번호가 범위를 벗어난다.
// 그런 값은 버리고 기본값으로 돌아가게 한다.
export const intIn = (min, max) => (v) =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : undefined;

export const intInOrNull = (min, max) => (v) =>
  v === null ? null : intIn(min, max)(v);

export const oneOf = (list) => (v) => (list.includes(v) ? v : undefined);
