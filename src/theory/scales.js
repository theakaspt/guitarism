import { OPEN_MIDI } from "./notes.js";


// ── 스케일 (도수 라벨 deg + 간격 iv) ──
export const SCALES = [
  { name: "메이저", notes: [{ iv: 0, deg: "R" }, { iv: 2, deg: "2" }, { iv: 4, deg: "3" }, { iv: 5, deg: "4" }, { iv: 7, deg: "5" }, { iv: 9, deg: "6" }, { iv: 11, deg: "7" }] },
  { name: "내추럴 마이너", notes: [{ iv: 0, deg: "R" }, { iv: 2, deg: "2" }, { iv: 3, deg: "♭3" }, { iv: 5, deg: "4" }, { iv: 7, deg: "5" }, { iv: 8, deg: "♭6" }, { iv: 10, deg: "♭7" }] },
  { name: "메이저 펜타토닉", notes: [{ iv: 0, deg: "R" }, { iv: 2, deg: "2" }, { iv: 4, deg: "3" }, { iv: 7, deg: "5" }, { iv: 9, deg: "6" }] },
  { name: "마이너 펜타토닉", notes: [{ iv: 0, deg: "R" }, { iv: 3, deg: "♭3" }, { iv: 5, deg: "4" }, { iv: 7, deg: "5" }, { iv: 10, deg: "♭7" }] },
  { name: "메이저 블루스", notes: [{ iv: 0, deg: "R" }, { iv: 2, deg: "2" }, { iv: 3, deg: "♭3" }, { iv: 4, deg: "3" }, { iv: 7, deg: "5" }, { iv: 9, deg: "6" }] },
  { name: "마이너 블루스", notes: [{ iv: 0, deg: "R" }, { iv: 3, deg: "♭3" }, { iv: 5, deg: "4" }, { iv: 6, deg: "♭5" }, { iv: 7, deg: "5" }, { iv: 10, deg: "♭7" }] },
  { name: "하모닉 마이너", notes: [{ iv: 0, deg: "R" }, { iv: 2, deg: "2" }, { iv: 3, deg: "♭3" }, { iv: 5, deg: "4" }, { iv: 7, deg: "5" }, { iv: 8, deg: "♭6" }, { iv: 11, deg: "7" }] },
  { name: "멜로딕 마이너", notes: [{ iv: 0, deg: "R" }, { iv: 2, deg: "2" }, { iv: 3, deg: "♭3" }, { iv: 5, deg: "4" }, { iv: 7, deg: "5" }, { iv: 9, deg: "6" }, { iv: 11, deg: "7" }] },
  { name: "도리안", notes: [{ iv: 0, deg: "R" }, { iv: 2, deg: "2" }, { iv: 3, deg: "♭3" }, { iv: 5, deg: "4" }, { iv: 7, deg: "5" }, { iv: 9, deg: "6" }, { iv: 10, deg: "♭7" }] },
  { name: "믹솔리디안", notes: [{ iv: 0, deg: "R" }, { iv: 2, deg: "2" }, { iv: 4, deg: "3" }, { iv: 5, deg: "4" }, { iv: 7, deg: "5" }, { iv: 9, deg: "6" }, { iv: 10, deg: "♭7" }] },
  { name: "리디안", notes: [{ iv: 0, deg: "R" }, { iv: 2, deg: "2" }, { iv: 4, deg: "3" }, { iv: 6, deg: "♯4" }, { iv: 7, deg: "5" }, { iv: 9, deg: "6" }, { iv: 11, deg: "7" }] },
  { name: "프리지안", notes: [{ iv: 0, deg: "R" }, { iv: 1, deg: "♭2" }, { iv: 3, deg: "♭3" }, { iv: 5, deg: "4" }, { iv: 7, deg: "5" }, { iv: 8, deg: "♭6" }, { iv: 10, deg: "♭7" }] },
  { name: "로크리안", notes: [{ iv: 0, deg: "R" }, { iv: 1, deg: "♭2" }, { iv: 3, deg: "♭3" }, { iv: 5, deg: "4" }, { iv: 6, deg: "♭5" }, { iv: 8, deg: "♭6" }, { iv: 10, deg: "♭7" }] },
];

// ══════════════════════════════════════════════════════
//  아래 4개는 원본 `Scales` 컴포넌트 안에 있던 클로저를 본문 그대로 옮긴 것.
//  값·수식은 동일하고, 클로저로 읽던 변수(root / ivset / N)만 인자로 받는다.
//  (분할 후 테스트에서 직접 검증하기 위해 순수 함수로 뺐다 — 결과 동일함을 전수 대조로 확인)
// ══════════════════════════════════════════════════════
export const scaleIvSet = (scale) => new Set(scale.notes.map((n) => n.iv));

// 원본: const inS = (a) => ivset.has((((a % 12) - root) % 12 + 12) % 12);
export const inScale = (root, ivset, a) => ivset.has((((a % 12) - root) % 12 + 12) % 12);

// 원본: const e6 = (root - 4 + 12) % 12;  +  const cagedPos = [...]
export function cagedPositions(root) {
  const e6 = (root - 4 + 12) % 12;
  return [["C", 4], ["A", 7], ["G", 9], ["E", 11], ["D", 2]].map(([sh, off]) => ({ start: (e6 + off) % 12, label: sh + "폼" })).sort((a, b) => a.start - b.start);
}

// 원본: const build3nps = (f0) => { ... }
export function build3nps(root, ivset, f0) {
  const inScale = (abs) => ivset.has((((abs % 12) - root) % 12 + 12) % 12);
  for (const bump of [0, 12]) {
    let c = 40 + f0 + bump;
    const notes = [c];
    while (notes.length < 18) { c++; if (inScale(c)) notes.push(c); }
    const keys = new Set(); let ok = true;
    for (let k = 0; k < 18; k++) {
      const strg = Math.floor(k / 3), fr = notes[k] - OPEN_MIDI[strg];
      if (fr < 0 || fr > 17) { ok = false; break; }
      keys.add(strg + "-" + fr);
    }
    if (ok) return keys;
  }
  return new Set();
}

// 대각선: 루트에서 시작, 줄당 배치를 스케일에 맞춰 자동 계산(펜타=2·3, 7음=3·4), 옥타브마다 넥 위로
// 원본: const diagFrom = (s0, f0) => { ... }  (N = scale.notes.length)
export function diagFrom(root, ivset, N, s0, f0) {
  const inS = (a) => inScale(root, ivset, a);
  const per = Math.floor(N / 2);
  const strings = []; for (let s = s0; s < 6; s++) strings.push(s);
  const counts = strings.map((_, i) => (i % 2 === 0 ? per : N - per));
  const total = counts.reduce((a, b) => a + b, 0);
  let c = OPEN_MIDI[s0] + f0; const notes = [c];
  while (notes.length < total) { c++; if (inS(c)) notes.push(c); }
  const seq = []; let k = 0, ok = true;
  strings.forEach((s, idx) => { for (let n = 0; n < counts[idx]; n++) { const fr = notes[k] - OPEN_MIDI[s]; k++; if (fr < 0 || fr > 15) ok = false; seq.push({ key: s + "-" + fr, pitch: OPEN_MIDI[s] + fr }); } });
  return ok ? seq : null;
}
