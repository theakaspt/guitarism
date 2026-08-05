import { master, reverb } from "./context.js";

// ── 음색 프리셋 (카플러스-스트롱: 가상 줄 튕김 물리 모델) ──
//  a        : 루프 밝기(0.5=가장 어둡게 감쇠 … 1에 가까울수록 밝고 길게). 고음현이 빨리 죽는 자연스러움 유지.
//  decay    : 샘플당 감쇠(1에 가까울수록 길게 울림)
//  soft     : 튕긴 순간(잡음)을 몇 번 부드럽게 깎을지 → 어택 뭉근함
//  bodyMix  : 기음(펀더멘털) 사인을 섞어 몸통감(둥근 저역) 부여
//  gain     : 노트당 출력 크기
//  lp       : 출력 로우패스 컷오프(Hz) — 낮을수록 프론트픽업처럼 "쨍" 덜하고 둥글게
//  a=루프 밝기 · decay=울림 길이 · soft=어택 뭉근함 · bodyMix=기음 섞기 · gain=크기 · lp=고음 롤오프
//  body=바디 공명(통울림) · detune=더블 스트링 디튠(센트) · rev=리버브 센드량
//  amp=앰프/픽업 체인(일렉): 픽업 콤필터 + 진공관 새츄레이션 + 캐비닛
export const PRESETS = {
  // 표시 이름은 "클린". 소리가 진짜 통기타 같지는 않다는 평이 있어(보고서2 §7),
  // 어쿠스틱이라고 약속하지 않는 이름으로 바꿨다. 내부 키(acoustic)는 저장값 호환을 위해 그대로 둔다.
  acoustic: { label: "클린", a: 0.58, decay: 0.9996, soft: 2, bodyMix: 0.08, gain: 0.24, lp: 4200, body: 1, detune: 7, rev: 0.30, amp: 0 },
  // 재즈 아치탑: 줄 배음을 살리고(bodyMix↓, lp↑), 넥픽업 + 진공관 클린 + 캐비닛으로 따뜻하고 둥글게
  electric: { label: "일렉",     a: 0.62, decay: 0.9994, soft: 1, bodyMix: 0.02, gain: 0.10, lp: 5200, body: 0, detune: 0, rev: 0.20, amp: 1 },
};
export const _ksCache = new Map(); // key: preset+":"+midi+":"+sampleRate → AudioBuffer

// 목표 주파수의 줄을 튕겨 2.4초짜리 파형을 만들어 캐시(같은 음 재사용).
export function ksBuffer(c, midi, presetKey) {
  const p = PRESETS[presetKey] || PRESETS.acoustic;
  const sr = c.sampleRate;
  const key = presetKey + ":" + midi + ":" + sr;
  const hit = _ksCache.get(key);
  if (hit) return hit;

  const f = 440 * Math.pow(2, (midi - 69) / 12);
  const period = sr / f;                 // 소수 포함(정확한 음정)
  const L = Math.floor(period) + 2;      // 링버퍼 길이(보간 여유 +2)
  const line = new Float32Array(L);

  // 튕김: 잡음으로 줄을 채움
  for (let i = 0; i < L; i++) line[i] = Math.random() * 2 - 1;
  // 어택을 부드럽게(나일론 등): 인접 평균으로 여러 번 깎기
  for (let s = 0; s < p.soft; s++) {
    let prev = line[L - 1];
    for (let i = 0; i < L; i++) { const cur = line[i]; line[i] = 0.5 * (cur + prev); prev = cur; }
  }
  // 몸통감: 기음 사인을 소량 더함(둥근 저역)
  if (p.bodyMix > 0) for (let i = 0; i < L; i++) line[i] += p.bodyMix * Math.sin((2 * Math.PI * i) / period);

  const total = Math.max(1, Math.round(sr * 2.4));
  const buf = c.createBuffer(1, total, sr);
  const out = buf.getChannelData(0);

  // 카플러스-스트롱 루프: 소수 지연은 선형보간으로 정확히 읽음.
  // 루프 필터는 FIR 1-zero(위상지연 ≈ 1-a 샘플) → readDelay에서 그만큼 빼 음정 보정.
  let w = 0;                            // 쓰기 위치
  const readDelay = period - (1 - p.a); // 필터 위상지연 상쇄
  let prevIn = 0, peak = 1e-9;
  for (let n = 0; n < total; n++) {
    const rp = w - readDelay;                       // 읽을 위치(소수)
    let ri = Math.floor(rp); const fr = rp - ri;    // 정수부/소수부
    let i0 = ((ri % L) + L) % L, i1 = ((ri + 1) % L + L) % L;
    const sample = line[i0] * (1 - fr) + line[i1] * fr;  // 보간 읽기
    const damped = p.a * sample + (1 - p.a) * prevIn;    // 루프 로우패스(밝기)
    prevIn = sample;
    const y = damped * p.decay;
    line[((w % L) + L) % L] = y;                    // 되먹임
    out[n] = y;
    const av = Math.abs(y); if (av > peak) peak = av;
    w++;
  }
  // 정규화(피크 기준) 후 프리셋 출력 게인 반영
  const norm = (0.9 / peak) * p.gain;
  for (let n = 0; n < total; n++) out[n] *= norm;

  _ksCache.set(key, buf);
  return buf;
}

