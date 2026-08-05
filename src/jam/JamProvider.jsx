import React, { useState, useRef, useEffect, useCallback } from "react";
import { KEY_PC, KEYS } from "../theory/notes.js";
import { JAM_FORMS, COMP_RHYTHMS, jamTimeline, voiceProgressionFull } from "../theory/jam.js";
import { AC, ensureAudio } from "../audio/context.js";
import { drum, DRUM_FEELS } from "../audio/drums.js";
import { strumAt } from "../audio/play.js";
import { useStored, intIn, oneOf } from "../storage.js";

export const JamCtx = React.createContext(null);
export const useJam = () => React.useContext(JamCtx);

// 소리를 미리 몇 초 앞까지 예약해 둘지.
//  · 화면을 보고 있을 때(0.15초): 키·리듬을 바꾸면 거의 즉시 반영된다.
//  · 화면이 가려졌을 때(1.5초): 브라우저가 타이머를 1초 이상으로 늦춰도 소리가 끊기지 않는다.
//    이때는 어차피 설정을 바꿀 수 없으니 반응 속도를 포기해도 손해가 없다.
export const LOOKAHEAD_VISIBLE = 0.15;
export const LOOKAHEAD_HIDDEN = 1.5;

const TONES = ["acoustic", "electric", "rhodes", "vibes", "organ"];

// ── 카운트인 (Phase A-1) ──────────────────────────────
// 밴드에서 드러머가 "원, 투, 쓰리, 포" 세어 주는 그 한 마디.
// 사이드스틱(rim) 소리를 쓰고 1박에만 힘을 준다. 새 음색은 만들지 않았다.
export const COUNT_IN_BEATS = 4;
export const COUNT_IN_VOICE = "rim";
export const countInHits = () =>
  Array.from({ length: COUNT_IN_BEATS }, (_, i) => ({ beat: i, vel: i === 0 ? 0.95 : 0.6 }));

// ── 템포 트레이너 (Phase A-3) ─────────────────────────
// 루프가 이만큼 돌 때마다 BPM을 한 단계 올린다.
export const TRAINER_LOOPS_PER_STEP = 2;
export const TRAINER_STEPS = [2, 5];

