import { AC } from "./context.js";
import { tone } from "./tones.js";

export function strum(midis, dur = 1.5, stagger = 0.03, preset = "electric") {
  const c = AC(); if (!c) return; const t = c.currentTime + 0.03;
  midis.forEach((m, i) => tone(c, m, t + i * stagger, dur, preset));
}
export function melody(midis, step = 0.32, dur = 0.36, preset = "electric") {
  const c = AC(); if (!c) return; const t = c.currentTime + 0.03;
  midis.forEach((m, i) => tone(c, m, t + i * step, dur, preset));
}
export function sequence(chords, chordDur = 0.66, preset = "electric") {
  const c = AC(); if (!c) return; let t = c.currentTime + 0.03;
  chords.forEach((ch) => { ch.forEach((m, i) => tone(c, m, t + i * 0.02, chordDur * 0.92, preset)); t += chordDur; });
}

export function strumAt(midis, t0, dur = 0.95, stagger = 0.012, preset = "electric") {
  const c = AC(); if (!c) return;
  midis.forEach((m, i) => tone(c, m, t0 + i * stagger, dur, preset));
}
