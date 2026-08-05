import React, { useState, useRef, useEffect, useCallback } from "react";
import { C, QCOLOR, QLABEL, SEG } from "../theme.js";
import { KEYS, KEY_PC, MAJ_DEG, TRIAD, PROGRESSIONS } from "../theory/notes.js";
import { sequence } from "../audio/play.js";
import { useJam } from "../jam/JamProvider.jsx";
import Screen from "../components/Screen.jsx";
import SectionLabel from "../components/SectionLabel.jsx";
import InfoCard from "../components/InfoCard.jsx";
import ProgRow from "../components/ProgRow.jsx";


export const N = KEYS.length, STEP = 360 / N;
export const CX = 200, CY = 200, R_LABEL = 152, R_RING = 190, R_HUB = 78;
export const nearestAngle = (target, current) =>
  current + (((target - current + 180) % 360 + 360) % 360 - 180);

// ══════════════════════════════════════════════════════
//  ① 5도권 디코더
// ══════════════════════════════════════════════════════
export function Decoder() {
  const jam = useJam();
  const [rotation, setRotation] = useState(() => -jam.keyIdx * STEP);
  const rotRef = useRef(-jam.keyIdx * STEP), rafRef = useRef(0), dragRef = useRef(null), svgRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [openProg, setOpenProg] = useState(null);
  const [progOpen, setProgOpen] = useState(false);
  const [diaMode, setDiaMode] = useState("maj");
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = typeof window !== "undefined" && window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const apply = useCallback((v) => { rotRef.current = v; setRotation(v); }, []);
  const selected = ((Math.round(-rotation / STEP)) % N + N) % N;
  const key = KEYS[selected];
  // 나란한조 모드: 같은 7코드를 6번째(vi)부터 돌려 i-ii°-III-iv-v-VI-VII 순서·도수로 표시
  const MIN_NUM = ["i", "ii°", "III", "iv", "v", "VI", "VII"];
  const diaChords = diaMode === "min"
    ? key.chords.slice(5).concat(key.chords.slice(0, 5)).map((c, i) => [MIN_NUM[i], c[1], c[2]])
    : key.chords;

  useEffect(() => { jam.setKeyIdx(selected); }, [selected]); // 다이얼 → 공용 잼 키

  const animateTo = useCallback((target) => {
    cancelAnimationFrame(rafRef.current);
    const start = rotRef.current, change = target - start;
    const dur = reduced.current ? 0 : 380;
    if (dur === 0) { apply(target); return; }
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      apply(start + change * (1 - Math.pow(1 - p, 3)));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [apply]);

  const selRef = useRef(selected); selRef.current = selected;
  // 시트 등 외부에서 잼 키가 바뀌면 다이얼을 그 키로 회전(최단 경로)
  useEffect(() => {
    if (jam.keyIdx !== selRef.current) animateTo(nearestAngle(-jam.keyIdx * STEP, rotRef.current));
  }, [jam.keyIdx, animateTo]);

  const angleOf = (cx, cy) => {
    const r = svgRef.current.getBoundingClientRect();
    return Math.atan2(cy - (r.top + r.height / 2), cx - (r.left + r.width / 2)) * 180 / Math.PI;
  };
  const onDown = (e) => {
    cancelAnimationFrame(rafRef.current);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startAngle: angleOf(e.clientX, e.clientY), startRot: rotRef.current, moved: false };
    setDragging(true);
  };
  const onMove = (e) => {
    if (!dragRef.current) return;
    const delta = angleOf(e.clientX, e.clientY) - dragRef.current.startAngle;
    if (Math.abs(delta) > 1) dragRef.current.moved = true;
    apply(dragRef.current.startRot + delta);
  };
  const onUp = (e) => {
    if (!dragRef.current) return;
    const d = dragRef.current;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    dragRef.current = null; setDragging(false);
    const snap = Math.round(rotRef.current / STEP) * STEP;
    if (d.moved) { animateTo(snap); return; }
    const rect = svgRef.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2), dy = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy);
    if (dist < (R_HUB / 400) * rect.width || dist > (R_RING / 400) * rect.width + 10) { animateTo(snap); return; }
    const S = Math.atan2(dy, dx) * 180 / Math.PI;
    const i = ((Math.round((S + 90 - rotRef.current) / STEP)) % N + N) % N;
    animateTo(nearestAngle(-i * STEP, rotRef.current));
  };

  const labels = KEYS.map((k, i) => {
    const theta = (i * STEP + rotation - 90) * Math.PI / 180;
    return { k, i, x: CX + R_LABEL * Math.cos(theta), y: CY + R_LABEL * Math.sin(theta) };
  });
  const sigText = key.sig.t === "none" ? "없음 (내추럴)"
    : `${key.sig.t === "sharp" ? "샤프 ♯" : "플랫 ♭"} ${key.sig.n}개 · ${key.sig.notes.join("  ")}`;

  const playProgression = (deg) => {
    const chords = deg.map((di) => {
      const rpc = (KEY_PC[selected] + MAJ_DEG[di]) % 12;
      return (TRIAD[key.chords[di][2]] || TRIAD.maj).map((x) => 48 + rpc + x);
    });
    sequence(chords);
  };

  return (
    <Screen>
      <div style={{ textAlign: "center", marginBottom: 2 }}>
        <div style={{ fontSize: 12.5, color: C.dim }}>다이얼을 돌려 키를 맞추세요</div>
      </div>
      <div style={{ position: "relative", width: "100%", maxWidth: 380, margin: "10px auto 0" }}>
        <svg ref={svgRef} viewBox="0 0 400 400"
          style={{ width: "100%", height: "auto", display: "block", touchAction: "none", cursor: dragging ? "grabbing" : "grab" }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <circle cx={CX} cy={CY} r={R_RING} fill={C.panel} stroke={C.brass} strokeOpacity="0.5" strokeWidth="2" />
          <circle cx={CX} cy={CY} r={R_RING - 12} fill="none" stroke={C.ring} strokeWidth="1" />
          {labels.map(({ i }) => {
            const a = (i * STEP + rotation - 90 + STEP / 2) * Math.PI / 180;
            return <line key={"d" + i} x1={CX + (R_HUB + 6) * Math.cos(a)} y1={CY + (R_HUB + 6) * Math.sin(a)}
              x2={CX + (R_RING - 14) * Math.cos(a)} y2={CY + (R_RING - 14) * Math.sin(a)} stroke={C.ring} strokeWidth="1" strokeOpacity="0.6" />;
          })}
          <g style={{ pointerEvents: "none" }}>
            {labels.map(({ k, i, x, y }) => {
              const on = i === selected;
              return (
                <g key={"l" + i}>
                  {on && <circle cx={x} cy={y} r={22} fill={C.brass} fillOpacity="0.16" stroke={C.brass} strokeWidth="1.4" />}
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontFamily="ui-sans-serif, system-ui, sans-serif"
                    fontSize={on ? 20 : 16} fontWeight={on ? 800 : 600} fill={on ? C.brass : C.muted}>{k.short}</text>
                </g>
              );
            })}
          </g>
          <circle cx={CX} cy={CY} r={R_HUB} fill={C.hub} stroke={C.ring} strokeWidth="1.5" />
          <text x={CX} y={CY - 8} textAnchor="middle" dominantBaseline="central" fontSize={key.name.length > 3 ? 30 : 46} fontWeight="800" fill={C.text} letterSpacing="-0.02em">{key.name}</text>
          <text x={CX} y={CY + 26} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="0.2em" fill={C.muted}>KEY</text>
          <polygon points={`${CX - 11},14 ${CX + 11},14 ${CX},34`} fill={C.brass} />
        </svg>
      </div>
      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <SectionLabel>다이어토닉 코드</SectionLabel>
          <div style={{ ...SEG, marginLeft: "auto" }}>
            {[["maj", "메이저"], ["min", key.rel]].map(([id, label]) => {
              const on = diaMode === id;
              return (<button key={id} onClick={() => setDiaMode(id)} style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "4px 11px", fontSize: 11.5, fontWeight: on ? 800 : 600, background: on ? C.brass : "transparent", color: on ? C.bg : C.muted }}>{label}</button>);
            })}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginTop: 8 }}>
          {diaChords.map(([num, name, q], idx) => (
            <div key={idx} style={{ background: C.panel, borderTop: `3px solid ${QCOLOR[q]}`, borderRadius: 8, padding: "8px 2px 9px", textAlign: "center", minWidth: 0 }}>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, color: C.muted }}>{num}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: QCOLOR[q], marginTop: 3, whiteSpace: "nowrap" }}>{name}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: C.muted, marginTop: 8 }}>
          {diaMode === "min" ? `같은 코드들, 중심만 ${key.rel}로 옮긴 순서 (나란한조)` : "메이저 키 기준 순서"}
        </div>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
          {["maj", "min", "dim"].map((q) => (
            <span key={q} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.muted }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: QCOLOR[q], display: "inline-block" }} />{QLABEL[q]}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
        <InfoCard label="조표 (Key Signature)" value={sigText} />
        <InfoCard label="나란한조 (Relative minor)" value={key.rel} accent={C.teal} />
      </div>
      <div style={{ marginTop: 16 }}>
        <button onClick={() => setProgOpen((o) => !o)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: C.panel, border: `1px solid ${progOpen ? C.brass : "transparent"}`, borderRadius: 10, padding: "13px 14px", cursor: "pointer", textAlign: "left", boxSizing: "border-box" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.18em", color: C.muted, textTransform: "uppercase" }}>추천 코드 진행</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: progOpen ? C.brass : C.text, marginTop: 3 }}>{PROGRESSIONS.length}개 진행 {progOpen ? "닫기" : "보기"}</div>
          </div>
          <span style={{ marginLeft: "auto", color: progOpen ? C.brass : C.muted, fontSize: 14, transform: progOpen ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}>▾</span>
        </button>
        {progOpen && (<>
        <div style={{ fontSize: 11.5, color: C.muted, marginTop: 8 }}>카드를 누르면 이어가기 좋은 진행이 펼쳐집니다</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {PROGRESSIONS.map((p, pi) => {
            const open = openProg === pi;
            return (
              <div key={pi} style={{ background: C.panel, border: `1px solid ${open ? C.brass : "transparent"}`, borderRadius: 10, overflow: "hidden" }}>
                <div onClick={() => setOpenProg(open ? null : pi)} style={{ padding: "10px 13px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ minWidth: 0 }}><ProgRow deg={p.deg} keyData={key} big /></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 1 }}>
                      <button onClick={(e) => { e.stopPropagation(); playProgression(p.deg); }} title="진행 듣기" style={{ width: 30, height: 30, borderRadius: 999, cursor: "pointer", border: `1px solid ${C.brass}`, background: "transparent", color: C.brass, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}>▶</button>
                      <span style={{ color: open ? C.brass : C.muted, fontSize: 12, display: "inline-block", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <span style={{ fontSize: 12.5, color: C.text, opacity: 0.85 }}>{p.mood}</span>
                    <span style={{ fontSize: 11, color: C.muted, fontFamily: "ui-monospace, monospace", letterSpacing: "0.04em", borderRadius: 999, padding: "2px 10px", whiteSpace: "nowrap" }}>{p.genre}</span>
                  </div>
                </div>
                {open && (
                  <div style={{ background: C.bg, padding: "10px 13px 12px" }}>
                    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.18em", color: C.muted, textTransform: "uppercase", marginBottom: 9 }}>이어가기 좋은 진행</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                      {p.next.map((nx, ni) => (
                        <div key={ni} style={{ borderLeft: `2px solid ${C.brass}`, paddingLeft: 11 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div style={{ minWidth: 0 }}><ProgRow deg={nx.deg} keyData={key} /></div>
                            <button onClick={(e) => { e.stopPropagation(); playProgression(nx.deg); }} title="진행 듣기" style={{ width: 26, height: 26, borderRadius: 999, cursor: "pointer", border: `1px solid ${C.brass}`, background: "transparent", color: C.brass, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}>▶</button>
                          </div>
                          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{nx.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </>)}
      </div>
    </Screen>
  );
}

export default Decoder;
