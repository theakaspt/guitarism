import React, { useState, useRef, useEffect, useCallback } from "react";

// ── 공통 색 팔레트 ───────────────────────────────────
const C = {
  bg: "#0E1113", panel: "#171C1F", hub: "#1F2529", ring: "#252C31",
  text: "#F2EEE6", muted: "#9AA5AB", dim: "#6E7A80",
  brass: "#E0A54B", teal: "#5DCAA5", rose: "#D07A6E",
  tealBg: "#123027", tealText: "#7FD8B6",
  roseBg: "#33201C", roseText: "#E0937F",
  neck: "#1E1710", fretwire: "#4C545A", string: "#C9CDCF", mute: "#D07A6E",
};
const QCOLOR = { maj: C.brass, min: C.teal, dim: C.rose };
const QLABEL = { maj: "메이저", min: "마이너", dim: "디미니쉬" };

// ══════════════════════════════════════════════════════
//  공통 음악 데이터
// ══════════════════════════════════════════════════════
const OPEN_PC = [4, 9, 2, 7, 11, 4]; // 6번줄(E)→1번줄(E) 개방현 음
const SHARP_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const FLAT_NAMES  = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
const FLAT_ROOTS = new Set([5, 10, 3, 8, 1]); // F, B♭, E♭, A♭, D♭
const noteName = (rootPC, pc) => (FLAT_ROOTS.has(rootPC) ? FLAT_NAMES : SHARP_NAMES)[pc];
// 루트 표기(관례): F♯만 ♯, 나머지 변화음(D♭·E♭·A♭·B♭)은 ♭. 디코더 5도권의 키 표기와 동일하게 통일.
// → C, D♭, D, E♭, E, F, F♯, G, A♭, A, B♭, B (5도권 키 표기와 일치)
const ROOTS = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

