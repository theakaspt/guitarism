import { master } from "./context.js";


// ── 신스 재즈 드럼 키트 (샘플 없이 Web Audio로) ──
export let _noise = null;
export function noiseBuf(c) {
  if (_noise) return _noise;
  const len = Math.round(c.sampleRate * 2);
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  _noise = b; return _noise;
}
export function noiseVoice(c, t0, { hp, bp, lp, dur, atk = 0.001, vel = 1, q = 1 }) {
  const src = c.createBufferSource(); src.buffer = noiseBuf(c); src.loop = true;
  let node = src;
  if (hp) { const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp; node.connect(f); node = f; }
  if (bp) { const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = bp; f.Q.value = q; node.connect(f); node = f; }
  if (lp) { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp; node.connect(f); node = f; }
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vel, t0 + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  node.connect(g); g.connect(master(c));
  src.start(t0, Math.random() * 1.4); src.stop(t0 + dur + 0.05);
}
export function drum(c, voice, t0, vel = 1) {
  if (!c) return;
  if (voice === "ride") {
    const ratios = [1, 1.34, 1.78, 2.32, 2.9], base = 520;
    ratios.forEach((r, i) => {
      const o = c.createOscillator(); o.type = "square"; o.frequency.value = base * r;
      const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3000;
      const g = c.createGain(); const amp = 0.09 * vel / (i + 1);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(amp, t0 + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.26);
      o.connect(hp); hp.connect(g); g.connect(master(c)); o.start(t0); o.stop(t0 + 0.3);
    });
    noiseVoice(c, t0, { hp: 6000, dur: 0.16, vel: 0.08 * vel });
  } else if (voice === "hat") {
    noiseVoice(c, t0, { hp: 8000, dur: 0.05, vel: 0.28 * vel });
  } else if (voice === "kick") {
    const o = c.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(82, t0); o.frequency.exponentialRampToValueAtTime(42, t0 + 0.12);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.85 * vel, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    o.connect(g); g.connect(master(c)); o.start(t0); o.stop(t0 + 0.26);
  } else if (voice === "rim") {
    const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = 380;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.7 * vel, t0 + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
    o.connect(g); g.connect(master(c)); o.start(t0); o.stop(t0 + 0.08);
    noiseVoice(c, t0, { bp: 2000, q: 2, dur: 0.05, vel: 0.19 * vel });
  } else if (voice === "brush") {
    noiseVoice(c, t0, { bp: 3200, q: 0.7, dur: 0.2, atk: 0.014, vel: 0.23 * vel });
  } else if (voice === "snare") {
    noiseVoice(c, t0, { hp: 1800, dur: 0.12, atk: 0.004, vel: 0.26 * vel });
  }
}
// 드럼 필 (b=박위치, v=보이스, vel=세기) · 스윙 뒷박 = x.66박 / 스트레이트 = x.5박
export const _sw = 2 / 3;
export const DRUM_FEELS = [
  { name: "스윙", hits: [
    { b: 0, v: "ride" }, { b: 1, v: "ride" }, { b: 1 + _sw, v: "ride", vel: 0.8 }, { b: 2, v: "ride" }, { b: 3, v: "ride" }, { b: 3 + _sw, v: "ride", vel: 0.8 },
    { b: 1, v: "hat" }, { b: 3, v: "hat" },
    { b: 0, v: "kick", vel: 0.32 }, { b: 2, v: "kick", vel: 0.32 },
  ] },
  { name: "브러쉬", hits: [
    { b: 0, v: "brush" }, { b: 1, v: "brush" }, { b: 1 + _sw, v: "brush", vel: 0.7 }, { b: 2, v: "brush" }, { b: 3, v: "brush" }, { b: 3 + _sw, v: "brush", vel: 0.7 },
    { b: 1, v: "hat", vel: 0.5 }, { b: 3, v: "hat", vel: 0.5 },
    { b: 0, v: "kick", vel: 0.22 },
  ] },
  { name: "보사노바", bars: 2, hits: [
    { b: 0, v: "rim" }, { b: 1.5, v: "rim" }, { b: 3, v: "rim" },
    { b: 5.5, v: "rim" }, { b: 6.5, v: "rim" },
    { b: 1, v: "hat", vel: 0.6 }, { b: 3, v: "hat", vel: 0.6 }, { b: 5, v: "hat", vel: 0.6 }, { b: 7, v: "hat", vel: 0.6 },
    { b: 0, v: "kick", vel: 0.5 }, { b: 1.5, v: "kick", vel: 0.35 }, { b: 2, v: "kick", vel: 0.5 }, { b: 3.5, v: "kick", vel: 0.35 },
    { b: 4, v: "kick", vel: 0.5 }, { b: 5.5, v: "kick", vel: 0.35 }, { b: 6, v: "kick", vel: 0.5 }, { b: 7.5, v: "kick", vel: 0.35 },
  ] },
  { name: "투 필", hits: [
    { b: 0, v: "ride" }, { b: 1, v: "ride" }, { b: 2, v: "ride" }, { b: 3, v: "ride" },
    { b: 1, v: "hat" }, { b: 3, v: "hat" },
    { b: 0, v: "kick", vel: 0.42 }, { b: 2, v: "kick", vel: 0.42 },
  ] },
  // 업템포(패스트) 스윙: 빠른 곡에선 라이드가 단순해지고(4분음 위주, 뒷박은 2·4박에만),
  // 하이햇이 2·4박을 또렷하게 잡고, 킥은 거의 안 밟음(아주 여린 페더링).
  { name: "업템포 스윙", hits: [
    { b: 0, v: "ride" }, { b: 1, v: "ride" }, { b: 2, v: "ride" }, { b: 3, v: "ride" },
    { b: 1 + _sw, v: "ride", vel: 0.55 }, { b: 3 + _sw, v: "ride", vel: 0.55 },
    { b: 1, v: "hat", vel: 1.0 }, { b: 3, v: "hat", vel: 1.0 },
    { b: 0, v: "kick", vel: 0.16 },
  ] },
  // 셔플(재즈 블루스): 모든 박에 셋잇단 뒷박을 또렷하게 → 굴러가는 느낌.
  // 2·4박 스네어 백비트 + 사이사이 고스트 노트.
  { name: "셔플", hits: [
    { b: 0, v: "ride" }, { b: 0 + _sw, v: "ride", vel: 0.75 },
    { b: 1, v: "ride" }, { b: 1 + _sw, v: "ride", vel: 0.75 },
    { b: 2, v: "ride" }, { b: 2 + _sw, v: "ride", vel: 0.75 },
    { b: 3, v: "ride" }, { b: 3 + _sw, v: "ride", vel: 0.75 },
    { b: 1, v: "snare", vel: 0.85 }, { b: 3, v: "snare", vel: 0.85 },
    { b: 0 + _sw, v: "snare", vel: 0.18 }, { b: 2 + _sw, v: "snare", vel: 0.18 },
    { b: 1, v: "hat", vel: 0.5 }, { b: 3, v: "hat", vel: 0.5 },
    { b: 0, v: "kick", vel: 0.45 }, { b: 2, v: "kick", vel: 0.38 },
  ] },
];