export function JamProvider({ children }) {
  const [playing, setPlayingRaw] = useState(false);
  // 저장 대상: 키·폼·리듬·음색·드럼·BPM. "재생 중이었는지"는 일부러 저장하지 않는다
  // (앱을 켜자마자 소리가 나면 놀라니까).
  const [keyIdx, setKeyIdx] = useStored("jam.key", 0, intIn(0, KEYS.length - 1));
  const [form, setForm] = useStored("jam.form", 0, intIn(0, JAM_FORMS.length - 1));
  const [rhythm, setRhythm] = useStored("jam.rhythm", 0, intIn(0, COMP_RHYTHMS.length - 1));
  const [toneP, setToneP] = useStored("jam.tone", "electric", oneOf(TONES));
  const toneRef = useRef(toneP);
  const setTone = useCallback((t) => { toneRef.current = t; setToneP(t); }, [setToneP]);
  const [drumFeel, setDrumFeel] = useStored("jam.drum", 0, intIn(0, DRUM_FEELS.length - 1));
  const [bpm, setBpm] = useStored("jam.bpm", 120, intIn(40, 300));
  const bpmRef = useRef(bpm);
  const [audioHint, setAudioHint] = useState(null);

  // ── 연습 도구 (Phase A) ──
  const [countIn, setCountIn] = useStored("jam.countIn", true, (v) => (typeof v === "boolean" ? v : undefined));
  const [comping, setComping] = useStored("jam.comping", true, (v) => (typeof v === "boolean" ? v : undefined));
  const [trainer, setTrainer] = useStored("jam.trainer", false, (v) => (typeof v === "boolean" ? v : undefined));
  const [trainerTarget, setTrainerTarget] = useStored("jam.trainerTarget", 160, intIn(40, 300));
  const [trainerStep, setTrainerStep] = useStored("jam.trainerStep", 5, intIn(1, 20));
  const [trainerDone, setTrainerDone] = useState(false);
  // 스케줄러 안에서 읽는 값들은 ref로 — 토글해도 반주가 끊기지 않게 한다
  const compingRef = useRef(comping);
  const trainerRef = useRef({ on: trainer, target: trainerTarget, step: trainerStep });
  const countInPendingRef = useRef(false); // "이번 시작에만" 카운트인
  const countInRef = useRef(countIn);
  useEffect(() => { compingRef.current = comping; }, [comping]);
  useEffect(() => { countInRef.current = countIn; }, [countIn]);
  useEffect(() => { trainerRef.current = { on: trainer, target: trainerTarget, step: trainerStep }; }, [trainer, trainerTarget, trainerStep]);

  // 지금 울리고 있는 코드 번호와 그 보이싱 (Phase 2: 재생 시각 피드백 + 보이싱 보기)
  // 스케줄러가 60fps로 화면을 다시 그리면 안 되므로, "코드가 바뀌는 순간"에만 알린다.
  const [nowChord, setNowChord] = useState(0);
  const [voicings, setVoicings] = useState(() => []);
  const jamRef = useRef({ timer: null, idx: 0, loopStart: 0, timeline: [], loopBeats: 0 });
  const lookRef = useRef(LOOKAHEAD_VISIBLE);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  // 사용자가 BPM을 직접 만지면 템포 트레이너는 해제한다 (수동 우선)
  const setBpmManual = useCallback((v) => {
    setBpm(v);
    setTrainer(false);
    setTrainerDone(false);
  }, [setBpm, setTrainer]);

  // ── 재생 시작: 아이폰 소리 장치가 깨어난 것을 확인한 뒤에 시작한다 ──
  const setPlaying = useCallback((next) => {
    if (!next) { setPlayingRaw(false); setAudioHint(null); return; }
    countInPendingRef.current = true; // 시작 버튼을 누른 이번 한 번만 카운트인
    setTrainerDone(false);
    ensureAudio().then((c) => {
      setPlayingRaw(true);
      if (!c || c.state !== "running") {
        setAudioHint("소리가 안 나면 무음 스위치를 확인하세요.");
      } else {
        setAudioHint(null);
        // 시작 직후 다시 한 번 확인 (재생을 걸었는데도 장치가 멈춰 있는 경우)
        setTimeout(() => {
          if (c.state !== "running") setAudioHint("소리가 안 나면 무음 스위치를 확인하세요.");
        }, 900);
      }
    });
  }, []);

  // ── 잼 스케줄러 (절대 규칙 5: 반드시 여기, JamProvider 안에 있어야 한다) ──
  useEffect(() => {
    if (!playing) return;
    const c = AC(); if (!c) { setPlayingRaw(false); return; }
    const { timeline, loopBeats, voicings: vs } = jamTimeline(JAM_FORMS[form], KEY_PC[keyIdx], COMP_RHYTHMS[rhythm], DRUM_FEELS[drumFeel]);
    const st = jamRef.current;
    const beatDur0 = 60 / bpmRef.current;

    // 카운트인: 반주 시작을 한 마디 뒤로 밀고, 그 자리에 스틱 소리를 따로 예약한다.
    // (jamTimeline 자체는 건드리지 않는다 → 반주 데이터는 카운트인과 무관하게 그대로다)
    const doCountIn = countInRef.current && countInPendingRef.current;
    countInPendingRef.current = false;
    const t0 = c.currentTime + 0.15;
    if (doCountIn) {
      for (const h of countInHits()) drum(c, COUNT_IN_VOICE, t0 + h.beat * beatDur0, h.vel);
    }

    st.timeline = timeline; st.loopBeats = loopBeats; st.idx = 0;
    st.loopStart = t0 + (doCountIn ? COUNT_IN_BEATS * beatDur0 : 0);
    st.lastCi = -1; st.uiTimers = []; st.loops = 0;

    // 타이머가 오래 멈춰 있었다면(화면 잠금·백그라운드) 이미 지나간 예약이 잔뜩 밀려 있다.
    // 그대로 내보내면 전부 "지금" 한꺼번에 터진다 → 지나간 것은 소리 없이 건너뛰고 박자만 맞춘다.
    const skipPast = (now, beatDur) => {
      let guard = 0;
      while (guard++ < 20000) {
        const evt = st.timeline[st.idx];
        const t = st.loopStart + evt.beat * beatDur;
        if (t >= now - 0.02) break;
        st.idx++;
        if (st.idx >= st.timeline.length) { st.idx = 0; st.loopStart += st.loopBeats * beatDur; }
        // 주의: 여기서 st.loops를 올리지 않는다 — 잠갔다 돌아왔을 때 템포가 확 뛰어 버린다
      }
    };

    // 루프 한 바퀴가 끝날 때만 부른다. 템포가 바뀌면 true를 돌려준다.
    // (마디 중간에 BPM이 바뀌면 박자가 늘어져 연습 도구로 못 쓴다 — 반드시 경계에서만)
    const onLoopEnd = () => {
      st.loops++;
      const tr = trainerRef.current;
      if (!tr.on) return false;
      if (st.loops % TRAINER_LOOPS_PER_STEP !== 0) return false;
      const cur = bpmRef.current;
      if (cur >= tr.target) return false;
      const next = Math.min(tr.target, cur + tr.step);
      bpmRef.current = next;          // 스케줄러는 즉시 반영
      setBpm(next);                   // 화면(슬라이더)도 갱신 — 루프당 한 번이라 부담 없음
      if (next >= tr.target) setTrainerDone(true);
      return true;
    };

    const pump = () => {
      let beatDur = 60 / bpmRef.current;
      const now = c.currentTime;
      skipPast(now, beatDur);
      const until = now + lookRef.current;
      let guard = 0;
      while (guard++ < 512) {
        const evt = st.timeline[st.idx];
        const t = st.loopStart + evt.beat * beatDur;
        if (t < until) {
          if (evt.drum) drum(c, evt.drum, t, evt.vel);
          else {
            // 컴핑 OFF(메트로놈 모드)면 소리는 내지 않지만 코드 표시는 계속 따라간다
            // — 눈으로 코드를 보며 본인이 직접 치는 게 이 모드의 사용법이기 때문이다.
            if (compingRef.current) {
              strumAt(evt.midis, t, (evt.durBeats || 1) * beatDur, 0.012, toneRef.current);
            }
            // 코드가 바뀌는 순간에만 화면에 알린다 (마디당 한 번 정도 → 리렌더 부담 없음)
            if (evt.ci !== st.lastCi) {
              st.lastCi = evt.ci;
              const ci = evt.ci;
              const delay = Math.max(0, (t - c.currentTime) * 1000);
              st.uiTimers.push(setTimeout(() => setNowChord(ci), delay));
            }
          }
          st.idx++;
          if (st.idx >= st.timeline.length) {
            st.idx = 0;
            st.loopStart += st.loopBeats * beatDur; // 방금 끝난 루프는 옛 템포로 계산
            if (onLoopEnd()) break;                 // 템포가 바뀌었으면 다음 회차부터 새 템포로
          }
        } else break;
      }
      // 이미 지나간 화면 알림 타이머는 버린다 (쌓이지 않게)
      if (st.uiTimers.length > 64) st.uiTimers = st.uiTimers.slice(-32);
    };

    setVoicings(vs);
    setNowChord(0);
    st.timer = setInterval(pump, 25);

    // 화면이 가려지는 순간 예약 창을 넓히고 곧바로 한 번 채운다.
    // (가려진 뒤에는 타이머가 늦춰지므로, 늦춰지기 전에 미리 넣어 둬야 한다.)
    const onVis = () => {
      const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
      lookRef.current = hidden ? LOOKAHEAD_HIDDEN : LOOKAHEAD_VISIBLE;
      pump();
    };
    if (typeof document !== "undefined") {
      onVis();
      document.addEventListener("visibilitychange", onVis);
    }

    return () => {
      clearInterval(st.timer); st.timer = null;
      (st.uiTimers || []).forEach(clearTimeout); st.uiTimers = [];
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVis);
      lookRef.current = LOOKAHEAD_VISIBLE;
    };
  }, [playing, keyIdx, form, rhythm, drumFeel]);

  // ── 재생 중에는 화면이 꺼지지 않게 (지원하는 기기에서만, 실패는 무시) ──
  useEffect(() => {
    if (!playing) return;
    let released = false;
    let lock = null;
    const acquire = async () => {
      try {
        if (typeof navigator === "undefined" || !navigator.wakeLock) return;
        if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
        const s = await navigator.wakeLock.request("screen");
        if (released) { try { s.release(); } catch (e) {} return; }
        lock = s;
      } catch (e) {
        // 지원하지 않거나 거부됨 — 그냥 넘어간다
      }
    };
    // 화면이 가려지면 브라우저가 알아서 풀어 버리므로, 돌아왔을 때 다시 잡는다
    const onVis = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible" && !lock) acquire();
    };
    acquire();
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVis);
    return () => {
      released = true;
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVis);
      if (lock) { try { lock.release(); } catch (e) {} lock = null; }
    };
  }, [playing]);

  // 멈춰 있을 때도 "첫 코드의 보이싱"을 보여 주기 위해 키·폼이 바뀌면 미리 계산해 둔다.
  useEffect(() => {
    if (playing) return; // 재생 중에는 스케줄러가 넣어 준 값을 쓴다
    setVoicings(voiceProgressionFull(JAM_FORMS[form], KEY_PC[keyIdx]));
    setNowChord(0);
  }, [playing, form, keyIdx]);

  const value = {
    playing, setPlaying, keyIdx, setKeyIdx, form, setForm, rhythm, setRhythm,
    tone: toneP, setTone, drumFeel, setDrumFeel, bpm, setBpm: setBpmManual,
    audioHint, nowChord, voicings,
    // 연습 도구
    countIn, setCountIn, comping, setComping,
    trainer, setTrainer, trainerTarget, setTrainerTarget, trainerStep, setTrainerStep, trainerDone,
  };
  return <JamCtx.Provider value={value}>{children}</JamCtx.Provider>;
}
