import React from "react";
import { C } from "../theme.js";
import { OPEN_MIDI, FORMULA, noteName } from "../theory/notes.js";

// 잼이 지금 치고 있는 드롭2 보이싱을 작은 지판에 그린다.
// 가이드톤(3음·7음)은 코드 성격을 결정하는 두 음이라 눈에 띄게 칠한다 — 이게 이 화면의 목적이다.
//
// voicing: { midis, frets, set }  ← theory/jam.js 의 compCandidates 결과 (set = 쓰는 줄 번호들)
// rootPC, type: 코드 뿌리음과 종류 (도수 계산용)
export default function JamVoicing({ voicing, rootPC, type, keyPC }) {
  if (!voicing || !voicing.set || !voicing.frets) return null;

  const W = 250, ROWS = 5, H = 176;
  const padL = 30, padR = 18, padTop = 30, padBot = 14;
  const xOf = (i) => padL + i * ((W - padL - padR) / 5);
  const nutY = padTop, gap = (H - padBot - nutY) / ROWS;

  // 이 보이싱이 쓰는 프렛 범위 → 5칸 창을 잡는다
  const frets = voicing.frets;
  const minF = Math.min(...frets), maxF = Math.max(...frets);
  const start = Math.max(1, Math.min(minF, Math.max(1, maxF - 4)));
  const rowY = (f) => nutY + (f - start + 0.5) * gap;
  const shown = [start, start + 1, start + 2, start + 3, start + 4];
  const midX = (xOf(0) + xOf(5)) / 2;
  const INLAY = [3, 5, 7, 9, 12, 15, 17];

  // 도수 라벨: R / 3 / 5 / 7 (마이너·♭5·♭7은 ♭ 붙여서)
  const ivs = FORMULA[type] || [0, 4, 7, 11];
  const DEG_NAME = { 0: "R", 3: "♭3", 4: "3", 6: "♭5", 7: "5", 8: "♯5", 9: "6", 10: "♭7", 11: "7" };
  const guide = new Set([ivs[1], ivs[3]]); // 3음과 7음 = 가이드톤

  const dots = voicing.set.map((s, k) => {
    const fret = frets[k];
    const midi = OPEN_MIDI[s] + fret;
    const iv = ((midi % 12) - rootPC + 12) % 12;
    return {
      s, fret, iv,
      isRoot: iv === 0,
      isGuide: guide.has(iv),
      deg: DEG_NAME[iv] || String(iv),
      note: noteName(keyPC == null ? rootPC : keyPC, midi % 12),
    };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`지금 코드의 보이싱. ${dots.map((d) => `${6 - d.s}번줄 ${d.fret}프렛 ${d.deg}음`).join(", ")}`}
      style={{ width: "100%", maxWidth: 250, height: "auto", display: "block", margin: "0 auto" }}>
      <rect x={padL - 8} y={nutY} width={W - padL - padR + 16} height={ROWS * gap} rx="4" fill={C.neck} />
      {Array.from({ length: ROWS }, (_, k) => k + 1).map((n) => (
        <line key={n} x1={padL - 8} y1={nutY + n * gap} x2={W - padR + 8} y2={nutY + n * gap} stroke={C.fretwire} strokeWidth="1.6" />
      ))}
      {shown.filter((f) => INLAY.includes(f)).map((f) =>
        f === 12 ? (
          <g key={"in" + f}>
            <circle cx={midX - 8} cy={rowY(f)} r="3" fill={C.muted} fillOpacity="0.5" />
            <circle cx={midX + 8} cy={rowY(f)} r="3" fill={C.muted} fillOpacity="0.5" />
          </g>
        ) : (
          <circle key={"in" + f} cx={midX} cy={rowY(f)} r="3" fill={C.muted} fillOpacity="0.5" />
        )
      )}
      {shown.map((f) => (
        <text key={"fl" + f} x={padL - 18} y={rowY(f)} textAnchor="middle" dominantBaseline="central"
          fontFamily="ui-monospace, monospace" fontSize="9.5" fill={INLAY.includes(f) ? C.brass : C.muted}>{f}</text>
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={"s" + i} x1={xOf(i)} y1={nutY} x2={xOf(i)} y2={nutY + ROWS * gap}
          stroke={C.string} strokeWidth={2.6 - i * 0.28} strokeOpacity="0.8" />
      ))}
      {dots.map((d) => (
        <g key={d.s}>
          <circle cx={xOf(d.s)} cy={rowY(d.fret)} r="11.5"
            fill={d.isGuide ? C.brass : d.isRoot ? C.hub : C.hub}
            stroke={d.isGuide ? C.brass : d.isRoot ? C.text : C.teal} strokeWidth="1.5" />
          <text x={xOf(d.s)} y={rowY(d.fret)} textAnchor="middle" dominantBaseline="central"
            fontSize={d.deg.length > 1 ? 9 : 10.5} fontWeight="800"
            fill={d.isGuide ? C.bg : d.isRoot ? C.text : C.teal}>{d.deg}</text>
        </g>
      ))}
    </svg>
  );
}
