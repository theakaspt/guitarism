
// ── 소리 엔진 (Web Audio, 외부 의존성 없음) ──
export let _ac = null;
export function AC() {
  if (!_ac) { try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (_ac && _ac.state === "suspended") _ac.resume();
  return _ac;
}

// 아이폰은 "사용자가 버튼을 누른 그 순간"에만 소리 장치를 깨워 준다.
// AC()의 resume()은 결과를 기다리지 않아서, 첫 재생 때 아직 안 깨어난 상태로 예약이 나갈 수 있다.
// 재생 버튼처럼 소리를 시작하는 자리에서는 이 함수로 "깨어남 완료"를 기다린 뒤 진행한다.
// 반환: 깨어난 오디오 장치. 못 깨웠으면 state가 "running"이 아닌 채로 돌아온다(안내 문구용).
export async function ensureAudio() {
  const c = AC();
  if (!c) return null;
  if (c.state !== "running") {
    try { await c.resume(); } catch (e) {}
  }
  return c;
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
