import React, { useState } from "react";
import { C, SEGLABEL } from "../theme.js";
import { ROOTS, KEYS, KEY_PC, FORMULA, OPEN_PC, OPEN_MIDI, noteName } from "../theory/notes.js";
import { SCALES, cagedPositions, build3nps, diagFrom, inScale } from "../theory/scales.js";
import { JAM_FORMS, JAM_SYM, jamKeyScale, jamChordScale, jamForScale } from "../theory/jam.js";
import { melody } from "../audio/play.js";
import { useJam } from "../jam/JamProvider.jsx";
import Screen from "../components/Screen.jsx";
import VWheel from "../components/VWheel.jsx";
import { useStored, intIn, oneOf } from "../storage.js";


// ══════════════════════════════════════════════════════
//  ③ 스케일 (도수 / 음이름 토글)
// ══════════════════════════════════════════════════════
export function ScaleBoard({ rootPC, scale, labelMode, mode, boxStart, only, path, maxFret }) {
  // 3음/줄 포지션은 16~17프렛까지 올라가는 경우가 있다. 예전에는 15프렛까지만 그려서
  // 그 음들이 화면에서 잘려 보이지 않았다 → 필요한 만큼 지판을 늘려 그린다.
  const W = 272, FRETS = Math.max(15, Math.min(17, maxFret || 15));
  const padL = 30, padR = 18, padTop = 42, padBot = 16;
  const xOf = (i) => padL + i * ((W - padL - padR) / 5);
  const nutY = padTop, fretGap = 33;
  const H = nutY + FRETS * fretGap + padBot;
  const fretY = (n) => nutY + n * fretGap;
  const dotY = (f) => nutY + (f - 0.5) * fretGap;
  const openY = nutY - 20, midX = (xOf(0) + xOf(5)) / 2;
  const map = {}; scale.notes.forEach((n) => { map[n.iv] = n.deg; });

  const dots = [];
  for (let i = 0; i < 6; i++) {
    for (let f = 0; f <= FRETS; f++) {
      const pc = (OPEN_PC[i] + f) % 12;
      const iv = ((pc - rootPC) % 12 + 12) % 12;
      if (map[iv] === undefined) continue;
      if (mode === "box" && (f < boxStart || f > boxStart + 4)) continue;
      if (only && !only.has(i + "-" + f)) continue;
      const label = labelMode === "note" ? noteName(rootPC, pc) : map[iv];
      dots.push({ x: xOf(i), y: f === 0 ? openY : dotY(f), label, isRoot: iv === 0, key: i + "-" + f });
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 320, height: "auto", display: "block", margin: "0 auto" }}>
      <rect x={padL - 8} y={nutY} width={W - padL - padR + 16} height={FRETS * fretGap} rx="4" fill={C.neck} />
      {mode === "box" && (() => {
        const top = boxStart === 0 ? nutY - 30 : nutY + (boxStart - 1) * fretGap;
        const bot = Math.min(nutY + FRETS * fretGap, nutY + (boxStart + 4) * fretGap);
        return <rect x={padL - 8} y={top} width={W - padL - padR + 16} height={bot - top} fill={C.brass} fillOpacity="0.08" />;
      })()}
      {Array.from({ length: FRETS }, (_, k) => k + 1).map((n) => (
        <line key={n} x1={padL - 8} y1={fretY(n)} x2={W - padR + 8} y2={fretY(n)} stroke={C.fretwire} strokeWidth="1.6" />
      ))}
      {[3, 5, 7, 9, 15, 17].filter((n) => n <= FRETS).map((n) => <circle key={"in" + n} cx={midX} cy={dotY(n)} r="3.2" fill={C.muted} fillOpacity="0.5" />)}
      <circle cx={midX - 9} cy={dotY(12)} r="3.2" fill={C.muted} fillOpacity="0.5" />
      <circle cx={midX + 9} cy={dotY(12)} r="3.2" fill={C.muted} fillOpacity="0.5" />
      {Array.from({ length: FRETS }, (_, k) => k + 1).map((n) => (
        <text key={"fn" + n} x={padL - 18} y={dotY(n)} textAnchor="middle" dominantBaseline="central" fontFamily="ui-monospace, monospace" fontSize="9" fill={C.muted}>{n}</text>
      ))}
      <rect x={padL - 8} y={nutY - 3} width={W - padL - padR + 16} height="5" fill="#C9B79A" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={"s" + i} x1={xOf(i)} y1={nutY} x2={xOf(i)} y2={nutY + FRETS * fretGap} stroke={C.string} strokeWidth={2.6 - i * 0.28} strokeOpacity="0.8" />
      ))}
      {path && path.length > 1 && (
        <polyline fill="none" stroke={C.brass} strokeWidth="1.6" strokeOpacity="0.6" strokeDasharray="4 3"
          points={path.map((k) => { const [i, f] = k.split("-").map(Number); return xOf(i) + "," + (f === 0 ? openY : dotY(f)); }).join(" ")} />
      )}
      {dots.map((d) => (
        <g key={d.key}>
          <circle cx={d.x} cy={d.y} r="11" fill={d.isRoot ? C.brass : C.hub} stroke={d.isRoot ? C.brass : C.teal} strokeWidth="1.5" />
          <text x={d.x} y={d.y} textAnchor="middle" dominantBaseline="central" fontSize={d.label.length > 1 ? 8.5 : 9.5} fontWeight="800" fill={d.isRoot ? C.bg : C.teal}>{d.label}</text>
        </g>
      ))}
    </svg>
  );
}