// 시그니처 유지 + 음색 인자(preset). 기본값 electric(코드 듣기·스케일·진행 = 일렉 통일).
// 펜더 로즈풍 일렉트릭 피아노: FM 합성(사인 캐리어 + 종소리 배음) + 부드러운 트레몰로
export function rhodesTone(c, midi, t0, dur) {
  const f = 440 * Math.pow(2, (midi - 69) / 12);
  const rel = Math.max(t0 + 0.1, t0 + dur);
  const end = rel + 0.35;

  const car = c.createOscillator(); car.type = "sine"; car.frequency.value = f;
  const carG = c.createGain();

  // 모듈레이터(2:1) — 어택에 종소리 배음, 빠르게 감쇠.
  // 깊이는 캐리어 주파수(f)의 85% 이하로 제한 → 순간 주파수가 음수로 접히지 않음(지저분한 배음 방지).
  const mod = c.createOscillator(); mod.type = "sine"; mod.frequency.value = f * 2;
  const modG = c.createGain();
  const peak = f * 0.85;
  modG.gain.setValueAtTime(peak, t0);
  modG.gain.exponentialRampToValueAtTime(peak * 0.08, t0 + 0.16);
  modG.gain.exponentialRampToValueAtTime(peak * 0.01, t0 + 0.9);
  mod.connect(modG); modG.connect(car.frequency);

  // 앰프 엔벨로프: 어택 → 감쇠 → 릴리스. 값 점프 없이 이어지게(클릭 노이즈 방지).
  const A = 0.22;
  carG.gain.setValueAtTime(0.0001, t0);
  carG.gain.exponentialRampToValueAtTime(A, t0 + 0.008);
  carG.gain.exponentialRampToValueAtTime(A * 0.42, rel);   // 릴리스 시점까지 자연 감쇠(연속)
  carG.gain.exponentialRampToValueAtTime(0.0001, end);     // 이어서 소멸

  // 트레몰로: 신호 게인이 아니라 별도 노드에서 얕게(0.88~1.0)
  const trem = c.createGain(); trem.gain.value = 0.94;
  const lfo = c.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 4.2;
  const lfoG = c.createGain(); lfoG.gain.value = 0.06;
  lfo.connect(lfoG); lfoG.connect(trem.gain);

  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2600; lp.Q.value = 0.4;
  car.connect(carG); carG.connect(trem); trem.connect(lp);
  lp.connect(master(c)); lp.connect(reverb(c).send);

  car.start(t0); mod.start(t0); lfo.start(t0);
  car.stop(end + 0.05); mod.stop(end + 0.05); lfo.stop(end + 0.05);
}
// 비브라폰: 사인 기음 + 금속 배음(4·9.2배) + 모터 트레몰로. 어택은 말렛 타격감.
export function vibesTone(c, midi, t0, dur) {
  const f = 440 * Math.pow(2, (midi - 69) / 12);
  const rel = Math.max(t0 + 0.12, t0 + dur);
  const end = rel + 0.5;
  const trem = c.createGain(); trem.gain.value = 0.9;
  const lfo = c.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 5.2; // 모터
  const lfoG = c.createGain(); lfoG.gain.value = 0.13;
  lfo.connect(lfoG); lfoG.connect(trem.gain);
  // 부분음: 기음 + 금속 배음(비주기적 비율이 금속 특유의 질감)
  [[1, 0.21, 1.0], [4.0, 0.06, 0.35], [9.2, 0.022, 0.18]].forEach(([mult, amp, decayScale]) => {
    const o = c.createOscillator(); o.type = "sine"; o.frequency.value = f * mult;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(amp, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(amp * 0.25 * decayScale, rel);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    o.connect(g); g.connect(trem);
    o.start(t0); o.stop(end + 0.05);
  });
  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 5000; lp.Q.value = 0.4;
  trem.connect(lp); lp.connect(master(c)); lp.connect(reverb(c).send);
  lfo.start(t0); lfo.stop(end + 0.05);
}
// 재즈 오르간(해먼드): 드로바 = 여러 사인 배음을 정해진 비율로 겹침 + 퍼커션 클릭 + 살짝 코러스
export function organTone(c, midi, t0, dur) {
  const f = 440 * Math.pow(2, (midi - 69) / 12);
  const rel = Math.max(t0 + 0.08, t0 + dur);
  const end = rel + 0.07; // 오르간은 릴리스가 짧음(건반 떼면 바로 끊김)
  const bus = c.createGain();
  bus.gain.setValueAtTime(0.0001, t0);
  bus.gain.linearRampToValueAtTime(1, t0 + 0.012);   // 오르간은 서스테인형(감쇠 없음)
  bus.gain.setValueAtTime(1, rel);
  bus.gain.exponentialRampToValueAtTime(0.0001, end);
  // 드로바: 서브(0.5), 기음(1), 5도(1.5), 옥타브(2), 3옥타브(3), 4옥타브(4)
  [[0.5, 0.05], [1, 0.09], [1.5, 0.035], [2, 0.055], [3, 0.025], [4, 0.02]].forEach(([mult, amp]) => {
    const o = c.createOscillator(); o.type = "sine"; o.frequency.value = f * mult;
    const g = c.createGain(); g.gain.value = amp;
    o.connect(g); g.connect(bus);
    o.start(t0); o.stop(end + 0.05);
  });
  // 퍼커션 클릭(해먼드 특유의 어택)
  const pk = c.createOscillator(); pk.type = "sine"; pk.frequency.value = f * 4;
  const pkG = c.createGain();
  pkG.gain.setValueAtTime(0.0001, t0);
  pkG.gain.exponentialRampToValueAtTime(0.06, t0 + 0.005);
  pkG.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
  pk.connect(pkG); pkG.connect(bus);
  pk.start(t0); pk.stop(t0 + 0.25);
  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3400; lp.Q.value = 0.4;
  bus.connect(lp); lp.connect(master(c)); lp.connect(reverb(c).send);
}
// 진공관 클린의 미묘한 뭉개짐(부드러운 새츄레이션) 곡선 — 완전 선형이면 "신스"처럼 들림
export let _tubeCurve = null;
export function tubeCurve() {
  if (_tubeCurve) return _tubeCurve;
  const n = 2048, curve = new Float32Array(n);
  const k = 2.2; // 부드러운 정도(클수록 더 뭉갬)
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k); // 대칭 소프트 클립
  }
  _tubeCurve = curve;
  return curve;
}
export function tone(c, midi, t0, dur, presetKey = "electric") {
  if (presetKey === "rhodes") { rhodesTone(c, midi, t0, dur); return; }
  if (presetKey === "vibes") { vibesTone(c, midi, t0, dur); return; }
  if (presetKey === "organ") { organTone(c, midi, t0, dur); return; }
  const p = PRESETS[presetKey] || PRESETS.electric;
  const rel = Math.max(t0 + 0.05, t0 + dur);
  const stop = rel + 0.18;

  // 공용 앰프 엔벨로프 (값 점프 없이 연속 — 클릭 노이즈 방지)
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(1, t0 + 0.011);
  g.gain.setValueAtTime(1, rel);
  g.gain.exponentialRampToValueAtTime(0.0001, rel + 0.13);

  // 줄: 어쿠스틱은 살짝 디튠한 두 겹(더블 스트링) → 두께·코러스감
  const voices = p.detune ? [-p.detune / 2, p.detune / 2] : [0];
  voices.forEach((cents) => {
    const src = c.createBufferSource();
    src.buffer = ksBuffer(c, midi, presetKey);
    if (cents) src.detune.value = cents;
    const vg = c.createGain(); vg.gain.value = 1 / voices.length;
    src.connect(vg); vg.connect(g);
    src.start(t0); src.stop(stop);
  });

  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = p.lp; lp.Q.value = 0.5;
  g.connect(lp);

  const outBus = c.createGain(); outBus.gain.value = 1;

  if (p.amp) {
    // ── 일렉 체인: 픽업 → 진공관 → 캐비닛 ──
    // 1) 넥 픽업: 줄 길이의 약 1/4 지점을 읽음 → 짧은 딜레이를 섞어 콤 필터(특정 배음 감쇠)
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const pickup = c.createGain(); pickup.gain.value = 1;
    const dly = c.createDelay(0.02);
    dly.delayTime.value = Math.min(0.019, 1 / (4 * f)); // 넥 픽업 위치
    const dlyG = c.createGain(); dlyG.gain.value = -0.55; // 역위상 → 특정 배음 상쇄
    lp.connect(pickup);
    lp.connect(dly); dly.connect(dlyG); dlyG.connect(pickup);
    // 2) 진공관 새츄레이션 (드라이브 올려 넣고 다시 줄임)
    const pre = c.createGain(); pre.gain.value = 2.6;
    const shaper = c.createWaveShaper();
    shaper.curve = tubeCurve(); shaper.oversample = "4x";
    const post = c.createGain(); post.gain.value = 0.30;
    pickup.connect(pre); pre.connect(shaper); shaper.connect(post);
    // 3) 캐비닛: 중역 살짝 부풀리고(800Hz) 고역 롤오프(4.5kHz)
    const mid = c.createBiquadFilter(); mid.type = "peaking";
    mid.frequency.value = 800; mid.Q.value = 0.9; mid.gain.value = 1.5;
    const cab = c.createBiquadFilter(); cab.type = "lowpass";
    cab.frequency.value = 4500; cab.Q.value = 0.7;
    const warm = c.createBiquadFilter(); warm.type = "highshelf";
    warm.frequency.value = 3000; warm.gain.value = -6; // 재즈 톤: 고음 부드럽게
    post.connect(mid); mid.connect(cab); cab.connect(warm); warm.connect(outBus);
  } else {
    lp.connect(outBus);
    // 바디 공명: 통기타 울림통의 공명 피크(헬름홀츠 ~100Hz, 탑 ~200Hz, 중역 ~400Hz)
    if (p.body) {
      [[100, 4.5, 0.55], [205, 3.0, 0.35], [400, 2.2, 0.22]].forEach(([freq, q, amt]) => {
        const res = c.createBiquadFilter(); res.type = "bandpass";
        res.frequency.value = freq; res.Q.value = q;
        const bg = c.createGain(); bg.gain.value = amt * p.body;
        lp.connect(res); res.connect(bg); bg.connect(outBus);
      });
    }
  }

  outBus.connect(master(c));
  const rv = c.createGain(); rv.gain.value = p.rev == null ? 0.16 : p.rev;
  outBus.connect(rv); rv.connect(reverb(c).send);
}
