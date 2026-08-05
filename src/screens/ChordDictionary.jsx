import React, { useState } from "react";
import { C } from "../theme.js";
import { ROOTS, OPEN_MIDI } from "../theory/notes.js";
import { CHORD_TYPES, buildVoicings } from "../theory/chords.js";
import { strum } from "../audio/play.js";
import VWheel from "../components/VWheel.jsx";
import Screen from "../components/Screen.jsx";


// ══════════════════════════════════════════════════════
//  ② 코드 사전 (오픈 + 이동식 바레)
// ══════════════════════════════════════════════════════
export function ChordFretboard({ voicing }) {
  const W = 250, ROWS = 5, H = 300;
  const padL = 34, padR = 24, padTop = 48, padBot = 14;
  const xOf = (i) => padL + i * ((W - padL - padR) / 5);
  const nutY = padTop, gap = (H - padBot - nutY) / ROWS;
  const s = voicing.s;
  const sounded = s.map((x) => x[0]).filter((f) => f > 0);
  const minF = sounded.length ? Math.min(...sounded) : 0;
  const hasOpen = s.some(([f]) => f === 0);
  const start = (hasOpen || minF <= 1) ? 0 : minF; // 0이면 너트 표시
  const rowY = (f) => start === 0 ? nutY + (f - 0.5) * gap : nutY + (f - start + 0.5) * gap;

  // 바레: 이동식 코드이고 base 프렛에 2줄 이상 눌릴 때
  let barre = null;
  if (voicing.barre && voicing.base > 0) {
    const atBase = [];
    s.forEach(([f], i) => { if (f === voicing.base) atBase.push(i); });
    if (atBase.length >= 2) barre = { fret: voicing.base, lo: Math.min(...atBase), hi: Math.max(...atBase) };
  }
  const shownFrets = start === 0 ? [1, 2, 3, 4, 5] : [start, start + 1, start + 2, start + 3, start + 4];
  const midX = (xOf(0) + xOf(5)) / 2;
  const INLAY = [3, 5, 7, 9, 12];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 290, height: "auto", display: "block", margin: "0 auto" }}>
      <rect x={padL - 8} y={nutY} width={W - padL - padR + 16} height={ROWS * gap} rx="4" fill={C.neck} />
      {Array.from({ length: ROWS }, (_, k) => k + 1).map((n) => (
        <line key={n} x1={padL - 8} y1={nutY + n * gap} x2={W - padR + 8} y2={nutY + n * gap} stroke={C.fretwire} strokeWidth="2" />
      ))}
      {start === 0 && <rect x={padL - 8} y={nutY - 3} width={W - padL - padR + 16} height="5" fill="#C9B79A" />}
      {shownFrets.filter((f) => INLAY.includes(f)).map((f) => (
        f === 12
          ? <g key={"in" + f}><circle cx={midX - 9} cy={rowY(f)} r="3.4" fill={C.muted} fillOpacity="0.55" /><circle cx={midX + 9} cy={rowY(f)} r="3.4" fill={C.muted} fillOpacity="0.55" /></g>
          : <circle key={"in" + f} cx={midX} cy={rowY(f)} r="3.4" fill={C.muted} fillOpacity="0.55" />
      ))}
      {shownFrets.map((f) => (
        <text key={"fl" + f} x={padL - 20} y={rowY(f)} textAnchor="middle" dominantBaseline="central" fontFamily="ui-monospace, monospace" fontSize="9.5" fill={INLAY.includes(f) ? C.brass : C.muted}>{f}</text>
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={"s" + i} x1={xOf(i)} y1={nutY} x2={xOf(i)} y2={nutY + ROWS * gap} stroke={C.string} strokeWidth={3 - i * 0.32} strokeOpacity="0.85" />
      ))}
      {/* 개방현/뮤트 마커 */}
      {s.map(([f], i) => {
        const cy = nutY - 20;
        if (f === -1) return <text key={"m" + i} x={xOf(i)} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="700" fill={C.mute}>✕</text>;
        if (f === 0 && start === 0) return <circle key={"o" + i} cx={xOf(i)} cy={cy} r="7" fill="none" stroke={C.text} strokeWidth="1.6" />;
        return null;
      })}
      {/* 바레 막대 */}
      {barre && (
        <rect x={xOf(barre.lo) - 11} y={rowY(barre.fret) - 11} width={xOf(barre.hi) - xOf(barre.lo) + 22} height="22" rx="11" fill={C.brass} />
      )}
      {/* 운지 점 */}
      {s.map(([f, fin], i) => {
        if (f <= 0) return null;
        if (barre && f === barre.fret && i >= barre.lo && i <= barre.hi) return null; // 막대가 대신 표시
        return (
          <g key={"d" + i}>
            <circle cx={xOf(i)} cy={rowY(f)} r="12.5" fill={C.brass} />
            {voicing.open && fin > 0 && <text x={xOf(i)} y={rowY(f)} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="800" fill={C.bg}>{fin}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export function ChordDictionary() {
  const [root, setRoot] = useState(0);   // C
  const [ti, setTi] = useState(0);       // maj
  const [bass, setBass] = useState(null); // 슬래시 베이스 (null = 없음)
  const [pos, setPos] = useState(0);
  const type = CHORD_TYPES[ti];
  const voicings = buildVoicings(root, type.id, bass);
  const p = voicings.length ? Math.min(pos, voicings.length - 1) : 0;
  const voicing = voicings[p];
  const title = ROOTS[root] + type.sym + (bass !== null ? " / " + ROOTS[bass] : "");
  const playChord = () => {
    if (!voicing) return;
    const midis = voicing.s.map((x, i) => (x[0] >= 0 ? OPEN_MIDI[i] + x[0] : null)).filter((m) => m !== null);
    strum(midis);
  };

  return (
    <Screen>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: "0 0 27%", minWidth: 0 }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.16em", color: C.muted, textTransform: "uppercase", marginBottom: 5, textAlign: "center" }}>루트</div>
          <VWheel items={ROOTS} value={root} onChange={(i) => { setRoot(i); setPos(0); }} size={17} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.16em", color: C.muted, textTransform: "uppercase", marginBottom: 5, textAlign: "center" }}>타입</div>
          <VWheel items={CHORD_TYPES.map((t) => t.label)} value={ti} onChange={(i) => { setTi(i); setPos(0); }} size={15} />
        </div>
        <div style={{ flex: "0 0 27%", minWidth: 0 }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.16em", color: C.muted, textTransform: "uppercase", marginBottom: 5, textAlign: "center" }}>베이스</div>
          <VWheel items={["없음", ...ROOTS]} value={bass === null ? 0 : bass + 1} onChange={(i) => { setBass(i === 0 ? null : i - 1); setPos(0); }} size={15} />
        </div>
      </div>

      <div style={{ background: C.panel, borderRadius: 14, padding: "16px 12px 12px" }}>
        <div style={{ textAlign: "center", fontSize: 30, fontWeight: 800, marginBottom: 10, letterSpacing: "-0.01em" }}>{title}</div>

        {voicing && voicings.length > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {voicings.map((v, i) => (
              <button key={i} onClick={() => setPos(i)} style={{ padding: "5px 11px", borderRadius: 999, cursor: "pointer", fontSize: 11.5, fontWeight: 700, background: i === p ? C.hub : "transparent", color: i === p ? C.brass : C.muted, border: `1px solid ${i === p ? C.brass : "transparent"}` }}>{v.label}</button>
            ))}
          </div>
        )}

        {voicing && <ChordFretboard voicing={voicing} />}

        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <button onClick={playChord} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 700, background: "transparent", color: C.brass, border: `1px solid ${C.brass}` }}>▶ 코드 듣기</button>
        </div>

        <div style={{ textAlign: "center", fontSize: 11.5, color: C.muted, marginTop: 12 }}>
          {voicing && voicing.slash ? "최저음(가장 굵은 줄) = 베이스 " + ROOTS[bass] + " · 나머지 = 코드 구성음"
            : voicing && voicing.open ? "숫자 = 손가락 번호 · ○ 개방현 · ✕ 안 침"
            : voicing && voicing.barre ? "가로 막대 = 바레(검지로 한 프렛 전체 누르기) · ✕ 안 침"
            : "✕ 표시된 줄은 뮤트(치지 않음) · 펑크 커팅에 좋아요"}
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: 11.5, color: C.muted, marginTop: 12 }}>
        왼쪽이 저음(6번 줄) · 오른쪽이 고음(1번 줄)
      </div>
    </Screen>
  );
}

export default ChordDictionary;
