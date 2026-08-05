
// ── 공통 색 팔레트 ───────────────────────────────────
export const C = {
  bg: "#0E1113", panel: "#171C1F", hub: "#1F2529", ring: "#252C31",
  text: "#F2EEE6", muted: "#9AA5AB", dim: "#6E7A80",
  brass: "#E0A54B", teal: "#5DCAA5", rose: "#D07A6E",
  tealBg: "#123027", tealText: "#7FD8B6",
  roseBg: "#33201C", roseText: "#E0937F",
  neck: "#1E1710", fretwire: "#4C545A", string: "#C9CDCF", mute: "#D07A6E",
};
export const QCOLOR = { maj: C.brass, min: C.teal, dim: C.rose };
export const QLABEL = { maj: "메이저", min: "마이너", dim: "디미니쉬" };

// ══════════════════════════════════════════════════════
//  디자인 척도 (Phase 3) — 새 화면을 만들 때 여기 값만 쓴다
//
//  왜 필요한가: 예전에는 글자 크기가 14종, 여백 조합이 33가지로 흩어져 있었다.
//  "여긴 12.5, 저긴 13" 같은 차이에 이유가 없으면 화면이 미묘하게 어수선해진다.
//  값을 몇 단계로 묶어 두면 고민 없이 고르게 되고, 화면끼리 저절로 맞는다.
//
//  tests/design-tokens.test.js 가 이 척도를 벗어난 값이 생기면 잡아 준다.
// ══════════════════════════════════════════════════════

/** 글자 크기 5단계 */
export const FS = {
  label: 11,   // 모노 캡션, 작은 안내 (이보다 작게 쓰지 말 것 — 접근성)
  small: 13,   // 보조 설명, 칩 글자
  body: 15,    // 본문, 버튼
  strong: 19,  // 코드 이름, 강조 숫자
  title: 30,   // 화면 제목, 큰 숫자
};
/** 다이얼 가운데 키 글자 — 척도 밖의 유일한 예외(디스플레이용) */
export const FS_DISPLAY = 46;

/** 여백 5단계 (모두 4의 배수) */
export const SP = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};
/** 실선 두께·머리카락 여백용. 이 둘만 4의 배수를 벗어나도 된다. */
export const SP_HAIR = 2;

// ── 색 위계 원칙 (Phase 3) ────────────────────────────
//  brass(금색) = "지금 선택된 것" 과 "루트음" 에만 쓴다.
//  누르면 뭔가 하는 버튼(듣기·보기·잼 시작)은 아래 ACTION 을 쓴다.
//  → 화면에 금색이 보이면 "저게 선택돼 있구나"가 즉시 읽힌다.
export const ACTION = { background: C.hub, color: C.text, border: `1px solid ${C.ring}` };
/** 선택·활성 상태의 버튼 */
export const ACTION_ON = { background: C.brass, color: C.bg, border: `1px solid ${C.brass}` };

export const SEG = { display: "flex", background: C.hub, borderRadius: 999, padding: 4, gap: 4, flexWrap: "wrap" };
export const SEGLABEL = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: FS.label, letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase" };
// 공용 잼 패널 (디코더·스케일 양쪽에서 사용). showKey=true면 키 선택기 표시.
export const _row = { display: "flex", alignItems: "center", gap: SP.sm, marginTop: SP.md, flexWrap: "wrap" };
