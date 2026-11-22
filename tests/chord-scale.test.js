// 코드별 스케일(jamChordScale) 검산 — 이론 오류 수정 1차 3단계
// 6폼 × 12키 모든 코드에서: 코드 구성음을 다 품는가 / 코드 루트에서 시작하는가 / 키 밖 음이 없는가.
import { describe, it, expect } from "vitest";
import { KEY_PC, ROOTS, FORMULA } from "../src/theory/notes.js";
import { SCALES } from "../src/theory/scales.js";
import { JAM_FORMS, jamChordScale, jamForScale, _keySet } from "../src/theory/jam.js";

const isMinorV7 = (form, ch) => form.minor && ch.type === "7";
const MIX_B13 = SCALES.findIndex((s) => s.name === "믹솔리디안 ♭13");

describe("코드별 스케일", () => {
  it("새 스케일은 맨 끝(13번)에 있다 (저장된 번호가 안 바뀜)", () => {
    expect(SCALES.length).toBe(14);
    expect(MIX_B13).toBe(13);
    expect(SCALES[13].notes.map((n) => n.iv)).toEqual([0, 2, 4, 5, 7, 8, 10]);
  });

  it("6폼 × 12키의 모든 코드: 구성음 포함 · (마이너 V7 외) 루트 = 코드 루트 · (마이너 V7 외) 키 밖 음 0개", () => {
    let n = 0;
    for (const form of JAM_FORMS) for (let ki = 0; ki < 12; ki++) for (const ch of form.chords) {
      const keyPC = KEY_PC[ki];
      const cr = (keyPC + ch.deg) % 12;
      const r = jamChordScale(form, keyPC, ch);
      const label = `${form.name} ${ROOTS[keyPC]}키 ${ROOTS[cr]}${ch.type}`;
      const scalePcs = new Set(SCALES[r.sc].notes.map((x) => (r.root + x.iv) % 12));
      for (const iv of FORMULA[ch.type]) expect(scalePcs.has((cr + iv) % 12), `${label} 구성음 누락`).toBe(true);
      if (!isMinorV7(form, ch)) {
        expect(r.root, `${label} 루트`).toBe(cr);
        const ks = _keySet(form, keyPC);
        const outside = [...scalePcs].filter((pc) => !ks.has(pc));
        expect(outside, `${label} 키 밖 음`).toEqual([]);
      }
      n++;
    }
    expect(n).toBe(JAM_FORMS.reduce((a, f) => a + f.chords.length, 0) * 12); // 22 × 12 = 264
  });

  it("마이너 V7은 하모닉 마이너(나란한 단조 루트), VI7은 note 문구 유지", () => {
    const minorForms = JAM_FORMS.filter((f) => f.minor);
    for (const form of minorForms) for (let ki = 0; ki < 12; ki++) {
      const ch = form.chords.find((c) => c.type === "7");
      const r = jamChordScale(form, KEY_PC[ki], ch);
      expect(r.sc).toBe(6);
      expect(r.root).toBe((KEY_PC[ki] + 9) % 12);
      expect(r.note).toBeTruthy();
    }
    const vi7 = JAM_FORMS.find((f) => f.name === "I-VI7-ii-V").chords.find((c) => c.deg === 9);
    expect(jamChordScale(JAM_FORMS.find((f) => f.name === "I-VI7-ii-V"), 0, vi7).note).toBe("세컨더리 도미넌트 — 키 밖 음(3음)이 들어감");
  });

  it("C키 예시 4건 고정 + 그대로여야 하는 것", () => {
    const form = (name) => JAM_FORMS.find((f) => f.name === name);
    const at = (name, deg, type) => {
      const f = form(name);
      return jamChordScale(f, 0, f.chords.find((c) => c.deg === deg && c.type === type));
    };
    // 바뀐 것
    expect(at("메이저 턴어라운드", 9, "m7")).toMatchObject({ root: 9, sc: 1 });      // Am7 → A 내추럴 마이너
    expect(at("iii-VI7-ii-V", 4, "m7")).toMatchObject({ root: 4, sc: 11 });          // Em7 → E 프리지안
    expect(at("마이너 턴어라운드", 5, "maj7")).toMatchObject({ root: 5, sc: 10 });   // Fmaj7 → F 리디안
    expect(at("I-VI7-ii-V", 9, "7")).toMatchObject({ root: 9, sc: 13 });             // A7 → A 믹솔리디안 ♭13
    // 그대로인 것
    expect(at("메이저 251", 2, "m7")).toMatchObject({ root: 2, sc: 8 });             // Dm7 도리안
    expect(at("메이저 251", 7, "7")).toMatchObject({ root: 7, sc: 9 });              // G7 믹솔리디안
    expect(at("메이저 251", 0, "maj7")).toMatchObject({ root: 0, sc: 0 });           // Cmaj7 메이저
    expect(at("마이너 251", 11, "m7b5")).toMatchObject({ root: 11, sc: 12 });        // Bm7♭5 로크리안
    expect(at("마이너 251", 9, "m7")).toMatchObject({ root: 9, sc: 1 });             // Am7(i) 내추럴 마이너
  });

  it("역방향 jamForScale이 새 스케일(믹솔리디안 ♭13)에서도 죽지 않고 배열을 돌려준다", () => {
    for (let r = 0; r < 12; r++) expect(Array.isArray(jamForScale(r, MIX_B13))).toBe(true);
    for (let si = 0; si < SCALES.length; si++) expect(Array.isArray(jamForScale(0, si))).toBe(true);
  });
});
