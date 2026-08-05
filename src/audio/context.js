
// ── 소리 엔진 (Web Audio, 외부 의존성 없음) ──
export let _ac = null;
export function AC() {
  if (!_ac) { try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (_ac && _ac.state === "suspended") _ac.resume();
  return _ac;
}

// ── 은은한 공간 울림(리버브): 합성 임펄스로 만든 마스터 버스(한 번만 생성) ──
// ── 마스터 버스: 모든 소리가 여기로 → 리미터 → 출력 (동시 타격 시 찌그러짐 방지) ──
export let _master = null;
export function master(c) {
  if (_master) return _master;
  const bus = c.createGain(); bus.gain.value = 0.9;
  const lim = c.createDynamicsCompressor();
  lim.threshold.value = -6;   // 이 위로는 눌러서
  lim.knee.value = 6;         // 부드럽게 진입
  lim.ratio.value = 12;       // 강하게 제한(리미터)
  lim.attack.value = 0.003;
  lim.release.value = 0.18;
  bus.connect(lim); lim.connect(c.destination);
  _master = bus;
  return _master;
}
export let _rev = null;
export function reverb(c) {
  if (_rev) return _rev;
  const len = Math.round(c.sampleRate * 1.7);
  const ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) { const t = i / len; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.6); }
  }
  const conv = c.createConvolver(); conv.buffer = ir;
  const preLp = c.createBiquadFilter(); preLp.type = "lowpass"; preLp.frequency.value = 3200; // 울림은 어둡게
  const send = c.createGain(); send.gain.value = 1;
  const wet = c.createGain(); wet.gain.value = 0.16; // 은은하게
  send.connect(preLp); preLp.connect(conv); conv.connect(wet); wet.connect(master(c));
  _rev = { send };
  return _rev;
}