// ── 5도권 (디코더) ──
const KEYS = [
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
const PROGRESSIONS = [
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

// ── 스케일 (도수 라벨 deg + 간격 iv) ──
const SCALES = [
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

// ── 코드 타입 + 이동식 모양(검증됨) + 오픈 코드 ──
const CHORD_TYPES = [
  { id: "maj", label: "메이저", sym: "" },
  { id: "m", label: "마이너", sym: "m" },
  { id: "7", label: "7", sym: "7" },
  { id: "m7", label: "m7", sym: "m7" },
  { id: "maj7", label: "maj7", sym: "maj7" },
  { id: "6", label: "6", sym: "6" },
  { id: "m6", label: "m6", sym: "m6" },
  { id: "sus2", label: "sus2", sym: "sus2" },
  { id: "sus4", label: "sus4", sym: "sus4" },
  { id: "dim", label: "dim", sym: "°" },
  { id: "aug", label: "aug", sym: "+" },
  { id: "dim7", label: "dim7", sym: "°7" },
  { id: "m7b5", label: "m7♭5", sym: "m7♭5" },
];
// 이동식 모양: offsets s6..s1 ('x' 또는 루트 프렛으로부터의 반음). E=6번줄 루트, A=5번줄 루트
const MOV = {
  maj:  { E: [0,2,2,1,0,0], A: ["x",0,2,2,2,0] },
  m:    { E: [0,2,2,0,0,0], A: ["x",0,2,2,1,0] },
  "7":  { E: [0,2,0,1,0,0], A: ["x",0,2,0,2,0] },
  m7:   { E: [0,2,0,0,0,0], A: ["x",0,2,0,1,0] },
  maj7: { E: [0,2,1,1,0,0], A: ["x",0,2,1,2,0] },
  "6":  { E: [0,2,2,1,2,0], A: ["x",0,2,2,2,2] },
  m6:   { E: [0,2,2,0,2,0], A: ["x",0,2,2,1,2] },
  sus2: { A: ["x",0,2,2,0,0] },
  sus4: { E: [0,2,2,2,0,0], A: ["x",0,2,2,3,0] },
  dim:  { A: ["x",0,1,2,1,"x"] },
  aug:  { A: ["x",0,3,2,2,"x"] },
  dim7: { A: ["x",0,1,2,1,2] },
  m7b5: { A: ["x",0,1,0,1,"x"] },
};
// 오픈 코드 (손가락 번호 포함). 키 = "루트pc_타입". s: s6..s1 [절대프렛(-1=X,0=개방), 손가락]
const OPEN_CHORDS = {
  "0_maj": [[-1,0],[3,3],[2,2],[0,0],[1,1],[0,0]],
  "9_maj": [[-1,0],[0,0],[2,1],[2,2],[2,3],[0,0]],
  "7_maj": [[3,2],[2,1],[0,0],[0,0],[0,0],[3,3]],
  "4_maj": [[0,0],[2,2],[2,3],[1,1],[0,0],[0,0]],
  "2_maj": [[-1,0],[-1,0],[0,0],[2,1],[3,3],[2,2]],
  "9_m":  [[-1,0],[0,0],[2,2],[2,3],[1,1],[0,0]],
  "4_m":  [[0,0],[2,2],[2,3],[0,0],[0,0],[0,0]],
  "2_m":  [[-1,0],[-1,0],[0,0],[2,2],[3,3],[1,1]],
  "4_7":  [[0,0],[2,2],[0,0],[1,1],[0,0],[0,0]],
  "9_7":  [[-1,0],[0,0],[2,2],[0,0],[2,3],[0,0]],
  "2_7":  [[-1,0],[-1,0],[0,0],[2,2],[1,1],[2,3]],
  "7_7":  [[3,3],[2,2],[0,0],[0,0],[0,0],[1,1]],
};

// ── 트라이어드 / 탑4현 운지 (생성·검증됨) ──
const TRIAD_HI={"0_maj":[[-1,0],[-1,0],[-1,0],[5,0],[5,0],[3,0]],"0_m":[[-1,0],[-1,0],[-1,0],[5,0],[4,0],[3,0]],"0_dim":[[-1,0],[-1,0],[-1,0],[5,0],[4,0],[2,0]],"0_aug":[[-1,0],[-1,0],[-1,0],[5,0],[5,0],[4,0]],"1_maj":[[-1,0],[-1,0],[-1,0],[6,0],[6,0],[4,0]],"1_m":[[-1,0],[-1,0],[-1,0],[6,0],[5,0],[4,0]],"1_dim":[[-1,0],[-1,0],[-1,0],[6,0],[5,0],[3,0]],"1_aug":[[-1,0],[-1,0],[-1,0],[6,0],[6,0],[5,0]],"2_maj":[[-1,0],[-1,0],[-1,0],[7,0],[7,0],[5,0]],"2_m":[[-1,0],[-1,0],[-1,0],[7,0],[6,0],[5,0]],"2_dim":[[-1,0],[-1,0],[-1,0],[7,0],[6,0],[4,0]],"2_aug":[[-1,0],[-1,0],[-1,0],[7,0],[7,0],[6,0]],"3_maj":[[-1,0],[-1,0],[-1,0],[8,0],[8,0],[6,0]],"3_m":[[-1,0],[-1,0],[-1,0],[8,0],[7,0],[6,0]],"3_dim":[[-1,0],[-1,0],[-1,0],[8,0],[7,0],[5,0]],"3_aug":[[-1,0],[-1,0],[-1,0],[8,0],[8,0],[7,0]],"4_maj":[[-1,0],[-1,0],[-1,0],[9,0],[9,0],[7,0]],"4_m":[[-1,0],[-1,0],[-1,0],[9,0],[8,0],[7,0]],"4_dim":[[-1,0],[-1,0],[-1,0],[9,0],[8,0],[6,0]],"4_aug":[[-1,0],[-1,0],[-1,0],[9,0],[9,0],[8,0]],"5_maj":[[-1,0],[-1,0],[-1,0],[10,0],[10,0],[8,0]],"5_m":[[-1,0],[-1,0],[-1,0],[10,0],[9,0],[8,0]],"5_dim":[[-1,0],[-1,0],[-1,0],[10,0],[9,0],[7,0]],"5_aug":[[-1,0],[-1,0],[-1,0],[10,0],[10,0],[9,0]],"6_maj":[[-1,0],[-1,0],[-1,0],[11,0],[11,0],[9,0]],"6_m":[[-1,0],[-1,0],[-1,0],[11,0],[10,0],[9,0]],"6_dim":[[-1,0],[-1,0],[-1,0],[11,0],[10,0],[8,0]],"6_aug":[[-1,0],[-1,0],[-1,0],[11,0],[11,0],[10,0]],"7_maj":[[-1,0],[-1,0],[-1,0],[12,0],[12,0],[10,0]],"7_m":[[-1,0],[-1,0],[-1,0],[12,0],[11,0],[10,0]],"7_dim":[[-1,0],[-1,0],[-1,0],[12,0],[11,0],[9,0]],"7_aug":[[-1,0],[-1,0],[-1,0],[12,0],[12,0],[11,0]],"8_maj":[[-1,0],[-1,0],[-1,0],[13,0],[13,0],[11,0]],"8_m":[[-1,0],[-1,0],[-1,0],[13,0],[12,0],[11,0]],"8_dim":[[-1,0],[-1,0],[-1,0],[13,0],[12,0],[10,0]],"8_aug":[[-1,0],[-1,0],[-1,0],[1,0],[1,0],[0,0]],"9_maj":[[-1,0],[-1,0],[-1,0],[2,0],[2,0],[0,0]],"9_m":[[-1,0],[-1,0],[-1,0],[2,0],[1,0],[0,0]],"9_dim":[[-1,0],[-1,0],[-1,0],[14,0],[13,0],[11,0]],"9_aug":[[-1,0],[-1,0],[-1,0],[2,0],[2,0],[1,0]],"10_maj":[[-1,0],[-1,0],[-1,0],[3,0],[3,0],[1,0]],"10_m":[[-1,0],[-1,0],[-1,0],[3,0],[2,0],[1,0]],"10_dim":[[-1,0],[-1,0],[-1,0],[3,0],[2,0],[0,0]],"10_aug":[[-1,0],[-1,0],[-1,0],[3,0],[3,0],[2,0]],"11_maj":[[-1,0],[-1,0],[-1,0],[4,0],[4,0],[2,0]],"11_m":[[-1,0],[-1,0],[-1,0],[4,0],[3,0],[2,0]],"11_dim":[[-1,0],[-1,0],[-1,0],[4,0],[3,0],[1,0]],"11_aug":[[-1,0],[-1,0],[-1,0],[4,0],[4,0],[3,0]]};
const TRIAD_MID={"0_maj":[[-1,0],[-1,0],[10,0],[9,0],[8,0],[-1,0]],"0_m":[[-1,0],[-1,0],[10,0],[8,0],[8,0],[-1,0]],"0_dim":[[-1,0],[-1,0],[10,0],[8,0],[7,0],[-1,0]],"0_aug":[[-1,0],[-1,0],[10,0],[9,0],[9,0],[-1,0]],"1_maj":[[-1,0],[-1,0],[11,0],[10,0],[9,0],[-1,0]],"1_m":[[-1,0],[-1,0],[11,0],[9,0],[9,0],[-1,0]],"1_dim":[[-1,0],[-1,0],[11,0],[9,0],[8,0],[-1,0]],"1_aug":[[-1,0],[-1,0],[11,0],[10,0],[10,0],[-1,0]],"2_maj":[[-1,0],[-1,0],[12,0],[11,0],[10,0],[-1,0]],"2_m":[[-1,0],[-1,0],[12,0],[10,0],[10,0],[-1,0]],"2_dim":[[-1,0],[-1,0],[12,0],[10,0],[9,0],[-1,0]],"2_aug":[[-1,0],[-1,0],[12,0],[11,0],[11,0],[-1,0]],"3_maj":[[-1,0],[-1,0],[13,0],[12,0],[11,0],[-1,0]],"3_m":[[-1,0],[-1,0],[13,0],[11,0],[11,0],[-1,0]],"3_dim":[[-1,0],[-1,0],[13,0],[11,0],[10,0],[-1,0]],"3_aug":[[-1,0],[-1,0],[1,0],[0,0],[0,0],[-1,0]],"4_maj":[[-1,0],[-1,0],[2,0],[1,0],[0,0],[-1,0]],"4_m":[[-1,0],[-1,0],[2,0],[0,0],[0,0],[-1,0]],"4_dim":[[-1,0],[-1,0],[14,0],[12,0],[11,0],[-1,0]],"4_aug":[[-1,0],[-1,0],[2,0],[1,0],[1,0],[-1,0]],"5_maj":[[-1,0],[-1,0],[3,0],[2,0],[1,0],[-1,0]],"5_m":[[-1,0],[-1,0],[3,0],[1,0],[1,0],[-1,0]],"5_dim":[[-1,0],[-1,0],[3,0],[1,0],[0,0],[-1,0]],"5_aug":[[-1,0],[-1,0],[3,0],[2,0],[2,0],[-1,0]],"6_maj":[[-1,0],[-1,0],[4,0],[3,0],[2,0],[-1,0]],"6_m":[[-1,0],[-1,0],[4,0],[2,0],[2,0],[-1,0]],"6_dim":[[-1,0],[-1,0],[4,0],[2,0],[1,0],[-1,0]],"6_aug":[[-1,0],[-1,0],[4,0],[3,0],[3,0],[-1,0]],"7_maj":[[-1,0],[-1,0],[5,0],[4,0],[3,0],[-1,0]],"7_m":[[-1,0],[-1,0],[5,0],[3,0],[3,0],[-1,0]],"7_dim":[[-1,0],[-1,0],[5,0],[3,0],[2,0],[-1,0]],"7_aug":[[-1,0],[-1,0],[5,0],[4,0],[4,0],[-1,0]],"8_maj":[[-1,0],[-1,0],[6,0],[5,0],[4,0],[-1,0]],"8_m":[[-1,0],[-1,0],[6,0],[4,0],[4,0],[-1,0]],"8_dim":[[-1,0],[-1,0],[6,0],[4,0],[3,0],[-1,0]],"8_aug":[[-1,0],[-1,0],[6,0],[5,0],[5,0],[-1,0]],"9_maj":[[-1,0],[-1,0],[7,0],[6,0],[5,0],[-1,0]],"9_m":[[-1,0],[-1,0],[7,0],[5,0],[5,0],[-1,0]],"9_dim":[[-1,0],[-1,0],[7,0],[5,0],[4,0],[-1,0]],"9_aug":[[-1,0],[-1,0],[7,0],[6,0],[6,0],[-1,0]],"10_maj":[[-1,0],[-1,0],[8,0],[7,0],[6,0],[-1,0]],"10_m":[[-1,0],[-1,0],[8,0],[6,0],[6,0],[-1,0]],"10_dim":[[-1,0],[-1,0],[8,0],[6,0],[5,0],[-1,0]],"10_aug":[[-1,0],[-1,0],[8,0],[7,0],[7,0],[-1,0]],"11_maj":[[-1,0],[-1,0],[9,0],[8,0],[7,0],[-1,0]],"11_m":[[-1,0],[-1,0],[9,0],[7,0],[7,0],[-1,0]],"11_dim":[[-1,0],[-1,0],[9,0],[7,0],[6,0],[-1,0]],"11_aug":[[-1,0],[-1,0],[9,0],[8,0],[8,0],[-1,0]]};
const TOP4={"0_maj":[[-1,0],[-1,0],[2,0],[0,0],[1,0],[0,0]],"0_m":[[-1,0],[-1,0],[1,0],[0,0],[1,0],[3,0]],"0_7":[[-1,0],[-1,0],[2,0],[3,0],[1,0],[3,0]],"0_m7":[[-1,0],[-1,0],[1,0],[3,0],[1,0],[3,0]],"0_maj7":[[-1,0],[-1,0],[2,0],[4,0],[1,0],[3,0]],"1_maj":[[-1,0],[-1,0],[3,0],[1,0],[2,0],[1,0]],"1_m":[[-1,0],[-1,0],[2,0],[1,0],[2,0],[0,0]],"1_7":[[-1,0],[-1,0],[3,0],[4,0],[2,0],[4,0]],"1_m7":[[-1,0],[-1,0],[2,0],[4,0],[2,0],[4,0]],"1_maj7":[[-1,0],[-1,0],[3,0],[5,0],[2,0],[4,0]],"2_maj":[[-1,0],[-1,0],[0,0],[2,0],[3,0],[2,0]],"2_m":[[-1,0],[-1,0],[0,0],[2,0],[3,0],[1,0]],"2_7":[[-1,0],[-1,0],[0,0],[2,0],[1,0],[2,0]],"2_m7":[[-1,0],[-1,0],[0,0],[2,0],[1,0],[1,0]],"2_maj7":[[-1,0],[-1,0],[0,0],[2,0],[2,0],[2,0]],"3_maj":[[-1,0],[-1,0],[1,0],[3,0],[4,0],[3,0]],"3_m":[[-1,0],[-1,0],[1,0],[3,0],[4,0],[2,0]],"3_7":[[-1,0],[-1,0],[1,0],[3,0],[2,0],[3,0]],"3_m7":[[-1,0],[-1,0],[1,0],[3,0],[2,0],[2,0]],"3_maj7":[[-1,0],[-1,0],[1,0],[3,0],[3,0],[3,0]],"4_maj":[[-1,0],[-1,0],[2,0],[1,0],[0,0],[0,0]],"4_m":[[-1,0],[-1,0],[2,0],[0,0],[0,0],[0,0]],"4_7":[[-1,0],[-1,0],[0,0],[1,0],[0,0],[0,0]],"4_m7":[[-1,0],[-1,0],[0,0],[0,0],[0,0],[0,0]],"4_maj7":[[-1,0],[-1,0],[1,0],[1,0],[0,0],[0,0]],"5_maj":[[-1,0],[-1,0],[3,0],[2,0],[1,0],[1,0]],"5_m":[[-1,0],[-1,0],[3,0],[1,0],[1,0],[1,0]],"5_7":[[-1,0],[-1,0],[1,0],[2,0],[1,0],[1,0]],"5_m7":[[-1,0],[-1,0],[1,0],[1,0],[1,0],[1,0]],"5_maj7":[[-1,0],[-1,0],[2,0],[2,0],[1,0],[1,0]],"6_maj":[[-1,0],[-1,0],[4,0],[3,0],[2,0],[2,0]],"6_m":[[-1,0],[-1,0],[4,0],[2,0],[2,0],[2,0]],"6_7":[[-1,0],[-1,0],[2,0],[3,0],[2,0],[2,0]],"6_m7":[[-1,0],[-1,0],[2,0],[2,0],[2,0],[2,0]],"6_maj7":[[-1,0],[-1,0],[3,0],[3,0],[2,0],[2,0]],"7_maj":[[-1,0],[-1,0],[0,0],[0,0],[0,0],[3,0]],"7_m":[[-1,0],[-1,0],[0,0],[3,0],[3,0],[3,0]],"7_7":[[-1,0],[-1,0],[0,0],[0,0],[0,0],[1,0]],"7_m7":[[-1,0],[-1,0],[3,0],[3,0],[3,0],[3,0]],"7_maj7":[[-1,0],[-1,0],[0,0],[0,0],[0,0],[2,0]],"8_maj":[[-1,0],[-1,0],[1,0],[1,0],[1,0],[4,0]],"8_m":[[-1,0],[-1,0],[1,0],[1,0],[0,0],[4,0]],"8_7":[[-1,0],[-1,0],[1,0],[1,0],[1,0],[2,0]],"8_m7":[[-1,0],[-1,0],[1,0],[1,0],[0,0],[2,0]],"8_maj7":[[-1,0],[-1,0],[1,0],[1,0],[1,0],[3,0]],"9_maj":[[-1,0],[-1,0],[2,0],[2,0],[2,0],[0,0]],"9_m":[[-1,0],[-1,0],[2,0],[2,0],[1,0],[0,0]],"9_7":[[-1,0],[-1,0],[2,0],[2,0],[2,0],[3,0]],"9_m7":[[-1,0],[-1,0],[2,0],[2,0],[1,0],[3,0]],"9_maj7":[[-1,0],[-1,0],[2,0],[2,0],[2,0],[4,0]],"10_maj":[[-1,0],[-1,0],[0,0],[3,0],[3,0],[1,0]],"10_m":[[-1,0],[-1,0],[3,0],[3,0],[2,0],[1,0]],"10_7":[[-1,0],[-1,0],[3,0],[3,0],[3,0],[4,0]],"10_m7":[[-1,0],[-1,0],[3,0],[3,0],[2,0],[4,0]],"10_maj7":[[-1,0],[-1,0],[3,0],[3,0],[3,0],[5,0]],"11_maj":[[-1,0],[-1,0],[1,0],[4,0],[0,0],[2,0]],"11_m":[[-1,0],[-1,0],[0,0],[4,0],[0,0],[2,0]],"11_7":[[-1,0],[-1,0],[1,0],[2,0],[0,0],[2,0]],"11_m7":[[-1,0],[-1,0],[0,0],[2,0],[0,0],[2,0]],"11_maj7":[[-1,0],[-1,0],[1,0],[3,0],[0,0],[2,0]]};

const FORMULA = {
  maj: [0, 4, 7], m: [0, 3, 7], "7": [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11],
  "6": [0, 4, 7, 9], m6: [0, 3, 7, 9], sus2: [0, 2, 7], sus4: [0, 5, 7],
  dim: [0, 3, 6], aug: [0, 4, 8], dim7: [0, 3, 6, 9], m7b5: [0, 3, 6, 10],
};
const cmpArr = (x, y) => { for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
// 슬래시 코드: 베이스(최저음) 고정, 위쪽은 구성음. bstr: 0=6번줄, 1=5번줄
function bestSlash(T, bassPC, bstr) {
  const fbs = []; for (let fb = 0; fb <= 12; fb++) if ((OPEN_PC[bstr] + fb) % 12 === bassPC) fbs.push(fb);
  let best = null;
  for (const fb of fbs) {
    const uppers = []; for (let s = bstr + 1; s < 6; s++) uppers.push(s);
    const opts = uppers.map((s) => {
      const o = []; for (let f = Math.max(0, fb - 3); f <= fb + 4; f++) if (T.has((OPEN_PC[s] + f) % 12)) o.push(f);
      o.push(-1); return o;
    });
    const rec = (i, chosen) => {
      if (i === uppers.length) {
        const sd = [[bstr, fb]];
        for (let j = 0; j < uppers.length; j++) if (chosen[j] !== -1) sd.push([uppers[j], chosen[j]]);
        const allpc = new Set();
        for (let j = 1; j < sd.length; j++) { const pc = (OPEN_PC[sd[j][0]] + sd[j][1]) % 12; if (!T.has(pc)) return; }
        for (const [s, f] of sd) allpc.add((OPEN_PC[s] + f) % 12);
        for (const t of T) if (!allpc.has(t)) return;
        const frets = sd.filter(([s, f]) => f > 0).map(([s, f]) => f);
        const span = frets.length ? Math.max(...frets) - Math.min(...frets) : 0;
        if (span > 4) return;
        const ss = sd.map(([s]) => s).sort((a, b) => a - b);
        let gaps = 0; for (let x = ss[0]; x <= ss[ss.length - 1]; x++) if (!ss.includes(x)) gaps++;
        const key = [gaps, -sd.length, fb, span];
        if (!best || cmpArr(key, best.key) < 0) best = { key, fb, chosen: chosen.slice(), uppers };
        return;
      }
      for (const opt of opts[i]) { chosen.push(opt); rec(i + 1, chosen); chosen.pop(); }
    };
    rec(0, []);
  }
  if (!best) return null;
  const a = Array.from({ length: 6 }, () => [-1, 0]);
  a[bstr] = [best.fb, 0];
  best.uppers.forEach((s, j) => { if (best.chosen[j] !== -1) a[s] = [best.chosen[j], 0]; });
  return a;
}
function slashVoicings(rootPC, typeId, bassPC) {
  const T = new Set(FORMULA[typeId].map((iv) => (rootPC + iv) % 12));
  const raw = [];
  for (const [bstr, lbl] of [[0, "6번줄 베이스"], [1, "5번줄 베이스"]]) {
    const v = bestSlash(T, bassPC, bstr);
    if (v) raw.push({ label: lbl, open: false, barre: false, slash: true, s: v });
  }
  if (!raw.length) return [];
  const score = (voi) => {
    const s = voi.s;
    const fretted = s.filter((x) => x[0] > 0).map((x) => x[0]);
    const minF = fretted.length ? Math.min(...fretted) : 0;
    const span = fretted.length ? Math.max(...fretted) - Math.min(...fretted) : 0;
    const openCount = s.filter((x) => x[0] === 0).length;
    const ss = s.map((x, i) => (x[0] >= 0 ? i : -1)).filter((i) => i >= 0);
    let gaps = 0; for (let x = ss[0]; x <= ss[ss.length - 1]; x++) if (!ss.includes(x)) gaps++;
    return minF * 2 + span * 1.5 + gaps * 3 - openCount * 1.5; // 낮을수록 잡기 쉬움
  };
  raw.sort((a, b) => score(a) - score(b));
  raw[0].label += " (추천)";
  return raw;
}

function buildVoicings(rootPC, typeId, bassPC) {
  if (bassPC !== null && bassPC !== undefined) return slashVoicings(rootPC, typeId, bassPC);
  const out = [];
  const okey = rootPC + "_" + typeId;
  if (OPEN_CHORDS[okey]) out.push({ label: "오픈", open: true, barre: false, s: OPEN_CHORDS[okey] });
  const mov = MOV[typeId] || {};
  const mk = (offs, rootStr, labelKo) => {
    const base = ((rootPC - OPEN_PC[rootStr]) % 12 + 12) % 12;
    if (base === 0 && OPEN_CHORDS[okey]) return null; // 오픈과 중복 방지
    const s = offs.map((o) => (o === "x" ? [-1, 0] : [base + o, 0]));
    return { label: labelKo, open: false, barre: true, s, base };
  };
  if (mov.E) { const v = mk(mov.E, 0, "6번줄 루트"); if (v) out.push(v); }
  if (mov.A) { const v = mk(mov.A, 1, "5번줄 루트"); if (v) out.push(v); }
  if (TRIAD_HI[okey]) out.push({ label: "트라이어드·고음", open: false, barre: false, s: TRIAD_HI[okey] });
  if (TRIAD_MID[okey]) out.push({ label: "트라이어드·중음", open: false, barre: false, s: TRIAD_MID[okey] });
  if (TOP4[okey]) out.push({ label: "탑 4현", open: false, barre: false, s: TOP4[okey] });
  return out;
}

const N = KEYS.length, STEP = 360 / N;
const CX = 200, CY = 200, R_LABEL = 152, R_RING = 190, R_HUB = 78;
const nearestAngle = (target, current) =>
  current + (((target - current + 180) % 360 + 360) % 360 - 180);

// ── 소리 엔진 (Web Audio, 외부 의존성 없음) ──
let _ac = null;
function AC() {
  if (!_ac) { try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (_ac && _ac.state === "suspended") _ac.resume();
  return _ac;
}
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
const PRESETS = {
  acoustic: { label: "어쿠스틱", a: 0.58, decay: 0.9996, soft: 2, bodyMix: 0.08, gain: 0.24, lp: 4200, body: 1, detune: 7, rev: 0.30, amp: 0 },
  // 재즈 아치탑: 줄 배음을 살리고(bodyMix↓, lp↑), 넥픽업 + 진공관 클린 + 캐비닛으로 따뜻하고 둥글게
  electric: { label: "일렉",     a: 0.62, decay: 0.9994, soft: 1, bodyMix: 0.02, gain: 0.10, lp: 5200, body: 0, detune: 0, rev: 0.20, amp: 1 },
};
const _ksCache = new Map(); // key: preset+":"+midi+":"+sampleRate → AudioBuffer

// 목표 주파수의 줄을 튕겨 2.4초짜리 파형을 만들어 캐시(같은 음 재사용).
function ksBuffer(c, midi, presetKey) {
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

// ── 은은한 공간 울림(리버브): 합성 임펄스로 만든 마스터 버스(한 번만 생성) ──
// ── 마스터 버스: 모든 소리가 여기로 → 리미터 → 출력 (동시 타격 시 찌그러짐 방지) ──
let _master = null;
function master(c) {
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
let _rev = null;
function reverb(c) {
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

// 시그니처 유지 + 음색 인자(preset). 기본값 electric(코드 듣기·스케일·진행 = 일렉 통일).
// 펜더 로즈풍 일렉트릭 피아노: FM 합성(사인 캐리어 + 종소리 배음) + 부드러운 트레몰로
function rhodesTone(c, midi, t0, dur) {
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
function vibesTone(c, midi, t0, dur) {
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
function organTone(c, midi, t0, dur) {
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
let _tubeCurve = null;
function tubeCurve() {
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
function tone(c, midi, t0, dur, presetKey = "electric") {
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
function strum(midis, dur = 1.5, stagger = 0.03, preset = "electric") {
  const c = AC(); if (!c) return; const t = c.currentTime + 0.03;
  midis.forEach((m, i) => tone(c, m, t + i * stagger, dur, preset));
}
function melody(midis, step = 0.32, dur = 0.36, preset = "electric") {
  const c = AC(); if (!c) return; const t = c.currentTime + 0.03;
  midis.forEach((m, i) => tone(c, m, t + i * step, dur, preset));
}
function sequence(chords, chordDur = 0.66, preset = "electric") {
  const c = AC(); if (!c) return; let t = c.currentTime + 0.03;
  chords.forEach((ch) => { ch.forEach((m, i) => tone(c, m, t + i * 0.02, chordDur * 0.92, preset)); t += chordDur; });
}
const KEY_PC = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]; // KEYS 순서의 루트 음
const MAJ_DEG = [0, 2, 4, 5, 7, 9, 11];
const TRIAD = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6] };
const OPEN_MIDI = [40, 45, 50, 55, 59, 64]; // 6번줄~1번줄 개방현 MIDI

function strumAt(midis, t0, dur = 0.95, stagger = 0.012, preset = "electric") {
  const c = AC(); if (!c) return;
  midis.forEach((m, i) => tone(c, m, t0 + i * stagger, dur, preset));
}

// ── 신스 재즈 드럼 키트 (샘플 없이 Web Audio로) ──
let _noise = null;
function noiseBuf(c) {
  if (_noise) return _noise;
  const len = Math.round(c.sampleRate * 2);
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  _noise = b; return _noise;
}
function noiseVoice(c, t0, { hp, bp, lp, dur, atk = 0.001, vel = 1, q = 1 }) {
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
function drum(c, voice, t0, vel = 1) {
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
const _sw = 2 / 3;
const DRUM_FEELS = [
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
const JAM_SYM = { m7: "m7", "7": "7", maj7: "maj7", m7b5: "m7♭5" };
const JAM_FORMS = [
  { name: "메이저 251", minor: false, chords: [{ deg: 2, type: "m7", bars: 1 }, { deg: 7, type: "7", bars: 1 }, { deg: 0, type: "maj7", bars: 2 }] },
  { name: "마이너 251", minor: true, chords: [{ deg: 11, type: "m7b5", bars: 1 }, { deg: 4, type: "7", bars: 1 }, { deg: 9, type: "m7", bars: 2 }] },
  { name: "메이저 턴어라운드", minor: false, chords: [{ deg: 0, type: "maj7", bars: 1 }, { deg: 9, type: "m7", bars: 1 }, { deg: 2, type: "m7", bars: 1 }, { deg: 7, type: "7", bars: 1 }] },
  { name: "마이너 턴어라운드", minor: true, chords: [{ deg: 9, type: "m7", bars: 1 }, { deg: 5, type: "maj7", bars: 1 }, { deg: 11, type: "m7b5", bars: 1 }, { deg: 4, type: "7", bars: 1 }] },
  { name: "I-VI7-ii-V", minor: false, chords: [{ deg: 0, type: "maj7", bars: 1 }, { deg: 9, type: "7", bars: 1 }, { deg: 2, type: "m7", bars: 1 }, { deg: 7, type: "7", bars: 1 }] },
  { name: "iii-VI7-ii-V", minor: false, chords: [{ deg: 4, type: "m7", bars: 1 }, { deg: 9, type: "7", bars: 1 }, { deg: 2, type: "m7", bars: 1 }, { deg: 7, type: "7", bars: 1 }] },
];
// ── 재즈 컴핑 보이싱 (드롭2류 4음, 바레 없음, 진행 내 보이스 리딩) ──
//  인접 4현(중4현 A D G B / 상4현 D G B E)에서 구성음 4개를 오름차순·손폭≤4로 배치.
const COMP_SETS = [[1, 2, 3, 4], [2, 3, 4, 5]];
function compCandidates(rootpc, type) {
  const tones = new Set(FORMULA[type].map((iv) => (rootpc + iv) % 12));
  const out = [];
  for (const S of COMP_SETS) {
    const per = S.map((s) => { const a = []; for (let f = 1; f <= 12; f++) if (tones.has((OPEN_MIDI[s] + f) % 12)) a.push(f); return a; });
    const rec = (i, ch) => {
      if (i === 4) {
        const midis = S.map((s, k) => OPEN_MIDI[s] + ch[k]);
        for (let k = 1; k < 4; k++) if (midis[k] <= midis[k - 1]) return; // 오름차순
        const pcs = new Set(midis.map((m) => m % 12));
        if (pcs.size !== 4) return;
        for (const t of tones) if (!pcs.has(t)) return; // 구성음 전부
        if (Math.max(...ch) - Math.min(...ch) > 4) return; // 손폭
        out.push({ midis, frets: ch.slice(), set: S });
        return;
      }
      for (const f of per[i]) { ch.push(f); rec(i + 1, ch); ch.pop(); }
    };
    rec(0, []);
  }
  return out;
}
const _cCent = (v) => (v.midis[0] + v.midis[1] + v.midis[2] + v.midis[3]) / 4;
const _cTop = (v) => v.midis[3]; // 오름차순이라 맨 위 음
const _cVL = (a, b) => Math.abs(a.midis[0] - b.midis[0]) + Math.abs(a.midis[1] - b.midis[1]) + Math.abs(a.midis[2] - b.midis[2]) + Math.abs(a.midis[3] - b.midis[3]);
const _cVLtop = (a, b) => Math.abs(_cTop(a) - _cTop(b));
// 보이싱 1개 선택: 직전과 있으면 멜로디(맨 위) 우선 + 안쪽 음, 없으면 시작 음역 앵커
function _pickVoicing(cands, prev) {
  let best = null, bs = Infinity;
  for (const c of cands) {
    const tp = _cTop(c), lo = c.midis[0];
    let sc = (Math.max(...c.frets) - Math.min(...c.frets)) * 0.4;
    if (prev) sc += _cVLtop(c, prev) * 2.0 + (_cVL(c, prev) - _cVLtop(c, prev)) * 1.0;
    else sc += Math.abs(tp - 67) * 1.3 + Math.abs(_cCent(c) - 60) * 0.3;
    if (tp > 72) sc += (tp - 72) * 2;
    if (lo < 50) sc += (50 - lo) * 2;
    if (tp < 62) sc += (62 - tp) * 1.2;
    if (sc < bs) { bs = sc; best = c; }
  }
  return best;
}
function voiceProgression(form, keyPC) {
  const build = (seed) => {
    let prev = seed; const seq = [];
    for (const ch of form.chords) {
      const rootpc = (keyPC + ch.deg) % 12;
      const cands = compCandidates(rootpc, ch.type);
      const best = cands.length ? _pickVoicing(cands, prev) : { midis: FORMULA[ch.type].map((iv) => 48 + rootpc + iv), frets: [1, 1, 1, 1] };
      seq.push(best); prev = best;
    }
    return seq;
  };
  const pass1 = build(null);
  const pass2 = build(pass1[pass1.length - 1]); // 루프 이음새(마지막→첫)까지 매끄럽게
  return pass2.map((v) => v.midis);
}
// ── 컴핑 리듬 (스윙: 뒷박은 셋잇단 위치 x.66박) · b=박위치, d=음길이(박) ──
// ── 컴핑 리듬 (스윙: 뒷박은 셋잇단 위치 x.66박 / 스트레이트: x.5박) ──
//  b=박위치, d=음길이(박), bass=true면 낮은 2음만(엄지 베이스), bars=패턴 주기(기본 1마디)
const COMP_RHYTHMS = [
  { name: "차알스턴", hits: [{ b: 0, d: 1.5 }, { b: 2 + 2 / 3, d: 1.2 }] },
  { name: "프레디 그린", hits: [{ b: 0, d: 0.5 }, { b: 1, d: 0.5 }, { b: 2, d: 0.5 }, { b: 3, d: 0.5 }] },
  // 보사노바: 2마디 클라베. 엄지 베이스는 1·3박 꾸준히, 코드는 당겨서 마디를 넘나듦.
  { name: "보사노바", bars: 2, hits: [
    { b: 0, d: 0.9, bass: true }, { b: 2, d: 0.9, bass: true },
    { b: 4, d: 0.9, bass: true }, { b: 6, d: 0.9, bass: true },
    { b: 0, d: 0.5 }, { b: 1.5, d: 0.5 }, { b: 3, d: 1.2 },
    { b: 5.5, d: 0.5 }, { b: 6.5, d: 1.4 },
  ] },
  { name: "투 필", hits: [{ b: 0, d: 1.9 }, { b: 2, d: 1.9 }] },
];
function jamTimeline(form, keyPC, rhythm, drumFeel) {
  const R = rhythm || COMP_RHYTHMS[0];
  const rBars = R.bars || 1;
  const voiced = voiceProgression(form, keyPC);
  const timeline = []; let bar = 0;
  form.chords.forEach((ch, ci) => {
    const midis = voiced[ci];
    const low = midis.slice(0, 2);   // 엄지 베이스(낮은 2음)
    for (let b = 0; b < ch.bars; b++) {
      R.hits.forEach((h) => {
        // 리듬 주기가 여러 마디면, 이 마디에 해당하는 히트만 (h.b는 패턴 전체 기준 박)
        const hBar = Math.floor(h.b / 4);
        if (rBars > 1 && hBar !== ((bar + b) % rBars)) return;
        const beatInBar = h.b - hBar * 4;
        timeline.push({ beat: (bar + b) * 4 + beatInBar, midis: h.bass ? low : midis, durBeats: h.d });
      });
    }
    bar += ch.bars;
  });
  const totalBars = bar;
  if (drumFeel) {
    const dBars = drumFeel.bars || 1;
    for (let b = 0; b < totalBars; b++) {
      drumFeel.hits.forEach((h) => {
        const hBar = Math.floor(h.b / 4);
        if (dBars > 1 && hBar !== (b % dBars)) return;
        const beatInBar = h.b - hBar * 4;
        timeline.push({ beat: b * 4 + beatInBar, drum: h.v, vel: h.vel == null ? 1 : h.vel });
      });
    }
  }
  timeline.sort((a, z) => a.beat - z.beat);
  return { timeline, loopBeats: totalBars * 4 };
}

// ── 잼 ↔ 스케일 연결 ──────────────────────────────────
// SCALES 인덱스: 0 메이저 / 1 내추럴마이너 / 8 도리안 / 9 믹솔리디안 / 10 리디안 / 12 로크리안 / 6 하모닉마이너
const _scIv = (i) => SCALES[i].notes.map((n) => n.iv);
const _covers = (scRoot, scIdx, chRoot, type) => {
  const s = new Set(_scIv(scIdx).map((x) => (scRoot + x) % 12));
  return FORMULA[type].every((iv) => s.has((chRoot + iv) % 12));
};
// 진행 전체를 훑는 "키 스케일" (마이너 폼은 나란한 단조)
function jamKeyScale(form, keyPC) {
  return form.minor ? { root: (keyPC + 9) % 12, sc: 1 } : { root: keyPC, sc: 0 };
}
// 코드별 스케일 (문맥 반영). 반환 {root, sc, note}
function jamChordScale(form, keyPC, ch) {
  const cr = (keyPC + ch.deg) % 12;
  const minRoot = (keyPC + 9) % 12;
  if (form.minor) {
    if (ch.type === "7") return { root: minRoot, sc: 6, note: "마이너 키의 V7 — 하모닉 마이너에서 나오는 소리(키 밖 음 포함)" };
    if (ch.type === "m7b5") return { root: cr, sc: 12 };
    if (ch.type === "m7" && cr === minRoot) return { root: cr, sc: 1 };
  } else if (ch.type === "7" && ch.deg === 9) {
    return { root: cr, sc: 9, note: "세컨더리 도미넌트 — 키 밖 음(3음)이 들어감" };
  }
  const pref = { m7: [8, 1, 3], "7": [9, 4], maj7: [0, 10, 2], m7b5: [12, 5] }[ch.type];
  for (const si of pref) if (_covers(cr, si, cr, ch.type)) return { root: cr, sc: si };
  for (let si = 0; si < SCALES.length; si++) if (_covers(cr, si, cr, ch.type)) return { root: cr, sc: si };
  return { root: cr, sc: 0 };
}
// 역방향: 이 (루트, 스케일)로 연주 가능한 잼(키·폼) 찾기
// 기준 = "스케일이 그 진행의 키(조성)에 속하는가". 펜타는 부분집합이라 자연히 통과,
//        블루스는 블루노트(♭3/♭5 등) 2개까지 예외 허용(실전대로).
const _MAJ_IV = [0, 2, 4, 5, 7, 9, 11], _MIN_IV = [0, 2, 3, 5, 7, 8, 10];
const _BLUES_SC = new Set([4, 5]); // 메이저/마이너 블루스 인덱스
function _keySet(form, keyPC) {
  const s = new Set(form.minor ? _MIN_IV.map((x) => (keyPC + 9 + x) % 12) : _MAJ_IV.map((x) => (keyPC + x) % 12));
  if (form.minor) s.add((keyPC + 9 + 11) % 12);        // 하모닉 마이너 리딩톤(V7의 3음)
  if (form.chords.some((c) => c.type === "7" && c.deg === 9)) s.add((keyPC + 9 + 4) % 12); // VI7의 3음(키 밖)
  return s;
}
function _scaleFitsJam(root, scIdx, form, keyPC) {
  const ks = _keySet(form, keyPC);
  const outside = _scIv(scIdx).map((x) => (root + x) % 12).filter((n) => !ks.has(n)).length;
  return outside <= (_BLUES_SC.has(scIdx) ? 2 : 0);
}
function jamForScale(root, scIdx) {
  const out = [];
  for (let fi = 0; fi < JAM_FORMS.length; fi++) {
    const form = JAM_FORMS[fi];
    for (let ki = 0; ki < KEYS.length; ki++) {
      const keyPC = KEY_PC[ki];
      if (!_scaleFitsJam(root, scIdx, form, keyPC)) continue;
      const home = form.minor ? (keyPC + 9) % 12 : keyPC;
      out.push({ keyIdx: ki, formIdx: fi, score: (root === home ? 0 : 1.5) + (fi > 1 ? 0.5 : 0) });
    }
  }
  out.sort((a, b) => a.score - b.score);
  return out;
}
const JamCtx = React.createContext(null);
const useJam = () => React.useContext(JamCtx);
function JamProvider({ children }) {
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

const SEG = { display: "flex", background: C.hub, borderRadius: 999, padding: 3, gap: 3, flexWrap: "wrap" };
const SEGLABEL = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 10, letterSpacing: "0.2em", color: C.muted, textTransform: "uppercase" };
// 공용 잼 패널 (디코더·스케일 양쪽에서 사용). showKey=true면 키 선택기 표시.
const _row = { display: "flex", alignItems: "center", gap: 8, marginTop: 11, flexWrap: "wrap" };
// 가로 휠 셀렉터: 스와이프로 돌려 가운데 항목 선택(스냅). 다이얼 메타포와 통일.
function WheelPicker({ items, value, onChange, big }) {
  const ref = useRef(null);
  const itemRefs = useRef([]);
  const [active, setActive] = useState(value);
  const tmr = useRef(0);
  const centerTo = (i, smooth) => {
    const c = ref.current, el = itemRefs.current[i];
    if (!c || !el) return;
    const left = el.offsetLeft + el.offsetWidth / 2 - c.clientWidth / 2;
    if (c.scrollTo) c.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
    else c.scrollLeft = left;
  };
  useEffect(() => { setActive(value); centerTo(value, false); }, [value]);
  const nearest = () => {
    const c = ref.current; if (!c) return value;
    const center = c.scrollLeft + c.clientWidth / 2;
    let best = value, bd = Infinity;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const d = Math.abs((el.offsetLeft + el.offsetWidth / 2) - center);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  };
  const onScroll = () => {
    const n = nearest(); setActive(n);
    clearTimeout(tmr.current);
    tmr.current = setTimeout(() => { const nn = nearest(); if (nn !== value) onChange(nn); }, 130);
  };
  return (
    <div style={{ position: "relative" }}>
      <div ref={ref} className="hwheel" onScroll={onScroll}
        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", padding: "2px 0", background: C.panel, borderRadius: 12 }}>
        <div style={{ flex: "0 0 44%" }} />
        {items.map((label, i) => {
          const on = i === active;
          return (
            <div key={i} ref={(el) => (itemRefs.current[i] = el)} onClick={() => centerTo(i, true)}
              style={{ scrollSnapAlign: "center", flex: "0 0 auto", padding: "9px 14px", cursor: "pointer", whiteSpace: "nowrap", color: on ? C.brass : C.muted, fontWeight: on ? 800 : 600, fontSize: on ? (big ? 18 : 16) : 14, opacity: on ? 1 : 0.5, transition: "color .12s, opacity .12s" }}>{label}</div>
          );
        })}
        <div style={{ flex: "0 0 44%" }} />
      </div>
      <div style={{ position: "absolute", left: "50%", top: 4, bottom: 4, width: 40, marginLeft: -20, borderRadius: 8, border: `1px solid ${C.ring}`, pointerEvents: "none" }} />
    </div>
  );
}

// 세로 휠 셀렉터: 위아래로 돌려 가운데 항목 선택(스냅). 여러 개를 한 줄에 나란히 배치 가능.
// 스크롤 충돌 방지: touchAction pan-y + overscrollBehavior contain
function VWheel({ items, value, onChange, size = 15 }) {
  const ref = useRef(null);
  const itemRefs = useRef([]);
  const [active, setActive] = useState(value);
  const tmr = useRef(0);
  const ROW = 34, H = 118;
  const centerTo = (i, smooth) => {
    const c = ref.current, el = itemRefs.current[i];
    if (!c || !el) return;
    const top = el.offsetTop + el.offsetHeight / 2 - c.clientHeight / 2;
    if (c.scrollTo) c.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
    else c.scrollTop = top;
  };
  useEffect(() => { setActive(value); centerTo(value, false); }, [value]);
  const nearest = () => {
    const c = ref.current; if (!c) return value;
    const center = c.scrollTop + c.clientHeight / 2;
    let best = value, bd = Infinity;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const d = Math.abs((el.offsetTop + el.offsetHeight / 2) - center);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  };
  const onScroll = () => {
    const n = nearest(); setActive(n);
    clearTimeout(tmr.current);
    tmr.current = setTimeout(() => { const nn = nearest(); if (nn !== value) onChange(nn); }, 130);
  };
  const pad = (H - ROW) / 2;
  return (
    <div style={{ position: "relative", background: C.panel, borderRadius: 12, overflow: "hidden" }}>
      <div ref={ref} className="hwheel" onScroll={onScroll}
        style={{ height: H, overflowY: "auto", scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", touchAction: "pan-y", overscrollBehavior: "contain" }}>
        <div style={{ height: pad }} />
        {items.map((label, i) => {
          const on = i === active;
          return (
            <div key={i} ref={(el) => (itemRefs.current[i] = el)} onClick={() => centerTo(i, true)}
              style={{ height: ROW, display: "flex", alignItems: "center", justifyContent: "center", scrollSnapAlign: "center", cursor: "pointer", whiteSpace: "nowrap", padding: "0 6px", textAlign: "center",
                color: on ? C.brass : C.muted, fontWeight: on ? 800 : 600, fontSize: on ? size : size - 2, opacity: on ? 1 : 0.45, transition: "color .12s, opacity .12s" }}>{label}</div>
          );
        })}
        <div style={{ height: pad }} />
      </div>
      <div style={{ position: "absolute", left: 4, right: 4, top: "50%", height: ROW, marginTop: -ROW / 2, borderTop: `1px solid ${C.ring}`, borderBottom: `1px solid ${C.ring}`, pointerEvents: "none" }} />
    </div>
  );
}
// 잼 미니 플레이어: 탭바 위 얇은 바(접힘) + 탭 시 전체 컨트롤 시트(펼침). App에 한 번만 상주.
function JamBar() {
  const jam = useJam();
  const [open, setOpen] = useState(false);
  const keyPc = KEY_PC[jam.keyIdx];
  const keyName = KEYS[jam.keyIdx].short;
  const form = JAM_FORMS[jam.form];
  const formName = form.name;
  return (
    <>
      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 58 }} />}
      {open && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60, background: C.panel, borderTop: `1px solid ${C.ring}`, borderRadius: "18px 18px 0 0", maxHeight: "82vh", overflowY: "auto", boxSizing: "border-box" }}>
          <div style={{ maxWidth: 440, margin: "0 auto", padding: "10px 16px 22px" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: C.ring, margin: "0 auto 12px" }} />
            <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
              <SectionLabel>251 잼 세션</SectionLabel>
              <button onClick={() => setOpen(false)} style={{ marginLeft: "auto", border: "none", background: "transparent", color: C.muted, fontSize: 15, cursor: "pointer", padding: "2px 6px" }}>▾ 닫기</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div style={{ flex: "0 0 30%", minWidth: 0 }}>
                <div style={{ ...SEGLABEL, marginBottom: 5, textAlign: "center" }}>키</div>
                <VWheel items={KEYS.map((k) => k.short)} value={jam.keyIdx} onChange={(i) => jam.setKeyIdx(i)} size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...SEGLABEL, marginBottom: 5, textAlign: "center" }}>폼</div>
                <VWheel items={JAM_FORMS.map((f) => f.name)} value={jam.form} onChange={(i) => jam.setForm(i)} size={14} />
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, justifyContent: "center", marginTop: 12 }}>
              {JAM_FORMS[jam.form].chords.map((ch, i) => {
                const rp = (keyPc + ch.deg) % 12;
                return (<React.Fragment key={i}><span style={{ fontSize: 17, fontWeight: 800, color: C.brass }}>{noteName(keyPc, rp)}{JAM_SYM[ch.type]}</span>{i < JAM_FORMS[jam.form].chords.length - 1 && <span style={{ color: C.dim, margin: "0 6px" }}>›</span>}</React.Fragment>);
              })}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...SEGLABEL, marginBottom: 5, textAlign: "center" }}>리듬</div>
                <VWheel items={COMP_RHYTHMS.map((r) => r.name)} value={jam.rhythm} onChange={(i) => jam.setRhythm(i)} size={13} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...SEGLABEL, marginBottom: 5, textAlign: "center" }}>음색</div>
                <VWheel items={["어쿠스틱", "일렉", "로즈", "비브라폰", "오르간"]} value={["acoustic", "electric", "rhodes", "vibes", "organ"].indexOf(jam.tone)} onChange={(i) => jam.setTone(["acoustic", "electric", "rhodes", "vibes", "organ"][i])} size={12} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...SEGLABEL, marginBottom: 5, textAlign: "center" }}>드럼</div>
                <VWheel items={DRUM_FEELS.map((f) => f.name)} value={jam.drumFeel} onChange={(i) => jam.setDrumFeel(i)} size={13} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => jam.setPlaying(!jam.playing)} style={{ padding: "9px 24px", borderRadius: 999, cursor: "pointer", fontSize: 14, fontWeight: 800, background: jam.playing ? C.brass : "transparent", color: jam.playing ? C.bg : C.brass, border: `1px solid ${C.brass}` }}>{jam.playing ? "■ 정지" : "▶ 잼 시작"}</button>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: C.muted }}>BPM</span><input type="range" min="60" max="200" value={jam.bpm} onChange={(e) => jam.setBpm(+e.target.value)} style={{ width: 110, accentColor: C.brass }} /><span style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, fontWeight: 700, color: C.text, minWidth: 30 }}>{jam.bpm}</span></div>
            </div>
          </div>
        </div>
      )}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 62, height: 46, zIndex: 52, background: C.panel }}>
        <div onClick={() => setOpen((o) => !o)} style={{ maxWidth: 440, margin: "0 auto", height: "100%", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", cursor: "pointer", boxSizing: "border-box" }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: jam.playing ? C.teal : C.dim, display: "inline-block", flexShrink: 0 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.16em", color: C.dim, textTransform: "uppercase" }}>251 잼 세션</div>
            <div style={{ fontSize: 12.5, color: jam.playing ? C.text : C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{keyName} · {formName}</div>
          </div>
          <span style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
            <button onClick={(e) => { e.stopPropagation(); jam.setPlaying(!jam.playing); }} style={{ width: 32, height: 32, borderRadius: 999, border: `1px solid ${C.brass}`, background: jam.playing ? C.brass : "transparent", color: jam.playing ? C.bg : C.brass, cursor: "pointer", fontSize: 12, fontWeight: 800 }}>{jam.playing ? "■" : "▶"}</button>
            <span style={{ color: C.dim, fontSize: 13 }}>{open ? "▾" : "▴"}</span>
          </span>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════
//  ① 5도권 디코더
// ══════════════════════════════════════════════════════
function Decoder() {
  const jam = useJam();
  const [rotation, setRotation] = useState(() => -jam.keyIdx * STEP);
  const rotRef = useRef(-jam.keyIdx * STEP), rafRef = useRef(0), dragRef = useRef(null), svgRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [openProg, setOpenProg] = useState(null);
  const [progOpen, setProgOpen] = useState(false);
  const [diaMode, setDiaMode] = useState("maj");
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = typeof window !== "undefined" && window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const apply = useCallback((v) => { rotRef.current = v; setRotation(v); }, []);
  const selected = ((Math.round(-rotation / STEP)) % N + N) % N;
  const key = KEYS[selected];
  // 나란한조 모드: 같은 7코드를 6번째(vi)부터 돌려 i-ii°-III-iv-v-VI-VII 순서·도수로 표시
  const MIN_NUM = ["i", "ii°", "III", "iv", "v", "VI", "VII"];
  const diaChords = diaMode === "min"
    ? key.chords.slice(5).concat(key.chords.slice(0, 5)).map((c, i) => [MIN_NUM[i], c[1], c[2]])
    : key.chords;

  useEffect(() => { jam.setKeyIdx(selected); }, [selected]); // 다이얼 → 공용 잼 키

  const animateTo = useCallback((target) => {
    cancelAnimationFrame(rafRef.current);
    const start = rotRef.current, change = target - start;
    const dur = reduced.current ? 0 : 380;
    if (dur === 0) { apply(target); return; }
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      apply(start + change * (1 - Math.pow(1 - p, 3)));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [apply]);

  const selRef = useRef(selected); selRef.current = selected;
  // 시트 등 외부에서 잼 키가 바뀌면 다이얼을 그 키로 회전(최단 경로)
  useEffect(() => {
    if (jam.keyIdx !== selRef.current) animateTo(nearestAngle(-jam.keyIdx * STEP, rotRef.current));
  }, [jam.keyIdx, animateTo]);

  const angleOf = (cx, cy) => {
    const r = svgRef.current.getBoundingClientRect();
    return Math.atan2(cy - (r.top + r.height / 2), cx - (r.left + r.width / 2)) * 180 / Math.PI;
  };
  const onDown = (e) => {
    cancelAnimationFrame(rafRef.current);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startAngle: angleOf(e.clientX, e.clientY), startRot: rotRef.current, moved: false };
    setDragging(true);
  };
  const onMove = (e) => {
    if (!dragRef.current) return;
    const delta = angleOf(e.clientX, e.clientY) - dragRef.current.startAngle;
    if (Math.abs(delta) > 1) dragRef.current.moved = true;
    apply(dragRef.current.startRot + delta);
  };
  const onUp = (e) => {
    if (!dragRef.current) return;
    const d = dragRef.current;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    dragRef.current = null; setDragging(false);
    const snap = Math.round(rotRef.current / STEP) * STEP;
    if (d.moved) { animateTo(snap); return; }
    const rect = svgRef.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2), dy = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy);
    if (dist < (R_HUB / 400) * rect.width || dist > (R_RING / 400) * rect.width + 10) { animateTo(snap); return; }
    const S = Math.atan2(dy, dx) * 180 / Math.PI;
    const i = ((Math.round((S + 90 - rotRef.current) / STEP)) % N + N) % N;
    animateTo(nearestAngle(-i * STEP, rotRef.current));
  };

  const labels = KEYS.map((k, i) => {
    const theta = (i * STEP + rotation - 90) * Math.PI / 180;
    return { k, i, x: CX + R_LABEL * Math.cos(theta), y: CY + R_LABEL * Math.sin(theta) };
  });
  const sigText = key.sig.t === "none" ? "없음 (내추럴)"
    : `${key.sig.t === "sharp" ? "샤프 ♯" : "플랫 ♭"} ${key.sig.n}개 · ${key.sig.notes.join("  ")}`;

  const playProgression = (deg) => {
    const chords = deg.map((di) => {
      const rpc = (KEY_PC[selected] + MAJ_DEG[di]) % 12;
      return (TRIAD[key.chords[di][2]] || TRIAD.maj).map((x) => 48 + rpc + x);
    });
    sequence(chords);
  };

  return (
    <Screen>
      <div style={{ textAlign: "center", marginBottom: 2 }}>
        <div style={{ fontSize: 12.5, color: C.dim }}>다이얼을 돌려 키를 맞추세요</div>
      </div>
      <div style={{ position: "relative", width: "100%", maxWidth: 380, margin: "10px auto 0" }}>
        <svg ref={svgRef} viewBox="0 0 400 400"
          style={{ width: "100%", height: "auto", display: "block", touchAction: "none", cursor: dragging ? "grabbing" : "grab" }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <circle cx={CX} cy={CY} r={R_RING} fill={C.panel} stroke={C.brass} strokeOpacity="0.5" strokeWidth="2" />
          <circle cx={CX} cy={CY} r={R_RING - 12} fill="none" stroke={C.ring} strokeWidth="1" />
          {labels.map(({ i }) => {
            const a = (i * STEP + rotation - 90 + STEP / 2) * Math.PI / 180;
            return <line key={"d" + i} x1={CX + (R_HUB + 6) * Math.cos(a)} y1={CY + (R_HUB + 6) * Math.sin(a)}
              x2={CX + (R_RING - 14) * Math.cos(a)} y2={CY + (R_RING - 14) * Math.sin(a)} stroke={C.ring} strokeWidth="1" strokeOpacity="0.6" />;
          })}
          <g style={{ pointerEvents: "none" }}>
            {labels.map(({ k, i, x, y }) => {
              const on = i === selected;
              return (
                <g key={"l" + i}>
                  {on && <circle cx={x} cy={y} r={22} fill={C.brass} fillOpacity="0.16" stroke={C.brass} strokeWidth="1.4" />}
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontFamily="ui-sans-serif, system-ui, sans-serif"
                    fontSize={on ? 20 : 16} fontWeight={on ? 800 : 600} fill={on ? C.brass : C.muted}>{k.short}</text>
                </g>
              );
            })}
          </g>
          <circle cx={CX} cy={CY} r={R_HUB} fill={C.hub} stroke={C.ring} strokeWidth="1.5" />
          <text x={CX} y={CY - 8} textAnchor="middle" dominantBaseline="central" fontSize={key.name.length > 3 ? 30 : 46} fontWeight="800" fill={C.text} letterSpacing="-0.02em">{key.name}</text>
          <text x={CX} y={CY + 26} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="0.2em" fill={C.muted}>KEY</text>
          <polygon points={`${CX - 11},14 ${CX + 11},14 ${CX},34`} fill={C.brass} />
        </svg>
      </div>
      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <SectionLabel>다이어토닉 코드</SectionLabel>
          <div style={{ ...SEG, marginLeft: "auto" }}>
            {[["maj", "메이저"], ["min", key.rel]].map(([id, label]) => {
              const on = diaMode === id;
              return (<button key={id} onClick={() => setDiaMode(id)} style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "4px 11px", fontSize: 11.5, fontWeight: on ? 800 : 600, background: on ? C.brass : "transparent", color: on ? C.bg : C.muted }}>{label}</button>);
            })}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginTop: 8 }}>
          {diaChords.map(([num, name, q], idx) => (
            <div key={idx} style={{ background: C.panel, borderTop: `3px solid ${QCOLOR[q]}`, borderRadius: 8, padding: "8px 2px 9px", textAlign: "center", minWidth: 0 }}>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, color: C.muted }}>{num}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: QCOLOR[q], marginTop: 3, whiteSpace: "nowrap" }}>{name}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: C.muted, marginTop: 8 }}>
          {diaMode === "min" ? `같은 코드들, 중심만 ${key.rel}로 옮긴 순서 (나란한조)` : "메이저 키 기준 순서"}
        </div>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
          {["maj", "min", "dim"].map((q) => (
            <span key={q} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.muted }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: QCOLOR[q], display: "inline-block" }} />{QLABEL[q]}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
        <InfoCard label="조표 (Key Signature)" value={sigText} />
        <InfoCard label="나란한조 (Relative minor)" value={key.rel} accent={C.teal} />
      </div>
      <div style={{ marginTop: 16 }}>
        <button onClick={() => setProgOpen((o) => !o)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: C.panel, border: `1px solid ${progOpen ? C.brass : "transparent"}`, borderRadius: 10, padding: "13px 14px", cursor: "pointer", textAlign: "left", boxSizing: "border-box" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.18em", color: C.muted, textTransform: "uppercase" }}>추천 코드 진행</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: progOpen ? C.brass : C.text, marginTop: 3 }}>{PROGRESSIONS.length}개 진행 {progOpen ? "닫기" : "보기"}</div>
          </div>
          <span style={{ marginLeft: "auto", color: progOpen ? C.brass : C.muted, fontSize: 14, transform: progOpen ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}>▾</span>
        </button>
        {progOpen && (<>
        <div style={{ fontSize: 11.5, color: C.muted, marginTop: 8 }}>카드를 누르면 이어가기 좋은 진행이 펼쳐집니다</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {PROGRESSIONS.map((p, pi) => {
            const open = openProg === pi;
            return (
              <div key={pi} style={{ background: C.panel, border: `1px solid ${open ? C.brass : "transparent"}`, borderRadius: 10, overflow: "hidden" }}>
                <div onClick={() => setOpenProg(open ? null : pi)} style={{ padding: "10px 13px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ minWidth: 0 }}><ProgRow deg={p.deg} keyData={key} big /></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 1 }}>
                      <button onClick={(e) => { e.stopPropagation(); playProgression(p.deg); }} title="진행 듣기" style={{ width: 30, height: 30, borderRadius: 999, cursor: "pointer", border: `1px solid ${C.brass}`, background: "transparent", color: C.brass, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}>▶</button>
                      <span style={{ color: open ? C.brass : C.muted, fontSize: 12, display: "inline-block", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <span style={{ fontSize: 12.5, color: C.text, opacity: 0.85 }}>{p.mood}</span>
                    <span style={{ fontSize: 11, color: C.muted, fontFamily: "ui-monospace, monospace", letterSpacing: "0.04em", borderRadius: 999, padding: "2px 10px", whiteSpace: "nowrap" }}>{p.genre}</span>
                  </div>
                </div>
                {open && (
                  <div style={{ background: C.bg, padding: "10px 13px 12px" }}>
                    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.18em", color: C.muted, textTransform: "uppercase", marginBottom: 9 }}>이어가기 좋은 진행</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                      {p.next.map((nx, ni) => (
                        <div key={ni} style={{ borderLeft: `2px solid ${C.brass}`, paddingLeft: 11 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div style={{ minWidth: 0 }}><ProgRow deg={nx.deg} keyData={key} /></div>
                            <button onClick={(e) => { e.stopPropagation(); playProgression(nx.deg); }} title="진행 듣기" style={{ width: 26, height: 26, borderRadius: 999, cursor: "pointer", border: `1px solid ${C.brass}`, background: "transparent", color: C.brass, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}>▶</button>
                          </div>
                          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{nx.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </>)}
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════
//  ② 코드 사전 (오픈 + 이동식 바레)
// ══════════════════════════════════════════════════════
function ChordFretboard({ voicing }) {
  const W = 250, ROWS = 5, H = 300;
  const padL = 34, padR = 24, padTop = 48, padBot = 14;
  const xOf = (i) => padL + i * ((W - padL - padR) / 5);
  const nutY = padTop, gap = (H - padBot - nutY) / ROWS;
  const s = voicing.s;
  const sounded = s.map((x) => x[0]).filter((f) => f > 0);
  const minF = sounded.length ? Math.min(...sounded) : 0;
  const hasOpen = s.some(([f]) => f === 0);
  const start = (hasOpen || minF <= 1) ? 0 : minF; // 0이면 너트 표시
  const rowY = (f) => start === 0 ? nutY + (f - 0.5) * gap : nutY + (f - start + 0.5) * gap;

  // 바레: 이동식 코드이고 base 프렛에 2줄 이상 눌릴 때
  let barre = null;
  if (voicing.barre && voicing.base > 0) {
    const atBase = [];
    s.forEach(([f], i) => { if (f === voicing.base) atBase.push(i); });
    if (atBase.length >= 2) barre = { fret: voicing.base, lo: Math.min(...atBase), hi: Math.max(...atBase) };
  }
  const shownFrets = start === 0 ? [1, 2, 3, 4, 5] : [start, start + 1, start + 2, start + 3, start + 4];
  const midX = (xOf(0) + xOf(5)) / 2;
  const INLAY = [3, 5, 7, 9, 12];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 290, height: "auto", display: "block", margin: "0 auto" }}>
      <rect x={padL - 8} y={nutY} width={W - padL - padR + 16} height={ROWS * gap} rx="4" fill={C.neck} />
      {Array.from({ length: ROWS }, (_, k) => k + 1).map((n) => (
        <line key={n} x1={padL - 8} y1={nutY + n * gap} x2={W - padR + 8} y2={nutY + n * gap} stroke={C.fretwire} strokeWidth="2" />
      ))}
      {start === 0 && <rect x={padL - 8} y={nutY - 3} width={W - padL - padR + 16} height="5" fill="#C9B79A" />}
      {shownFrets.filter((f) => INLAY.includes(f)).map((f) => (
        f === 12
          ? <g key={"in" + f}><circle cx={midX - 9} cy={rowY(f)} r="3.4" fill={C.muted} fillOpacity="0.55" /><circle cx={midX + 9} cy={rowY(f)} r="3.4" fill={C.muted} fillOpacity="0.55" /></g>
          : <circle key={"in" + f} cx={midX} cy={rowY(f)} r="3.4" fill={C.muted} fillOpacity="0.55" />
      ))}
      {shownFrets.map((f) => (
        <text key={"fl" + f} x={padL - 20} y={rowY(f)} textAnchor="middle" dominantBaseline="central" fontFamily="ui-monospace, monospace" fontSize="9.5" fill={INLAY.includes(f) ? C.brass : C.muted}>{f}</text>
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={"s" + i} x1={xOf(i)} y1={nutY} x2={xOf(i)} y2={nutY + ROWS * gap} stroke={C.string} strokeWidth={3 - i * 0.32} strokeOpacity="0.85" />
      ))}
      {/* 개방현/뮤트 마커 */}
      {s.map(([f], i) => {
        const cy = nutY - 20;
        if (f === -1) return <text key={"m" + i} x={xOf(i)} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="700" fill={C.mute}>✕</text>;
        if (f === 0 && start === 0) return <circle key={"o" + i} cx={xOf(i)} cy={cy} r="7" fill="none" stroke={C.text} strokeWidth="1.6" />;
        return null;
      })}
      {/* 바레 막대 */}
      {barre && (
        <rect x={xOf(barre.lo) - 11} y={rowY(barre.fret) - 11} width={xOf(barre.hi) - xOf(barre.lo) + 22} height="22" rx="11" fill={C.brass} />
      )}
      {/* 운지 점 */}
      {s.map(([f, fin], i) => {
        if (f <= 0) return null;
        if (barre && f === barre.fret && i >= barre.lo && i <= barre.hi) return null; // 막대가 대신 표시
        return (
          <g key={"d" + i}>
            <circle cx={xOf(i)} cy={rowY(f)} r="12.5" fill={C.brass} />
            {voicing.open && fin > 0 && <text x={xOf(i)} y={rowY(f)} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="800" fill={C.bg}>{fin}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function ChordDictionary() {
  const [root, setRoot] = useState(0);   // C
  const [ti, setTi] = useState(0);       // maj
  const [bass, setBass] = useState(null); // 슬래시 베이스 (null = 없음)
  const [pos, setPos] = useState(0);
  const type = CHORD_TYPES[ti];
  const voicings = buildVoicings(root, type.id, bass);
  const p = voicings.length ? Math.min(pos, voicings.length - 1) : 0;
  const voicing = voicings[p];
  const title = ROOTS[root] + type.sym + (bass !== null ? " / " + ROOTS[bass] : "");
  const playChord = () => {
    if (!voicing) return;
    const midis = voicing.s.map((x, i) => (x[0] >= 0 ? OPEN_MIDI[i] + x[0] : null)).filter((m) => m !== null);
    strum(midis);
  };

  return (
    <Screen>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: "0 0 27%", minWidth: 0 }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.16em", color: C.muted, textTransform: "uppercase", marginBottom: 5, textAlign: "center" }}>루트</div>
          <VWheel items={ROOTS} value={root} onChange={(i) => { setRoot(i); setPos(0); }} size={17} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.16em", color: C.muted, textTransform: "uppercase", marginBottom: 5, textAlign: "center" }}>타입</div>
          <VWheel items={CHORD_TYPES.map((t) => t.label)} value={ti} onChange={(i) => { setTi(i); setPos(0); }} size={15} />
        </div>
        <div style={{ flex: "0 0 27%", minWidth: 0 }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.16em", color: C.muted, textTransform: "uppercase", marginBottom: 5, textAlign: "center" }}>베이스</div>
          <VWheel items={["없음", ...ROOTS]} value={bass === null ? 0 : bass + 1} onChange={(i) => { setBass(i === 0 ? null : i - 1); setPos(0); }} size={15} />
        </div>
      </div>

      <div style={{ background: C.panel, borderRadius: 14, padding: "16px 12px 12px" }}>
        <div style={{ textAlign: "center", fontSize: 30, fontWeight: 800, marginBottom: 10, letterSpacing: "-0.01em" }}>{title}</div>

        {voicing && voicings.length > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {voicings.map((v, i) => (
              <button key={i} onClick={() => setPos(i)} style={{ padding: "5px 11px", borderRadius: 999, cursor: "pointer", fontSize: 11.5, fontWeight: 700, background: i === p ? C.hub : "transparent", color: i === p ? C.brass : C.muted, border: `1px solid ${i === p ? C.brass : "transparent"}` }}>{v.label}</button>
            ))}
          </div>
        )}

        {voicing && <ChordFretboard voicing={voicing} />}

        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <button onClick={playChord} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 700, background: "transparent", color: C.brass, border: `1px solid ${C.brass}` }}>▶ 코드 듣기</button>
        </div>

        <div style={{ textAlign: "center", fontSize: 11.5, color: C.muted, marginTop: 12 }}>
          {voicing && voicing.slash ? "최저음(가장 굵은 줄) = 베이스 " + ROOTS[bass] + " · 나머지 = 코드 구성음"
            : voicing && voicing.open ? "숫자 = 손가락 번호 · ○ 개방현 · ✕ 안 침"
            : voicing && voicing.barre ? "가로 막대 = 바레(검지로 한 프렛 전체 누르기) · ✕ 안 침"
            : "✕ 표시된 줄은 뮤트(치지 않음) · 펑크 커팅에 좋아요"}
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: 11.5, color: C.muted, marginTop: 12 }}>
        왼쪽이 저음(6번 줄) · 오른쪽이 고음(1번 줄)
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════
//  ③ 스케일 (도수 / 음이름 토글)
// ══════════════════════════════════════════════════════
function ScaleBoard({ rootPC, scale, labelMode, mode, boxStart, only, path }) {
  const W = 272, FRETS = 15;
  const padL = 30, padR = 18, padTop = 42, padBot = 16;
  const xOf = (i) => padL + i * ((W - padL - padR) / 5);
  const nutY = padTop, fretGap = 33;
  const H = nutY + FRETS * fretGap + padBot;
  const fretY = (n) => nutY + n * fretGap;
  const dotY = (f) => nutY + (f - 0.5) * fretGap;
  const openY = nutY - 20, midX = (xOf(0) + xOf(5)) / 2;
  const map = {}; scale.notes.forEach((n) => { map[n.iv] = n.deg; });

  const dots = [];
  for (let i = 0; i < 6; i++) {
    for (let f = 0; f <= FRETS; f++) {
      const pc = (OPEN_PC[i] + f) % 12;
      const iv = ((pc - rootPC) % 12 + 12) % 12;
      if (map[iv] === undefined) continue;
      if (mode === "box" && (f < boxStart || f > boxStart + 4)) continue;
      if (only && !only.has(i + "-" + f)) continue;
      const label = labelMode === "note" ? noteName(rootPC, pc) : map[iv];
      dots.push({ x: xOf(i), y: f === 0 ? openY : dotY(f), label, isRoot: iv === 0, key: i + "-" + f });
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 320, height: "auto", display: "block", margin: "0 auto" }}>
      <rect x={padL - 8} y={nutY} width={W - padL - padR + 16} height={FRETS * fretGap} rx="4" fill={C.neck} />
      {mode === "box" && (() => {
        const top = boxStart === 0 ? nutY - 30 : nutY + (boxStart - 1) * fretGap;
        const bot = Math.min(nutY + FRETS * fretGap, nutY + (boxStart + 4) * fretGap);
        return <rect x={padL - 8} y={top} width={W - padL - padR + 16} height={bot - top} fill={C.brass} fillOpacity="0.08" />;
      })()}
      {Array.from({ length: FRETS }, (_, k) => k + 1).map((n) => (
        <line key={n} x1={padL - 8} y1={fretY(n)} x2={W - padR + 8} y2={fretY(n)} stroke={C.fretwire} strokeWidth="1.6" />
      ))}
      {[3, 5, 7, 9, 15].map((n) => <circle key={"in" + n} cx={midX} cy={dotY(n)} r="3.2" fill={C.muted} fillOpacity="0.5" />)}
      <circle cx={midX - 9} cy={dotY(12)} r="3.2" fill={C.muted} fillOpacity="0.5" />
      <circle cx={midX + 9} cy={dotY(12)} r="3.2" fill={C.muted} fillOpacity="0.5" />
      {Array.from({ length: FRETS }, (_, k) => k + 1).map((n) => (
        <text key={"fn" + n} x={padL - 18} y={dotY(n)} textAnchor="middle" dominantBaseline="central" fontFamily="ui-monospace, monospace" fontSize="9" fill={C.muted}>{n}</text>
      ))}
      <rect x={padL - 8} y={nutY - 3} width={W - padL - padR + 16} height="5" fill="#C9B79A" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={"s" + i} x1={xOf(i)} y1={nutY} x2={xOf(i)} y2={nutY + FRETS * fretGap} stroke={C.string} strokeWidth={2.6 - i * 0.28} strokeOpacity="0.8" />
      ))}
      {path && path.length > 1 && (
        <polyline fill="none" stroke={C.brass} strokeWidth="1.6" strokeOpacity="0.6" strokeDasharray="4 3"
          points={path.map((k) => { const [i, f] = k.split("-").map(Number); return xOf(i) + "," + (f === 0 ? openY : dotY(f)); }).join(" ")} />
      )}
      {dots.map((d) => (
        <g key={d.key}>
          <circle cx={d.x} cy={d.y} r="11" fill={d.isRoot ? C.brass : C.hub} stroke={d.isRoot ? C.brass : C.teal} strokeWidth="1.5" />
          <text x={d.x} y={d.y} textAnchor="middle" dominantBaseline="central" fontSize={d.label.length > 1 ? 8.5 : 9.5} fontWeight="800" fill={d.isRoot ? C.bg : C.teal}>{d.label}</text>
        </g>
      ))}
    </svg>
  );
}

// 스케일 탭 ↔ 잼 연결 (간결판): 기본은 한 줄, 코드별은 접기, 잼 제안은 버튼 하나
// C안: "내가 보는 스케일" ↔ "도는 잼"을 대칭으로 놓고, 각자 상대를 맞추는 버튼을 가짐
function JamScaleLink({ jam, root, sc, scale, setRoot, setSc, setPosIdx, jamBest }) {
  const [open, setOpen] = useState(false);
  const form = JAM_FORMS[jam.form];
  const keyPC = KEY_PC[jam.keyIdx];
  const ks = jamKeyScale(form, keyPC);
  const onKeyScale = root === ks.root && sc === ks.sc;
  const scaleSet = new Set(scale.notes.map((n) => (root + n.iv) % 12));
  const chordInfo = form.chords.map((ch) => {
    const cr = (keyPC + ch.deg) % 12;
    const miss = FORMULA[ch.type].map((iv) => (cr + iv) % 12).filter((pc) => !scaleSet.has(pc));
    const r = jamChordScale(form, keyPC, ch);
    return { chord: `${noteName(keyPC, cr)}${JAM_SYM[ch.type]}`, miss, root: r.root, sc: r.sc, note: r.note };
  });
  const warn = chordInfo.filter((c) => c.miss.length);
  const status = warn.length === 0
    ? { ok: true, text: "지금 잼에 그대로 통함" }
    : warn.length === 1
      ? { ok: false, text: `${warn[0].chord}만 주의 — ${warn[0].miss.map((pc) => noteName(keyPC, pc)).join(", ")} 없음` }
      : { ok: false, text: "둘이 안 맞음 — 한쪽을 맞춰보세요" };
  const colStyle = { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 };
  const capStyle = { fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.12em", color: C.dim, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 };
  const btnStyle = (col) => ({ cursor: "pointer", borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 700, background: "transparent", color: col, border: `1px solid ${col}`, whiteSpace: "nowrap", alignSelf: "flex-start" });
  return (
    <div style={{ background: C.panel, borderRadius: 12, padding: "11px 12px", marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 11, alignItems: "stretch" }}>
        <div style={colStyle}>
          <div style={capStyle}>선택한 스케일</div>
          <div style={{ fontSize: 13, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ROOTS[root]} {scale.name}</div>
          {jamBest && (
            <button onClick={() => { jam.setKeyIdx(jamBest.keyIdx); jam.setForm(jamBest.formIdx); if (!jam.playing) jam.setPlaying(true); }} style={btnStyle(C.teal)}>▶ 이걸로 잼 틀기</button>
          )}
        </div>
        <div style={{ width: 1, background: C.ring, flexShrink: 0 }} />
        <div style={colStyle}>
          <div style={capStyle}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: jam.playing ? C.teal : C.dim, display: "inline-block", flexShrink: 0 }} />
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>251 잼 세션 · {jam.playing ? "재생 중" : "멈춤"}</span>
          </div>
          <div style={{ fontSize: 13, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{KEYS[jam.keyIdx].short} · {form.name}</div>
          {!onKeyScale && (
            <button onClick={() => { setRoot(ks.root); setSc(ks.sc); setPosIdx(0); }} style={btnStyle(C.brass)}>{ROOTS[ks.root]} {SCALES[ks.sc].name} 보기</button>
          )}
        </div>
      </div>
      <div style={{ marginTop: 9 }}>
        <span style={{ display: "inline-block", fontSize: 11, borderRadius: 6, padding: "3px 8px", background: status.ok ? C.tealBg : C.roseBg, color: status.ok ? C.tealText : C.roseText }}>{status.text}</span>
      </div>
      <button onClick={() => setOpen((o) => !o)} style={{ marginTop: 8, cursor: "pointer", border: "none", background: "transparent", color: C.dim, fontSize: 11.5, padding: 0 }}>
        {open ? "▾" : "▸"} 코드별 스케일 보기
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {chordInfo.map((c, i) => {
            const on = c.root === root && c.sc === sc;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => { setRoot(c.root); setSc(c.sc); setPosIdx(0); }}
                  style={{ cursor: "pointer", borderRadius: 8, padding: "4px 9px", fontSize: 12, fontWeight: on ? 800 : 600, background: on ? C.hub : "transparent", color: on ? C.brass : C.text, border: `1px solid ${on ? C.brass : "transparent"}`, whiteSpace: "nowrap" }}>
                  {c.chord} → {ROOTS[c.root]} {SCALES[c.sc].name}
                </button>
                {c.miss.length > 0 && <span style={{ fontSize: 10.5, color: C.roseText }}>{c.miss.map((pc) => noteName(keyPC, pc)).join(", ")} 없음</span>}
              </div>
            );
          })}
          {chordInfo.some((c) => c.note) && (
            <div style={{ fontSize: 10.5, color: C.dim, marginTop: 2, lineHeight: 1.5 }}>
              {chordInfo.filter((c) => c.note).map((c, i) => <div key={i}>· {c.chord}: {c.note}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Scales() {
  const jam = useJam();
  const [root, setRoot] = useState(9); // A
  const [sc, setSc] = useState(3);     // 마이너 펜타토닉
  const [labelMode, setLabelMode] = useState("deg");
  const [view, setView] = useState("all");
  const [posIdx, setPosIdx] = useState(0);
  const scale = SCALES[sc];
  const jamBest = (() => {
    const cur = JAM_FORMS[jam.form];
    const keyPc = KEY_PC[jam.keyIdx];
    const set = new Set(scale.notes.map((n) => (root + n.iv) % 12));
    // 지금 잼의 모든 코드음이 이 스케일에 있으면 이미 잘 맞음 → 버튼 숨김 (미니바 안내와 같은 기준)
    const allCovered = cur.chords.every((ch) => {
      const cr = (keyPc + ch.deg) % 12;
      return FORMULA[ch.type].every((iv) => set.has((cr + iv) % 12));
    });
    if (allCovered) return null;
    const b = jamForScale(root, sc)[0];
    if (!b) return null;
    if (b.keyIdx === jam.keyIdx && b.formIdx === jam.form) return null;
    return b;
  })();
  const ivset = new Set(scale.notes.map((n) => n.iv));
  const is7 = scale.notes.length === 7;
  const effView = (view === "nps" && !is7) ? "all" : view;
  const CAGED_SCALES = new Set(["메이저", "메이저 펜타토닉", "마이너 펜타토닉"]);
  const isCaged = CAGED_SCALES.has(scale.name);
  const N = scale.notes.length;
  const e6 = (root - 4 + 12) % 12;
  const boxAnchors = [];
  for (let f = 0; f <= 15; f++) { if (ivset.has(((4 + f - root) % 12 + 12) % 12)) boxAnchors.push(f); }
  const npsAnchors = [];
  for (let f = 0; f < 12; f++) { if (ivset.has(((4 + f - root) % 12 + 12) % 12)) npsAnchors.push(f); }
  const cagedPos = [["C", 4], ["A", 7], ["G", 9], ["E", 11], ["D", 2]].map(([sh, off]) => ({ start: (e6 + off) % 12, label: sh + "폼" })).sort((a, b) => a.start - b.start);

  const build3nps = (f0) => {
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
  };

  // 대각선: 루트에서 시작, 줄당 배치를 스케일에 맞춰 자동 계산(펜타=2·3, 7음=3·4), 옥타브마다 넥 위로
  const inS = (a) => ivset.has((((a % 12) - root) % 12 + 12) % 12);
  const diagFrom = (s0, f0) => {
    const per = Math.floor(N / 2);
    const strings = []; for (let s = s0; s < 6; s++) strings.push(s);
    const counts = strings.map((_, i) => (i % 2 === 0 ? per : N - per));
    const total = counts.reduce((a, b) => a + b, 0);
    let c = OPEN_MIDI[s0] + f0; const notes = [c];
    while (notes.length < total) { c++; if (inS(c)) notes.push(c); }
    const seq = []; let k = 0, ok = true;
    strings.forEach((s, idx) => { for (let n = 0; n < counts[idx]; n++) { const fr = notes[k] - OPEN_MIDI[s]; k++; if (fr < 0 || fr > 15) ok = false; seq.push({ key: s + "-" + fr, pitch: OPEN_MIDI[s] + fr }); } });
    return ok ? seq : null;
  };
  let diagPositions = [];
  if (effView === "diag") {
    const seen = new Set();
    for (const s0 of [0, 1]) for (let f = 0; f <= 12; f++) {
      const pc = (OPEN_MIDI[s0] + f) % 12;
      if (!inS(OPEN_MIDI[s0] + f)) continue;
      const seq = diagFrom(s0, f);
      if (!seq) continue;
      const sig = seq.map((x) => x.key).join("|");
      if (seen.has(sig)) continue; seen.add(sig);
      diagPositions.push({ s0, start: f, pc, seq, isRoot: pc === root });
    }
    diagPositions.sort((a, b) => {
      const pr = (x) => (x.isRoot && x.start >= 3 && x.start <= 12) ? 0 : x.isRoot ? 1 : 2;
      return pr(a) - pr(b) || a.start - b.start || a.s0 - b.s0;
    });
  }

  const positions = effView === "box"
    ? (isCaged ? cagedPos : boxAnchors.map((f) => ({ start: f, label: null })))
    : effView === "nps" ? npsAnchors.map((f) => ({ start: f, label: "3음/줄" }))
    : effView === "diag" ? diagPositions.map((d) => ({ start: d.start, seq: d.seq, label: (6 - d.s0) + "번줄 " + noteName(root, d.pc) + (d.isRoot ? " (루트)" : "") }))
    : [];
  const pIdx = positions.length ? Math.min(posIdx, positions.length - 1) : 0;
  const boxStart = positions[pIdx] ? positions[pIdx].start : 0;
  const boxLabel = positions[pIdx] ? positions[pIdx].label : null;
  const diagSeq = effView === "diag" && positions[pIdx] ? positions[pIdx].seq : null;
  const diagPath = diagSeq ? diagSeq.map((x) => x.key) : null;
  const only = effView === "nps" ? build3nps(boxStart) : effView === "diag" ? new Set(diagPath) : null;

  const playBox = () => {
    const midis = [];
    if (only) { only.forEach((k) => { const [i, f] = k.split("-").map(Number); midis.push(OPEN_MIDI[i] + f); }); }
    else { for (let i = 0; i < 6; i++) for (let f = boxStart; f <= boxStart + 4; f++) { if (ivset.has(((OPEN_PC[i] + f - root) % 12 + 12) % 12)) midis.push(OPEN_MIDI[i] + f); } }
    midis.sort((a, b) => a - b);
    melody(midis, 0.22, 0.28);
  };
  const playScale = () => {
    const midis = scale.notes.map((n) => 48 + root + n.iv);
    midis.push(48 + root + 12);
    melody(midis);
  };
  return (
    <Screen>
      <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 12 }}>
        <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: C.text }}>{ROOTS[root]}</span>
        <span style={{ fontSize: 15, color: C.muted }}>{scale.name}</span>
      </div>

      <JamScaleLink jam={jam} root={root} sc={sc} scale={scale} setRoot={setRoot} setSc={setSc} setPosIdx={setPosIdx} jamBest={jamBest} />

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: "0 0 27%", minWidth: 0 }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.16em", color: C.muted, textTransform: "uppercase", marginBottom: 5, textAlign: "center" }}>루트</div>
          <VWheel items={ROOTS} value={root} onChange={(i) => { setRoot(i); setPosIdx(0); }} size={17} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.16em", color: C.muted, textTransform: "uppercase", marginBottom: 5, textAlign: "center" }}>스케일</div>
          <VWheel items={SCALES.map((s) => s.name)} value={sc} onChange={(i) => { setSc(i); setPosIdx(0); }} size={14} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.18em", color: C.muted, textTransform: "uppercase" }}>표시</span>
          <div style={{ display: "inline-flex", background: C.panel, borderRadius: 999, padding: 2 }}>
            {[["deg", "도수"], ["note", "음이름"]].map(([m, lbl]) => (
              <button key={m} onClick={() => setLabelMode(m)} style={{ padding: "5px 13px", borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: 700, border: "none", background: labelMode === m ? C.brass : "transparent", color: labelMode === m ? C.bg : C.muted }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.18em", color: C.muted, textTransform: "uppercase" }}>보기</span>
          <div style={{ display: "inline-flex", background: C.panel, borderRadius: 999, padding: 2 }}>
            {[["all", "전체"], ["box", "포지션"], ...(is7 ? [["nps", "3음/줄"]] : []), ["diag", "대각선"]].map(([m, lbl]) => (
              <button key={m} onClick={() => { setView(m); setPosIdx(0); }} style={{ padding: "5px 13px", borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: 700, border: "none", background: effView === m ? C.brass : "transparent", color: effView === m ? C.bg : C.muted }}>{lbl}</button>
            ))}
          </div>
        </div>
      </div>

      {positions.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 12 }}>
          <button onClick={() => setPosIdx(Math.max(0, pIdx - 1))} disabled={pIdx <= 0} style={{ width: 40, height: 36, borderRadius: 9, cursor: pIdx <= 0 ? "default" : "pointer", border: `1px solid ${C.ring}`, background: C.panel, color: pIdx <= 0 ? C.ring : C.text, fontSize: 15 }}>◀</button>
          <div style={{ textAlign: "center", minWidth: 150 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.brass }}>{boxLabel ? boxLabel + " · " : ""}포지션 {pIdx + 1} / {positions.length}</div>
            <div style={{ fontSize: 11.5, color: C.muted }}>{(() => { if (only && only.size) { const fr = [...only].map((k) => +k.split("-")[1]); return Math.min(...fr) + "~" + Math.max(...fr) + " 프렛"; } return boxStart + "~" + (boxStart + 4) + " 프렛"; })()}</div>
          </div>
          <button onClick={() => setPosIdx(Math.min(positions.length - 1, pIdx + 1))} disabled={pIdx >= positions.length - 1} style={{ width: 40, height: 36, borderRadius: 9, cursor: pIdx >= positions.length - 1 ? "default" : "pointer", border: `1px solid ${C.ring}`, background: C.panel, color: pIdx >= positions.length - 1 ? C.ring : C.text, fontSize: 15 }}>▶</button>
        </div>
      )}

      {effView === "diag" && (
        <div style={{ textAlign: "center", fontSize: 12, color: C.muted, marginBottom: 12 }}>
          루트에서 시작해 넥을 사선으로 상행 · ◀▶로 시작 위치(루트) 선택 · 점선 = 재생 순서
        </div>
      )}

      <div style={{ background: C.panel, borderRadius: 14, padding: "14px 8px 10px" }}>
        <ScaleBoard rootPC={root} scale={scale} labelMode={labelMode} mode={effView} boxStart={boxStart} only={only} path={effView === "diag" ? diagPath : null} />
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <button onClick={playScale} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 700, background: "transparent", color: C.brass, border: `1px solid ${C.brass}` }}>▶ 스케일 듣기</button>
          {effView !== "all" && <button onClick={playBox} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 700, background: "transparent", color: C.brass, border: `1px solid ${C.brass}` }}>▶ {effView === "nps" ? "포지션" : effView === "diag" ? "대각선" : "박스"} 듣기</button>}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10, flexWrap: "wrap", fontSize: 11.5, color: C.muted }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 13, height: 13, borderRadius: 999, background: C.brass, display: "inline-block" }} />루트</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 999, background: C.hub, border: `1.5px solid ${C.teal}`, display: "inline-block" }} />스케일 음</span>
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: 11.5, color: C.muted, marginTop: 12 }}>
        왼쪽이 저음(6번 줄) · 위가 너트 · 0~12프렛
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════
//  공통 UI
// ══════════════════════════════════════════════════════
function Screen({ children }) {
  return (
    <div style={{
      background: C.bg,
      minHeight: "100%", color: C.text, padding: "20px 16px 24px", boxSizing: "border-box",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    }}>
      <div style={{ maxWidth: 440, margin: "0 auto", width: "100%" }}>{children}</div>
    </div>
  );
}
function ProgRow({ deg, keyData, big }) {
  const size = big ? 17 : 15;
  return (
    <>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, color: C.dim, letterSpacing: "0.06em", marginBottom: 3 }}>
        {deg.map((di) => keyData.chords[di][0]).join("   ›   ")}
      </div>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        {deg.map((di, ci) => (
          <React.Fragment key={ci}>
            <span style={{ fontSize: size, fontWeight: 800, color: QCOLOR[keyData.chords[di][2]] }}>{keyData.chords[di][1]}</span>
            {ci < deg.length - 1 && <span style={{ color: C.dim, fontSize: 13, margin: "0 6px" }}>›</span>}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 10, letterSpacing: "0.2em", color: C.dim, textTransform: "uppercase" }}>{children}</div>
  );
}
function InfoCard({ label, value, accent }) {
  return (
    <div style={{ background: C.panel, borderRadius: 10, padding: "11px 13px" }}>
      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 9.5, letterSpacing: "0.14em", color: C.dim, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: accent || C.text, marginTop: 4 }}>{value}</div>
    </div>
  );
}
const IconWheel = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" /><line x1="12" y1="3" x2="12" y2="7" />
  </svg>
);
const IconChord = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="5" y="3" width="14" height="18" rx="2" /><line x1="5" y1="9" x2="19" y2="9" /><line x1="5" y1="15" x2="19" y2="15" />
    <line x1="9.7" y1="3" x2="9.7" y2="21" /><line x1="14.3" y1="3" x2="14.3" y2="21" />
    <circle cx="9.7" cy="12" r="1.8" fill="currentColor" stroke="none" />
  </svg>
);
const IconScale = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <line x1="4" y1="12" x2="20" y2="12" />
    <circle cx="6" cy="12" r="2" fill="currentColor" stroke="none" /><circle cx="12" cy="9" r="2" fill="currentColor" stroke="none" /><circle cx="18" cy="12" r="2" fill="currentColor" stroke="none" />
  </svg>
);

function TabBar({ tab, setTab }) {
  const tabs = [
    { id: "decoder", label: "디코더", Icon: IconWheel },
    { id: "chords", label: "코드 사전", Icon: IconChord },
    { id: "scales", label: "스케일", Icon: IconScale },
  ];
  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, height: 62, display: "flex", background: C.panel, borderTop: `1px solid ${C.ring}`, zIndex: 50 }}>
      {tabs.map(({ id, label, Icon }) => {
        const on = tab === id;
        return (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: on ? C.brass : C.muted, position: "relative", padding: 0 }}>
            {on && <span style={{ position: "absolute", top: 0, width: 26, height: 2.5, background: C.brass, borderRadius: 2 }} />}
            <Icon />
            <span style={{ fontSize: 11, fontWeight: on ? 700 : 500 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("decoder");
  return (
    <JamProvider>
      <style>{`.hwheel::-webkit-scrollbar{display:none}`}</style>
      <div style={{ position: "relative", minHeight: "100%", background: C.bg }}>
        <div style={{ paddingBottom: 112 }}>
          {tab === "decoder" && <Decoder />}
          {tab === "chords" && <ChordDictionary />}
          {tab === "scales" && <Scales />}
        </div>
        <JamBar />
        <TabBar tab={tab} setTab={setTab} />
      </div>
    </JamProvider>
  );
}
