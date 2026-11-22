
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

// ══════════════════════════════════════════════════════
//  도수 기반 음이름 철자 (C 내추럴 마이너가 D♯이 아니라 E♭로 나오게)
//  원리: 음 글자 = 루트 글자 + (도수 번호 − 1), 변화표 = 실제 음높이 − 그 글자의 자연음 높이.
//  기존 noteName(루트만 보고 ♯/♭ 배열을 고름)은 그대로 두고, 철자가 중요한 화면만 아래 함수를 쓴다.
// ══════════════════════════════════════════════════════
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11]; // 글자별 자연음 높이
const ACC_STR = { "-2": "𝄫", "-1": "♭", "0": "", "1": "♯", "2": "𝄪" };
const ACC_VAL = { "𝄫": -2, "♭": -1, "♯": 1, "𝄪": 2 };
// 이명동음 루트 (운영자 결정: 겹변화표가 생기면 이쪽으로 철자)
const ENHARMONIC_ROOT = { 1: "C♯", 3: "D♯", 6: "G♭", 8: "G♯", 10: "A♯" };

// 글자 번호(0~6)와 실제 음높이(pc)로 이름을 만든다. 변화표가 ±2를 넘으면 null.
const spellOn = (letterIdx, pc) => {
  let d = (((pc - LETTER_PC[letterIdx]) % 12) + 12) % 12;
  if (d > 6) d -= 12;
  if (d < -2 || d > 2) return null;
  return LETTERS[letterIdx] + ACC_STR[String(d)];
};
// 이름 → { letterIdx, pc }  ("E♭" → 2, 3)
const parseName = (name) => {
  const letterIdx = LETTERS.indexOf(name[0]);
  const acc = name.length > 1 ? ACC_VAL[name.slice(1)] : 0;
  return { letterIdx, pc: (((LETTER_PC[letterIdx] + acc) % 12) + 12) % 12 };
};
const hasDouble = (names) => names.some((n) => n.includes("𝄫") || n.includes("𝄪"));
// "♭3" → 3, "R" → 1
const degNumber = (deg) => (deg === "R" ? 1 : parseInt(deg.replace(/[^0-9]/g, ""), 10));

function spellScaleFrom(rootName, scale) {
  const { letterIdx: rl, pc: rpc } = parseName(rootName);
  return scale.notes.map((n) => spellOn((rl + degNumber(n.deg) - 1) % 7, (rpc + n.iv) % 12));
}
// 스케일의 음이름 (scale.notes 순서와 같음). 겹변화표가 생기면 이명동음 루트로 다시 철자해 본다.
export function spellScale(rootPC, scale) {
  const rootName = ROOTS[rootPC];
  const names = spellScaleFrom(rootName, scale);
  if (hasDouble(names) && ENHARMONIC_ROOT[rootPC]) {
    const altName = ENHARMONIC_ROOT[rootPC];
    const altNames = spellScaleFrom(altName, scale);
    if (!hasDouble(altNames)) return { rootName: altName, names: altNames };
  }
  return { rootName, names };
}

// 코드 구성음(FORMULA 반음 간격) → 도수 번호. dim7의 9(=𝄫7)만 6이 아니라 7로 센다.
const CHORD_DEG = { 0: 1, 2: 2, 3: 3, 4: 3, 5: 4, 6: 5, 7: 5, 8: 5, 9: 6, 10: 7, 11: 7 };
export function spellChord(rootName, typeId) {
  const { letterIdx: rl, pc: rpc } = parseName(rootName);
  return FORMULA[typeId].map((iv) => {
    const deg = typeId === "dim7" && iv === 9 ? 7 : CHORD_DEG[iv];
    return spellOn((rl + deg - 1) % 7, (rpc + iv) % 12);
  });
}
// 코드 안에서 음높이(pc)에 해당하는 이름 (코드 구성음이 아니면 null)
export function chordNoteAt(rootName, typeId, pc) {
  const names = spellChord(rootName, typeId);
  const rpc = parseName(rootName).pc;
  const i = FORMULA[typeId].findIndex((iv) => (rpc + iv) % 12 === pc);
  return i < 0 ? null : names[i];
}

// 잼 코드의 루트 이름: 키 이름 글자 + 장음계 도수 (F♯ 키 마이너 251 → E♯m7♭5 · A♯7 · D♯m7)
// deg가 장음계 도수가 아니면 ROOTS로 대신한다.
export function jamRootName(keyPC, deg) {
  const pc = (keyPC + deg) % 12;
  const di = MAJ_DEG.indexOf(deg % 12);
  if (di < 0) return ROOTS[pc];
  const { letterIdx: kl } = parseName(ROOTS[keyPC]);
  return spellOn((kl + di) % 7, pc) || ROOTS[pc];
}
