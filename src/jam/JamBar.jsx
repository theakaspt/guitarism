import React, { useState } from "react";
import { C, SEGLABEL } from "../theme.js";
import { KEYS, KEY_PC, noteName } from "../theory/notes.js";
import { JAM_FORMS, JAM_SYM, COMP_RHYTHMS } from "../theory/jam.js";
import { DRUM_FEELS } from "../audio/drums.js";
import { useJam } from "./JamProvider.jsx";
import VWheel from "../components/VWheel.jsx";
import SectionLabel from "../components/SectionLabel.jsx";
import JamVoicing from "./JamVoicing.jsx";

// 잼 미니 플레이어: 탭바 위 얇은 바(접힘) + 탭 시 전체 컨트롤 시트(펼침). App에 한 번만 상주.
export function JamBar() {
  const jam = useJam();
  const [open, setOpen] = useState(false);
  const keyPc = KEY_PC[jam.keyIdx];
  const keyName = KEYS[jam.keyIdx].short;
  const form = JAM_FORMS[jam.form];
  const formName = form.name;
  // 지금(혹은 첫) 코드의 보이싱 정보
  const ci = Math.min(jam.nowChord || 0, form.chords.length - 1);
  const nowVoicing = jam.voicings && jam.voicings[ci];
  const nowChordDef = form.chords[ci];
  const nowRootPC = nowChordDef ? (keyPc + nowChordDef.deg) % 12 : 0;
  const nowType = nowChordDef ? nowChordDef.type : "maj7";
  return (
    <>
      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 58 }} />}
      {open && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60, background: C.panel, borderTop: `1px solid ${C.ring}`, borderRadius: "18px 18px 0 0", maxHeight: "82vh", overflowY: "auto", boxSizing: "border-box" }}>
          <div style={{ maxWidth: 440, margin: "0 auto", padding: "10px 16px 22px" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: C.ring, margin: "0 auto 12px" }} />
            <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
              <SectionLabel>251 잼 세션</SectionLabel>
              <button onClick={() => setOpen(false)} aria-label="잼 설정 닫기" style={{ marginLeft: "auto", border: "none", background: "transparent", color: C.muted, fontSize: 15, cursor: "pointer", padding: "2px 6px" }}>▾ 닫기</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div style={{ flex: "0 0 30%", minWidth: 0 }}>
                <div style={{ ...SEGLABEL, marginBottom: 5, textAlign: "center" }}>키</div>
                <VWheel label="잼 키" items={KEYS.map((k) => k.short)} value={jam.keyIdx} onChange={(i) => jam.setKeyIdx(i)} size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...SEGLABEL, marginBottom: 5, textAlign: "center" }}>폼</div>
                <VWheel label="잼 폼" items={JAM_FORMS.map((f) => f.name)} value={jam.form} onChange={(i) => jam.setForm(i)} size={14} />
              </div>
            </div>
            {/* 지금 울리는 코드를 밝게 표시 — 재생을 눈으로 따라갈 수 있게 */}
            <div aria-live="polite" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, justifyContent: "center", marginTop: 12 }}>
              {JAM_FORMS[jam.form].chords.map((ch, i) => {
                const rp = (keyPc + ch.deg) % 12;
                const on = i === jam.nowChord;
                return (<React.Fragment key={i}><span style={{
                  fontSize: 17, fontWeight: 800,
                  color: on ? C.bg : C.brass,
                  background: on ? C.brass : "transparent",
                  borderRadius: 7, padding: "2px 7px",
                  transition: "background .12s, color .12s",
                }}>{noteName(keyPc, rp)}{JAM_SYM[ch.type]}</span>{i < JAM_FORMS[jam.form].chords.length - 1 && <span style={{ color: C.dim, margin: "0 4px" }}>›</span>}</React.Fragment>);
              })}
            </div>
            {/* 지금 코드의 드롭2 보이싱 — 가이드톤(3·7음)은 금색 */}
            {nowVoicing && (
              <div style={{ marginTop: 10, background: C.bg, borderRadius: 12, padding: "10px 8px 8px" }}>
                <div style={{ ...SEGLABEL, textAlign: "center", marginBottom: 4 }}>
                  {jam.playing ? "지금 치는 보이싱" : "첫 코드 보이싱"}
                </div>
                <JamVoicing voicing={nowVoicing} rootPC={nowRootPC} type={nowType} keyPC={keyPc} />
                <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 6, flexWrap: "wrap", fontSize: 11.5, color: C.muted }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 999, background: C.brass, display: "inline-block" }} />가이드톤 (3·7음)
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 11, height: 11, borderRadius: 999, background: C.hub, border: `1.5px solid ${C.teal}`, display: "inline-block" }} />나머지
                  </span>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...SEGLABEL, marginBottom: 5, textAlign: "center" }}>리듬</div>
                <VWheel label="컴핑 리듬" items={COMP_RHYTHMS.map((r) => r.name)} value={jam.rhythm} onChange={(i) => jam.setRhythm(i)} size={13} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...SEGLABEL, marginBottom: 5, textAlign: "center" }}>음색</div>
                <VWheel label="음색" items={["클린", "일렉", "로즈", "비브라폰", "오르간"]} value={["acoustic", "electric", "rhodes", "vibes", "organ"].indexOf(jam.tone)} onChange={(i) => jam.setTone(["acoustic", "electric", "rhodes", "vibes", "organ"][i])} size={13} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...SEGLABEL, marginBottom: 5, textAlign: "center" }}>드럼</div>
                <VWheel label="드럼" items={DRUM_FEELS.map((f) => f.name)} value={jam.drumFeel} onChange={(i) => jam.setDrumFeel(i)} size={13} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => jam.setPlaying(!jam.playing)} aria-pressed={jam.playing} aria-label={jam.playing ? "잼 정지" : "잼 시작"} style={{ padding: "9px 24px", borderRadius: 999, cursor: "pointer", fontSize: 14, fontWeight: 800, background: jam.playing ? C.brass : "transparent", color: jam.playing ? C.bg : C.brass, border: `1px solid ${C.brass}` }}>{jam.playing ? "■ 정지" : "▶ 잼 시작"}</button>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: C.muted }}>BPM</span><input type="range" min="60" max="200" value={jam.bpm} onChange={(e) => jam.setBpm(+e.target.value)} aria-label="빠르기 BPM" style={{ width: 110, accentColor: C.brass }} /><span style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, fontWeight: 700, color: C.text, minWidth: 30 }}>{jam.bpm}</span></div>
            </div>
          </div>
        </div>
      )}
      {/* 아이폰 무음 스위치 등으로 소리가 안 날 때만 뜨는 한 줄 안내 */}
      {jam.audioHint && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 108, zIndex: 53, background: C.roseBg, color: C.roseText }}>
          <div style={{ maxWidth: 440, margin: "0 auto", padding: "6px 14px", fontSize: 11.5, textAlign: "center", boxSizing: "border-box" }}>{jam.audioHint}</div>
        </div>
      )}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 62, height: 46, zIndex: 52, background: C.panel }}>
        <div onClick={() => setOpen((o) => !o)} role="button" tabIndex={0} aria-expanded={open} aria-label="잼 설정 열기" onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((o) => !o); } }} style={{ maxWidth: 440, margin: "0 auto", height: "100%", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", cursor: "pointer", boxSizing: "border-box" }}>
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, background: jam.playing ? C.teal : C.dim, display: "inline-block", flexShrink: 0 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.12em", color: C.dim, textTransform: "uppercase" }}>251 잼 세션</div>
            <div style={{ fontSize: 13, color: jam.playing ? C.text : C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{keyName} · {formName}</div>
          </div>
          <span style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
            <button onClick={(e) => { e.stopPropagation(); jam.setPlaying(!jam.playing); }} aria-pressed={jam.playing} aria-label={jam.playing ? "잼 정지" : "잼 시작"} style={{ width: 32, height: 32, borderRadius: 999, border: `1px solid ${C.brass}`, background: jam.playing ? C.brass : "transparent", color: jam.playing ? C.bg : C.brass, cursor: "pointer", fontSize: 12, fontWeight: 800 }}>{jam.playing ? "■" : "▶"}</button>
            <span style={{ color: C.dim, fontSize: 13 }}>{open ? "▾" : "▴"}</span>
          </span>
        </div>
      </div>
    </>
  );
}

export default JamBar;