// 스케일 탭 ↔ 잼 연결 (간결판): 기본은 한 줄, 코드별은 접기, 잼 제안은 버튼 하나
// C안: "내가 보는 스케일" ↔ "도는 잼"을 대칭으로 놓고, 각자 상대를 맞추는 버튼을 가짐
export function JamScaleLink({ jam, root, sc, scale, setRoot, setSc, setPosIdx, jamBest }) {
  const [open, setOpen] = useState(false);
  const form = JAM_FORMS[jam.form];
  const keyPC = KEY_PC[jam.keyIdx];
  const ks = jamKeyScale(form, keyPC);
  const onKeyScale = root === ks.root && sc === ks.sc;
  const scaleSet = new Set(scale.notes.map((n) => (root + n.iv) % 12));
  const chordInfo = form.chords.map((ch) => {
    const cr = (keyPC + ch.deg) % 12;
    const miss = FORMULA[ch.type].map((iv) => (cr + iv) % 12).filter((pc) => !scaleSet.has(pc));
    const r = jamChordScale(form, keyPC, ch);
    return { chord: `${noteName(keyPC, cr)}${JAM_SYM[ch.type]}`, miss, root: r.root, sc: r.sc, note: r.note };
  });
  const warn = chordInfo.filter((c) => c.miss.length);
  const status = warn.length === 0
    ? { ok: true, text: "지금 잼에 그대로 통함" }
    : warn.length === 1
      ? { ok: false, text: `${warn[0].chord}만 주의 — ${warn[0].miss.map((pc) => noteName(keyPC, pc)).join(", ")} 없음` }
      : { ok: false, text: "둘이 안 맞음 — 한쪽을 맞춰보세요" };
  const colStyle = { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 };
  const capStyle = { fontFamily: "ui-monospace, monospace", fontSize: 11.5, letterSpacing: "0.1em", color: C.dim, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 };
  const btnStyle = (col) => ({ cursor: "pointer", borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 700, background: "transparent", color: col, border: `1px solid ${col}`, whiteSpace: "nowrap", alignSelf: "flex-start" });
  return (
    <div style={{ background: C.panel, borderRadius: 12, padding: "11px 12px", marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 11, alignItems: "stretch" }}>
        <div style={colStyle}>
          <div style={capStyle}>선택한 스케일</div>
          <div style={{ fontSize: 13, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ROOTS[root]} {scale.name}</div>
          {jamBest && (
            <button onClick={() => { jam.setKeyIdx(jamBest.keyIdx); jam.setForm(jamBest.formIdx); if (!jam.playing) jam.setPlaying(true); }} style={btnStyle(C.teal)}>▶ 이걸로 잼 틀기</button>
          )}
        </div>
        <div style={{ width: 1, background: C.ring, flexShrink: 0 }} />
        <div style={colStyle}>
          <div style={capStyle}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: jam.playing ? C.teal : C.dim, display: "inline-block", flexShrink: 0 }} />
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>251 잼 세션 · {jam.playing ? "재생 중" : "멈춤"}</span>
          </div>
          <div style={{ fontSize: 13, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{KEYS[jam.keyIdx].short} · {form.name}</div>
          {!onKeyScale && (
            <button onClick={() => { setRoot(ks.root); setSc(ks.sc); setPosIdx(0); }} style={btnStyle(C.brass)}>{ROOTS[ks.root]} {SCALES[ks.sc].name} 보기</button>
          )}
        </div>
      </div>
      <div style={{ marginTop: 9 }}>
        <span style={{ display: "inline-block", fontSize: 11, borderRadius: 6, padding: "3px 8px", background: status.ok ? C.tealBg : C.roseBg, color: status.ok ? C.tealText : C.roseText }}>{status.text}</span>
      </div>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} style={{ marginTop: 8, cursor: "pointer", border: "none", background: "transparent", color: C.dim, fontSize: 12, padding: 0 }}>
        {open ? "▾" : "▸"} 코드별 스케일 보기
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {chordInfo.map((c, i) => {
            const on = c.root === root && c.sc === sc;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => { setRoot(c.root); setSc(c.sc); setPosIdx(0); }}
                  style={{ cursor: "pointer", borderRadius: 8, padding: "4px 9px", fontSize: 12, fontWeight: on ? 800 : 600, background: on ? C.hub : "transparent", color: on ? C.brass : C.text, border: `1px solid ${on ? C.brass : "transparent"}`, whiteSpace: "nowrap" }}>
                  {c.chord} → {ROOTS[c.root]} {SCALES[c.sc].name}
                </button>
                {c.miss.length > 0 && <span style={{ fontSize: 11.5, color: C.roseText }}>{c.miss.map((pc) => noteName(keyPC, pc)).join(", ")} 없음</span>}
              </div>
            );
          })}
          {chordInfo.some((c) => c.note) && (
            <div style={{ fontSize: 11.5, color: C.dim, marginTop: 2, lineHeight: 1.5 }}>
              {chordInfo.filter((c) => c.note).map((c, i) => <div key={i}>· {c.chord}: {c.note}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Scales() {
  const jam = useJam();
  // 앱을 껐다 켜도 마지막에 보던 스케일·보기 방식이 그대로 뜬다
  const [root, setRoot] = useStored("scale.root", 9, intIn(0, ROOTS.length - 1)); // A
  const [sc, setSc] = useStored("scale.index", 3, intIn(0, SCALES.length - 1));   // 마이너 펜타토닉
  const [labelMode, setLabelMode] = useStored("scale.label", "deg", oneOf(["deg", "note"]));
  const [view, setView] = useStored("scale.view", "all", oneOf(["all", "box", "nps", "diag"]));
  const [posIdx, setPosIdx] = useState(0);
  const scale = SCALES[sc];
  const jamBest = (() => {
    const cur = JAM_FORMS[jam.form];
    const keyPc = KEY_PC[jam.keyIdx];
    const set = new Set(scale.notes.map((n) => (root + n.iv) % 12));
    // 지금 잼의 모든 코드음이 이 스케일에 있으면 이미 잘 맞음 → 버튼 숨김 (미니바 안내와 같은 기준)
    const allCovered = cur.chords.every((ch) => {
      const cr = (keyPc + ch.deg) % 12;
      return FORMULA[ch.type].every((iv) => set.has((cr + iv) % 12));
    });
    if (allCovered) return null;
    const b = jamForScale(root, sc)[0];
    if (!b) return null;
    if (b.keyIdx === jam.keyIdx && b.formIdx === jam.form) return null;
    return b;
  })();
  const ivset = new Set(scale.notes.map((n) => n.iv));
  const is7 = scale.notes.length === 7;
  const effView = (view === "nps" && !is7) ? "all" : view;
  const CAGED_SCALES = new Set(["메이저", "메이저 펜타토닉", "마이너 펜타토닉"]);
  const isCaged = CAGED_SCALES.has(scale.name);
  const N = scale.notes.length;
  const boxAnchors = [];
  for (let f = 0; f <= 15; f++) { if (ivset.has(((4 + f - root) % 12 + 12) % 12)) boxAnchors.push(f); }
  const npsAnchors = [];
  for (let f = 0; f < 12; f++) { if (ivset.has(((4 + f - root) % 12 + 12) % 12)) npsAnchors.push(f); }
  const cagedPos = cagedPositions(root);


  // 대각선: 루트에서 시작, 줄당 배치를 스케일에 맞춰 자동 계산(펜타=2·3, 7음=3·4), 옥타브마다 넥 위로
  const inS = (a) => inScale(root, ivset, a);
  let diagPositions = [];
  if (effView === "diag") {
    const seen = new Set();
    for (const s0 of [0, 1]) for (let f = 0; f <= 12; f++) {
      const pc = (OPEN_MIDI[s0] + f) % 12;
      if (!inS(OPEN_MIDI[s0] + f)) continue;
      const seq = diagFrom(root, ivset, N, s0, f);
      if (!seq) continue;
      const sig = seq.map((x) => x.key).join("|");
      if (seen.has(sig)) continue; seen.add(sig);
      diagPositions.push({ s0, start: f, pc, seq, isRoot: pc === root });
    }
    diagPositions.sort((a, b) => {
      const pr = (x) => (x.isRoot && x.start >= 3 && x.start <= 12) ? 0 : x.isRoot ? 1 : 2;
      return pr(a) - pr(b) || a.start - b.start || a.s0 - b.s0;
    });
  }

  const positions = effView === "box"
    ? (isCaged ? cagedPos : boxAnchors.map((f) => ({ start: f, label: null })))
    : effView === "nps" ? npsAnchors.map((f) => ({ start: f, label: "3음/줄" }))
    : effView === "diag" ? diagPositions.map((d) => ({ start: d.start, seq: d.seq, label: (6 - d.s0) + "번줄 " + noteName(root, d.pc) + (d.isRoot ? " (루트)" : "") }))
    : [];
  const pIdx = positions.length ? Math.min(posIdx, positions.length - 1) : 0;
  const boxStart = positions[pIdx] ? positions[pIdx].start : 0;
  const boxLabel = positions[pIdx] ? positions[pIdx].label : null;
  const diagSeq = effView === "diag" && positions[pIdx] ? positions[pIdx].seq : null;
  const diagPath = diagSeq ? diagSeq.map((x) => x.key) : null;
  const only = effView === "nps" ? build3nps(root, ivset, boxStart) : effView === "diag" ? new Set(diagPath) : null;
  // 이 포지션이 몇 프렛까지 쓰는지 → 지판을 그만큼 늘려 그린다 (고프렛 잘림 방지)
  const neededFret = only && only.size
    ? Math.max(...[...only].map((k) => +k.split("-")[1]))
    : effView === "box" ? boxStart + 4 : 15;

  const playBox = () => {
    const midis = [];
    if (only) { only.forEach((k) => { const [i, f] = k.split("-").map(Number); midis.push(OPEN_MIDI[i] + f); }); }
    else { for (let i = 0; i < 6; i++) for (let f = boxStart; f <= boxStart + 4; f++) { if (ivset.has(((OPEN_PC[i] + f - root) % 12 + 12) % 12)) midis.push(OPEN_MIDI[i] + f); } }
    midis.sort((a, b) => a - b);
    melody(midis, 0.22, 0.28);
  };
  const playScale = () => {
    const midis = scale.notes.map((n) => 48 + root + n.iv);
    midis.push(48 + root + 12);
    melody(midis);
  };
  return (
    <Screen>
      <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 12 }}>
        <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: C.text }}>{ROOTS[root]}</span>
        <span style={{ fontSize: 15, color: C.muted }}>{scale.name}</span>
      </div>

      <JamScaleLink jam={jam} root={root} sc={sc} scale={scale} setRoot={setRoot} setSc={setSc} setPosIdx={setPosIdx} jamBest={jamBest} />

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: "0 0 27%", minWidth: 0 }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 5, textAlign: "center" }}>루트</div>
          <VWheel label="스케일 루트" items={ROOTS} value={root} onChange={(i) => { setRoot(i); setPosIdx(0); }} size={17} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 5, textAlign: "center" }}>스케일</div>
          <VWheel label="스케일 종류" items={SCALES.map((s) => s.name)} value={sc} onChange={(i) => { setSc(i); setPosIdx(0); }} size={14} />
        </div>
      </div>

      {/* 보기 4종은 한 줄을 통째로 써서 폭을 고르게 — 예전엔 '표시'와 한 줄에 끼어 빽빽했다 */}
      <div style={{ display: "flex", background: C.panel, borderRadius: 999, padding: 3, marginBottom: 8 }}
        role="group" aria-label="지판 보기 방식">
        {[["all", "전체"], ["box", "포지션"], ...(is7 ? [["nps", "3음/줄"]] : []), ["diag", "대각선"]].map(([m, lbl]) => (
          <button key={m} onClick={() => { setView(m); setPosIdx(0); }} aria-pressed={effView === m}
            style={{ flex: 1, padding: "7px 4px", borderRadius: 999, cursor: "pointer", fontSize: 12.5, fontWeight: 700, border: "none", background: effView === m ? C.brass : "transparent", color: effView === m ? C.bg : C.muted, whiteSpace: "nowrap" }}>{lbl}</button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase" }}>표시</span>
        <div style={{ display: "inline-flex", background: C.panel, borderRadius: 999, padding: 2 }} role="group" aria-label="음 표시 방식">
          {[["deg", "도수"], ["note", "음이름"]].map(([m, lbl]) => (
            <button key={m} onClick={() => setLabelMode(m)} aria-pressed={labelMode === m} style={{ padding: "5px 13px", borderRadius: 999, cursor: "pointer", fontSize: 12.5, fontWeight: 700, border: "none", background: labelMode === m ? C.brass : "transparent", color: labelMode === m ? C.bg : C.muted }}>{lbl}</button>
          ))}
        </div>
      </div>

      {positions.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 12 }}>
          <button onClick={() => setPosIdx(Math.max(0, pIdx - 1))} disabled={pIdx <= 0} aria-label="이전 포지션" style={{ width: 40, height: 36, borderRadius: 9, cursor: pIdx <= 0 ? "default" : "pointer", border: `1px solid ${C.ring}`, background: C.panel, color: pIdx <= 0 ? C.ring : C.text, fontSize: 15 }}>◀</button>
          <div style={{ textAlign: "center", minWidth: 150 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.brass }}>{boxLabel ? boxLabel + " · " : ""}포지션 {pIdx + 1} / {positions.length}</div>
            <div style={{ fontSize: 11.5, color: C.muted }}>{(() => { if (only && only.size) { const fr = [...only].map((k) => +k.split("-")[1]); return Math.min(...fr) + "~" + Math.max(...fr) + " 프렛"; } return boxStart + "~" + (boxStart + 4) + " 프렛"; })()}</div>
          </div>
          <button onClick={() => setPosIdx(Math.min(positions.length - 1, pIdx + 1))} disabled={pIdx >= positions.length - 1} aria-label="다음 포지션" style={{ width: 40, height: 36, borderRadius: 9, cursor: pIdx >= positions.length - 1 ? "default" : "pointer", border: `1px solid ${C.ring}`, background: C.panel, color: pIdx >= positions.length - 1 ? C.ring : C.text, fontSize: 15 }}>▶</button>
        </div>
      )}

      {effView === "diag" && (
        <div style={{ textAlign: "center", fontSize: 12, color: C.muted, marginBottom: 12 }}>
          루트에서 시작해 넥을 사선으로 상행 · ◀▶로 시작 위치(루트) 선택 · 점선 = 재생 순서
        </div>
      )}

      <div style={{ background: C.panel, borderRadius: 14, padding: "14px 8px 10px" }}>
        <ScaleBoard rootPC={root} scale={scale} labelMode={labelMode} mode={effView} boxStart={boxStart} only={only} path={effView === "diag" ? diagPath : null} maxFret={neededFret} />
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <button onClick={playScale} aria-label="스케일 소리 듣기" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 700, background: "transparent", color: C.brass, border: `1px solid ${C.brass}` }}>▶ 스케일 듣기</button>
          {effView !== "all" && <button onClick={playBox} aria-label="이 포지션 소리 듣기" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 700, background: "transparent", color: C.brass, border: `1px solid ${C.brass}` }}>▶ {effView === "nps" ? "포지션" : effView === "diag" ? "대각선" : "박스"} 듣기</button>}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10, flexWrap: "wrap", fontSize: 11.5, color: C.muted }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 13, height: 13, borderRadius: 999, background: C.brass, display: "inline-block" }} />루트</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 999, background: C.hub, border: `1.5px solid ${C.teal}`, display: "inline-block" }} />스케일 음</span>
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: 11.5, color: C.muted, marginTop: 12 }}>
        왼쪽이 저음(6번 줄) · 위가 너트
      </div>
    </Screen>
  );
}

export default Scales;
