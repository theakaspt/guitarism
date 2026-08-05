import { KEYS, KEY_PC, FORMULA, OPEN_MIDI } from "./notes.js";
import { SCALES } from "./scales.js";

export const JAM_SYM = { m7: "m7", "7": "7", maj7: "maj7", m7b5: "m7♭5" };
export const JAM_FORMS = [
  { name: "메이저 251", minor: false, chords: [{ deg: 2, type: "m7", bars: 1 }, { deg: 7, type: "7", bars: 1 }, { deg: 0, type: "maj7", bars: 2 }] },
  { name: "마이너 251", minor: true, chords: [{ deg: 11, type: "m7b5", bars: 1 }, { deg: 4, type: "7", bars: 1 }, { deg: 9, type: "m7", bars: 2 }] },
  { name: "메이저 턴어라운드", minor: false, chords: [{ deg: 0, type: "maj7", bars: 1 }, { deg: 9, type: "m7", bars: 1 }, { deg: 2, type: "m7", bars: 1 }, { deg: 7, type: "7", bars: 1 }] },
  { name: "마이너 턴어라운드", minor: true, chords: [{ deg: 9, type: "m7", bars: 1 }, { deg: 5, type: "maj7", bars: 1 }, { deg: 11, type: "m7b5", bars: 1 }, { deg: 4, type: "7", bars: 1 }] },
  { name: "I-VI7-ii-V", minor: false, chords: [{ deg: 0, type: "maj7", bars: 1 }, { deg: 9, type: "7", bars: 1 }, { deg: 2, type: "m7", bars: 1 }, { deg: 7, type: "7", bars: 1 }] },
  { name: "iii-VI7-ii-V", minor: false, chords: [{ deg: 4, type: "m7", bars: 1 }, { deg: 9, type: "7", bars: 1 }, { deg: 2, type: "m7", bars: 1 }, { deg: 7, type: "7", bars: 1 }] },
];
// ── 재즈 컴핑 보이싱 (드롭2류 4음, 바레 없음, 진행 내 보이스 리딩) ──
//  인접 4현(중4현 A D G B / 상4현 D G B E)에서 구성음 4개를 오름차순·손폭≤4로 배치.
export const COMP_SETS = [[1, 2, 3, 4], [2, 3, 4, 5]];
export function compCandidates(rootpc, type) {
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
export const _cCent = (v) => (v.midis[0] + v.midis[1] + v.midis[2] + v.midis[3]) / 4;
export const _cTop = (v) => v.midis[3]; // 오름차순이라 맨 위 음
export const _cVL = (a, b) => Math.abs(a.midis[0] - b.midis[0]) + Math.abs(a.midis[1] - b.midis[1]) + Math.abs(a.midis[2] - b.midis[2]) + Math.abs(a.midis[3] - b.midis[3]);
export const _cVLtop = (a, b) => Math.abs(_cTop(a) - _cTop(b));
// 보이싱 1개 선택: 직전과 있으면 멜로디(맨 위) 우선 + 안쪽 음, 없으면 시작 음역 앵커
export function _pickVoicing(cands, prev) {
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
// 보이싱 계산 결과를 "고른 후보 객체 그대로" 돌려준다.
// (midis 뿐 아니라 frets·set이 있어야 지판에 그릴 수 있다 — Phase 2 보이싱 보기용)
export function voiceProgressionFull(form, keyPC) {
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
  return pass2;
}
// 기존 호출부는 그대로 midis 배열만 받는다 (값·순서 동일)
export function voiceProgression(form, keyPC) {
  return voiceProgressionFull(form, keyPC).map((v) => v.midis);
}
// ── 컴핑 리듬 (스윙: 뒷박은 셋잇단 위치 x.66박) · b=박위치, d=음길이(박) ──
// ── 컴핑 리듬 (스윙: 뒷박은 셋잇단 위치 x.66박 / 스트레이트: x.5박) ──
//  b=박위치, d=음길이(박), bass=true면 낮은 2음만(엄지 베이스), bars=패턴 주기(기본 1마디)
export const COMP_RHYTHMS = [
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
export function jamTimeline(form, keyPC, rhythm, drumFeel) {
  const R = rhythm || COMP_RHYTHMS[0];
  const rBars = R.bars || 1;
  const voicings = voiceProgressionFull(form, keyPC);
  const voiced = voicings.map((v) => v.midis);
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
        timeline.push({ beat: (bar + b) * 4 + beatInBar, midis: h.bass ? low : midis, durBeats: h.d, ci });
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
  return { timeline, loopBeats: totalBars * 4, voicings };
}

// ── 잼 ↔ 스케일 연결 ──────────────────────────────────
// SCALES 인덱스: 0 메이저 / 1 내추럴마이너 / 8 도리안 / 9 믹솔리디안 / 10 리디안 / 12 로크리안 / 6 하모닉마이너
export const _scIv = (i) => SCALES[i].notes.map((n) => n.iv);
export const _covers = (scRoot, scIdx, chRoot, type) => {
  const s = new Set(_scIv(scIdx).map((x) => (scRoot + x) % 12));
  return FORMULA[type].every((iv) => s.has((chRoot + iv) % 12));
};
// 진행 전체를 훑는 "키 스케일" (마이너 폼은 나란한 단조)
export function jamKeyScale(form, keyPC) {
  return form.minor ? { root: (keyPC + 9) % 12, sc: 1 } : { root: keyPC, sc: 0 };
}
// 코드별 스케일 (문맥 반영). 반환 {root, sc, note}
export function jamChordScale(form, keyPC, ch) {
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
export const _MAJ_IV = [0, 2, 4, 5, 7, 9, 11], _MIN_IV = [0, 2, 3, 5, 7, 8, 10];
export const _BLUES_SC = new Set([4, 5]); // 메이저/마이너 블루스 인덱스
export function _keySet(form, keyPC) {
  const s = new Set(form.minor ? _MIN_IV.map((x) => (keyPC + 9 + x) % 12) : _MAJ_IV.map((x) => (keyPC + x) % 12));
  if (form.minor) s.add((keyPC + 9 + 11) % 12);        // 하모닉 마이너 리딩톤(V7의 3음)
  if (form.chords.some((c) => c.type === "7" && c.deg === 9)) s.add((keyPC + 9 + 4) % 12); // VI7의 3음(키 밖)
  return s;
}
export function _scaleFitsJam(root, scIdx, form, keyPC) {
  const ks = _keySet(form, keyPC);
  const outside = _scIv(scIdx).map((x) => (root + x) % 12).filter((n) => !ks.has(n)).length;
  return outside <= (_BLUES_SC.has(scIdx) ? 2 : 0);
}
export function jamForScale(root, scIdx) {
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
