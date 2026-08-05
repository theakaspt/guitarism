
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

export const SEG = { display: "flex", background: C.hub, borderRadius: 999, padding: 3, gap: 3, flexWrap: "wrap" };
export const SEGLABEL = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 11.5, letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase" };
// 공용 잼 패널 (디코더·스케일 양쪽에서 사용). showKey=true면 키 선택기 표시.
export const _row = { display: "flex", alignItems: "center", gap: 8, marginTop: 11, flexWrap: "wrap" };
