
// ══════════════════════════════════════════════════════
//  공통 음악 데이터
// ══════════════════════════════════════════════════════
export const OPEN_PC = [4, 9, 2, 7, 11, 4]; // 6번줄(E)→1번줄(E) 개방현 음
export const SHARP_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
export const FLAT_NAMES  = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
export const FLAT_ROOTS = new Set([5, 10, 3, 8, 1]); // F, B♭, E♭, A♭, D♭
export const noteName = (rootPC, pc) => (FLAT_ROOTS.has(rootPC) ? FLAT_NAMES : SHARP_NAMES)[pc];
// 루트 표기(관례): F♯만 ♯, 나머지 변화음(D♭·E♭·A♭·B♭)은 ♭. 디코더 5도권의 키 표기와 동일하게 통일.
// → C, D♭, D, E♭, E, F, F♯, G, A♭, A, B♭, B (5도권 키 표기와 일치)
export const ROOTS = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

// ── 5도권 (디코더) ──
export const KEYS = [
  { short: "C",  name: "C",       sig: { n: 0, t: "none",  notes: [] },
    chords: [["I","C","maj"],["ii","Dm","min"],["iii","Em","min"],["IV","F","maj"],["V","G","maj"],["vi","Am","min"],["vii°","B°","dim"]], rel: "Am" },
  { short: "G",  name: "G",       sig: { n: 1, t: "sharp", notes: ["F♯"] },
    chords: [["I","G","maj"],["ii","Am","min"],["iii","Bm","min"],["IV","C","maj"],["V","D","maj"],["vi","Em","min"],["vii°","F♯°","dim"]], rel: "Em" },
  { short: "D",  name: "D",       sig: { n: 2, t: "sharp", notes: ["F♯","C♯"] },
    chords: [["I","D","maj"],["ii","Em","min"],["iii","F♯m","min"],["IV","G","maj"],["V","A","maj"],["vi","Bm","min"],["vii°","C♯°","dim"]], rel: "Bm" },
  { short: "A",  name: "A",       sig: { n: 3, t: "sharp", notes: ["F♯","C♯","G♯"] },
    chords: [["I","A","maj"],["ii","Bm","min"],["iii","C♯m","min"],["IV","D","maj"],["V","E","maj"],["vi","F♯m","min"],["vii°","G♯°","dim"]], rel: "F♯m" },
  { short: "E",  name: "E",       sig: { n: 4, t: "sharp", notes: ["F♯","C♯","G♯","D♯"] },
    chords: [["I","E","maj"],["ii","F♯m","min"],["iii","G♯m","min"],["IV","A","maj"],["V","B","maj"],["vi","C♯m","min"],["vii°","D♯°","dim"]], rel: "C♯m" },
  { short: "B",  name: "B",       sig: { n: 5, t: "sharp", notes: ["F♯","C♯","G♯","D♯","A♯"] },
    chords: [["I","B","maj"],["ii","C♯m","min"],["iii","D♯m","min"],["IV","E","maj"],["V","F♯","maj"],["vi","G♯m","min"],["vii°","A♯°","dim"]], rel: "G♯m" },
  { short: "F♯", name: "F♯ / G♭", sig: { n: 6, t: "sharp", notes: ["F♯","C♯","G♯","D♯","A♯","E♯"] },
    chords: [["I","F♯","maj"],["ii","G♯m","min"],["iii","A♯m","min"],["IV","B","maj"],["V","C♯","maj"],["vi","D♯m","min"],["vii°","E♯°","dim"]], rel: "D♯m" },
  { short: "D♭", name: "D♭",      sig: { n: 5, t: "flat",  notes: ["B♭","E♭","A♭","D♭","G♭"] },
    chords: [["I","D♭","maj"],["ii","E♭m","min"],["iii","Fm","min"],["IV","G♭","maj"],["V","A♭","maj"],["vi","B♭m","min"],["vii°","C°","dim"]], rel: "B♭m" },
  { short: "A♭", name: "A♭",      sig: { n: 4, t: "flat",  notes: ["B♭","E♭","A♭","D♭"] },
    chords: [["I","A♭","maj"],["ii","B♭m","min"],["iii","Cm","min"],["IV","D♭","maj"],["V","E♭","maj"],["vi","Fm","min"],["vii°","G°","dim"]], rel: "Fm" },
  { short: "E♭", name: "E♭",      sig: { n: 3, t: "flat",  notes: ["B♭","E♭","A♭"] },
    chords: [["I","E♭","maj"],["ii","Fm","min"],["iii","Gm","min"],["IV","A♭","maj"],["V","B♭","maj"],["vi","Cm","min"],["vii°","D°","dim"]], rel: "Cm" },
  { short: "B♭", name: "B♭",      sig: { n: 2, t: "flat",  notes: ["B♭","E♭"] },
    chords: [["I","B♭","maj"],["ii","Cm","min"],["iii","Dm","min"],["IV","E♭","maj"],["V","F","maj"],["vi","Gm","min"],["vii°","A°","dim"]], rel: "Gm" },
  { short: "F",  name: "F",       sig: { n: 1, t: "flat",  notes: ["B♭"] },
    chords: [["I","F","maj"],["ii","Gm","min"],["iii","Am","min"],["IV","B♭","maj"],["V","C","maj"],["vi","Dm","min"],["vii°","E°","dim"]], rel: "Dm" },
];
export const PROGRESSIONS = [
  { deg: [0, 4, 5, 3], mood: "밝고 친근한 · 가장 흔한 팝", genre: "팝 / 어쿠스틱", next: [
    { deg: [5, 3, 0, 4], note: "같은 재료로 감성적 분위기 · 후렴/브릿지" },
    { deg: [3, 4, 0],    note: "확실하게 마무리 (turnaround)" },
    { deg: [1, 4, 0],    note: "재즈풍으로 부드럽게 정리" },
  ] },
  { deg: [5, 3, 0, 4], mood: "감성적이고 애절한", genre: "발라드 / K-팝", next: [
    { deg: [0, 4, 5, 3], note: "밝게 전환 · 후렴 띄우기" },
    { deg: [3, 4, 5],    note: "반전(deceptive)으로 여운 남기기" },
    { deg: [1, 4, 0],    note: "부드럽게 정리" },
  ] },
  { deg: [0, 3, 4], mood: "단순하고 힘 있는 기본기", genre: "락 / 블루스 / 포크", next: [
    { deg: [0, 3, 4, 3], note: "블루스 셔플로 늘리기" },
    { deg: [0, 5, 3, 4], note: "복고풍으로 살 붙이기" },
    { deg: [3, 0, 4, 0], note: "블루스 turnaround" },
  ] },
  { deg: [1, 4, 0], mood: "부드럽게 해결되는", genre: "재즈 / 보사노바", next: [
    { deg: [0, 5, 1, 4], note: "돌고 도는 재즈 순환" },
    { deg: [2, 5, 1, 4], note: "더 길게 감아 돌기" },
    { deg: [1, 4, 0, 3], note: "다음 마디로 흘러가기" },
  ] },
  { deg: [0, 5, 3, 4], mood: "복고풍의 달콤한", genre: "두왑 / 올디스", next: [
    { deg: [0, 5, 1, 4], note: "재즈풍 두왑 변형" },
    { deg: [5, 3, 0, 4], note: "감성 팝으로 전환" },
    { deg: [0, 3, 4, 0], note: "깔끔한 마무리" },
  ] },
];

export const FORMULA = {
  maj: [0, 4, 7], m: [0, 3, 7], "7": [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11],
  "6": [0, 4, 7, 9], m6: [0, 3, 7, 9], sus2: [0, 2, 7], sus4: [0, 5, 7],
  dim: [0, 3, 6], aug: [0, 4, 8], dim7: [0, 3, 6, 9], m7b5: [0, 3, 6, 10],
};
export const KEY_PC = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]; // KEYS 순서의 루트 음
export const MAJ_DEG = [0, 2, 4, 5, 7, 9, 11];
export const TRIAD = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6] };
export const OPEN_MIDI = [40, 45, 50, 55, 59, 64]; // 6번줄~1번줄 개방현 MIDI
