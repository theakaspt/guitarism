import React, { useState, useRef, useEffect, useCallback } from "react";
import { KEY_PC } from "../theory/notes.js";
import { JAM_FORMS, COMP_RHYTHMS, jamTimeline } from "../theory/jam.js";
import { AC } from "../audio/context.js";
import { drum, DRUM_FEELS } from "../audio/drums.js";
import { strumAt } from "../audio/play.js";

export const JamCtx = React.createContext(null);
export const useJam = () => React.useContext(JamCtx);
export function JamProvider({ children }) {
  const [playing, setPlaying] = useState(false);
  const [keyIdx, setKeyIdx] = useState(0);
  const [form, setForm] = useState(0);
  const [rhythm, setRhythm] = useState(0);
  const [toneP, setToneP] = useState("electric");
  const toneRef = useRef("electric");
  const setTone = useCallback((t) => { toneRef.current = t; setToneP(t); }, []);
  const [drumFeel, setDrumFeel] = useState(0);
  const [bpm, setBpm] = useState(120);
  const bpmRef = useRef(120);
  const jamRef = useRef({ timer: null, idx: 0, loopStart: 0, timeline: [], loopBeats: 0 });
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => {
    if (!playing) return;
    const c = AC(); if (!c) { setPlaying(false); return; }
    const { timeline, loopBeats } = jamTimeline(JAM_FORMS[form], KEY_PC[keyIdx], COMP_RHYTHMS[rhythm], DRUM_FEELS[drumFeel]);
    const st = jamRef.current;
    st.timeline = timeline; st.loopBeats = loopBeats; st.idx = 0; st.loopStart = c.currentTime + 0.15;
    st.timer = setInterval(() => {
      const beatDur = 60 / bpmRef.current;
      let guard = 0;
      while (guard++ < 96) {
        const evt = st.timeline[st.idx];
        const t = st.loopStart + evt.beat * beatDur;
        if (t < c.currentTime + 0.15) {
          if (evt.drum) drum(c, evt.drum, t, evt.vel);
          else strumAt(evt.midis, t, (evt.durBeats || 1) * beatDur, 0.012, toneRef.current);
          st.idx++;
          if (st.idx >= st.timeline.length) { st.idx = 0; st.loopStart += st.loopBeats * beatDur; }
        } else break;
      }
    }, 25);
    return () => { clearInterval(st.timer); st.timer = null; };
  }, [playing, keyIdx, form, rhythm, drumFeel]);
  const value = { playing, setPlaying, keyIdx, setKeyIdx, form, setForm, rhythm, setRhythm, tone: toneP, setTone, drumFeel, setDrumFeel, bpm, setBpm };
  return <JamCtx.Provider value={value}>{children}</JamCtx.Provider>;
}
