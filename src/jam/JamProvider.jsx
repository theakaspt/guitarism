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
  // 지금 울리고 있는 코드 번호와 그 보이싱 (Phase 2: 재생 시각 피드백 + 보이싱 보기)
  // 스케줄러가 60fps로 화면을 다시 그리면 안 되므로, "코드가 바뀌는 순간"에만 알린다.
  const [nowChord, setNowChord] = useState(0);
  const [voicings, setVoicings] = useState(() => []);
  const jamRef = useRef({ timer: null, idx: 0, loopStart: 0, timeline: [], loopBeats: 0 });
  const lookRef = useRef(LOOKAHEAD_VISIBLE);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  // ── 재생 시작: 아이폰 소리 장치가 깨어난 것을 확인한 뒤에 시작한다 ──
  const setPlaying = useCallback((next) => {
    if (!next) { setPlayingRaw(false); setAudioHint(null); return; }
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
    st.timeline = timeline; st.loopBeats = loopBeats; st.idx = 0; st.loopStart = c.currentTime + 0.15;
    st.lastCi = -1; st.uiTimers = [];

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
      }
    };

    const pump = () => {
      const beatDur = 60 / bpmRef.current;
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
            strumAt(evt.midis, t, (evt.durBeats || 1) * beatDur, 0.012, toneRef.current);
            // 코드가 바뀌는 순간에만 화면에 알린다 (마디당 한 번 정도 → 리렌더 부담 없음)
            if (evt.ci !== st.lastCi) {
              st.lastCi = evt.ci;
              const ci = evt.ci;
              const delay = Math.max(0, (t - c.currentTime) * 1000);
              st.uiTimers.push(setTimeout(() => setNowChord(ci), delay));
            }
          }
          st.idx++;
          if (st.idx >= st.timeline.length) { st.idx = 0; st.loopStart += st.loopBeats * beatDur; }
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

  const value = { playing, setPlaying, keyIdx, setKeyIdx, form, setForm, rhythm, setRhythm, tone: toneP, setTone, drumFeel, setDrumFeel, bpm, setBpm, audioHint, nowChord, voicings };
  return <JamCtx.Provider value={value}>{children}</JamCtx.Provider>;
}
