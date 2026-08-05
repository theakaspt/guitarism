import React from "react";
import { C, SEGLABEL, FS, SP } from "../theme.js";
import { useJam } from "./JamProvider.jsx";
import { TRAINER_STEPS, TRAINER_LOOPS_PER_STEP } from "./JamProvider.jsx";

// 잼 시트 안의 "연습" 구역 (Phase A)
//  · 카운트인 — 시작 전 한 마디 세어 주기
//  · 기타 반주 끄기 — 드럼만 남으면 그게 메트로놈이다
//  · 템포 올리기 — 루프 두 바퀴마다 조금씩 빨라지기
export default function PracticePanel() {
  const jam = useJam();

  const rowStyle = { display: "flex", alignItems: "center", gap: SP.sm, minHeight: 36 };
  const nameStyle = { fontSize: FS.small, color: C.text, flex: 1, minWidth: 0 };
  const noteStyle = { fontSize: FS.label, color: C.dim, marginTop: 2 };

  // 켜고 끄는 스위치 (작은 알약 버튼)
  const Toggle = ({ on, onChange, label }) => (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      aria-label={label}
      style={{
        flexShrink: 0, width: 52, height: 30, borderRadius: 999, cursor: "pointer",
        background: on ? C.brass : C.hub,
        border: `1px solid ${on ? C.brass : C.ring}`,
        position: "relative", padding: 0,
      }}
    >
      <span aria-hidden="true" style={{
        position: "absolute", top: 3, left: on ? 25 : 3,
        width: 22, height: 22, borderRadius: 999,
        background: on ? C.bg : C.muted, transition: "left .14s",
      }} />
    </button>
  );

  const stepBtn = (v) => ({
    padding: "4px 12px", borderRadius: 999, cursor: "pointer",
    fontSize: FS.small, fontWeight: jam.trainerStep === v ? 800 : 600,
    background: jam.trainerStep === v ? C.brass : "transparent",
    color: jam.trainerStep === v ? C.bg : C.muted,
    border: "none",
  });

  return (
    <div style={{ marginTop: SP.md, background: C.bg, borderRadius: 12, padding: "12px 12px 8px" }}>
      <div style={{ ...SEGLABEL, marginBottom: SP.sm }}>연습</div>

      <div style={rowStyle}>
        <div style={nameStyle}>
          카운트인
          <div style={noteStyle}>시작 전 한 마디 세어 줍니다</div>
        </div>
        <Toggle on={jam.countIn} onChange={jam.setCountIn} label="카운트인" />
      </div>

      <div style={{ ...rowStyle, marginTop: SP.sm }}>
        <div style={nameStyle}>
          기타 반주
          <div style={noteStyle}>
            {jam.comping ? "끄면 드럼만 남아 메트로놈이 됩니다" : "드럼만 재생 중 · 코드는 눈으로 보며 직접 치세요"}
          </div>
        </div>
        <Toggle on={jam.comping} onChange={jam.setComping} label="기타 반주" />
      </div>

      <div style={{ ...rowStyle, marginTop: SP.sm }}>
        <div style={nameStyle}>
          템포 올리기
          <div style={noteStyle}>{TRAINER_LOOPS_PER_STEP}바퀴마다 조금씩 빨라집니다</div>
        </div>
        <Toggle on={jam.trainer} onChange={jam.setTrainer} label="템포 올리기" />
      </div>

      {jam.trainer && (
        <div style={{ marginTop: SP.sm, paddingTop: SP.sm, borderTop: `1px solid ${C.ring}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: SP.sm, flexWrap: "wrap" }}>
            <span style={{ fontSize: FS.small, color: C.muted }}>목표</span>
            <input
              type="range" min={Math.max(60, jam.bpm)} max="200" step="5"
              value={Math.max(jam.trainerTarget, jam.bpm)}
              onChange={(e) => jam.setTrainerTarget(+e.target.value)}
              aria-label="목표 빠르기 BPM"
              style={{ flex: 1, minWidth: 100, accentColor: C.brass }}
            />
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: FS.small, fontWeight: 700, color: C.text, minWidth: 32 }}>
              {Math.max(jam.trainerTarget, jam.bpm)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: SP.sm, marginTop: SP.sm }}>
            <span style={{ fontSize: FS.small, color: C.muted }}>증가폭</span>
            <div style={{ display: "inline-flex", background: C.hub, borderRadius: 999, padding: 2 }} role="group" aria-label="빠르기 증가폭">
              {TRAINER_STEPS.map((v) => (
                <button key={v} onClick={() => jam.setTrainerStep(v)} aria-pressed={jam.trainerStep === v} style={stepBtn(v)}>+{v}</button>
              ))}
            </div>
            <span aria-live="polite" style={{ marginLeft: "auto", fontSize: FS.small, color: jam.trainerDone ? C.tealText : C.muted }}>
              {jam.trainerDone
                ? `목표 도달 · ${jam.bpm}`
                : jam.playing ? `${jam.bpm} → ${Math.max(jam.trainerTarget, jam.bpm)}` : "재생하면 시작"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
