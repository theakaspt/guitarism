// 코드 운지가 이론적으로 맞는지 전수 검사 (보고서1 §6-A 승계)
import { describe, it, expect } from "vitest";
import { ROOTS, FORMULA, OPEN_PC } from "../src/theory/notes.js";
import { CHORD_TYPES, buildVoicings } from "../src/theory/chords.js";

const pcsOf = (voicing) =>
  new Set(
    voicing.s
      .map(([f], i) => (f >= 0 ? (OPEN_PC[i] + f) % 12 : null))
      .filter((pc) => pc !== null)
  );

describe("코드 운지 전수 검증", () => {
  it("모든 운지의 구성음이 코드 공식과 정확히 일치한다", () => {
    let total = 0;
    const fails = [];
    for (let root = 0; root < 12; root++) {
      for (const t of CHORD_TYPES) {
        for (const v of buildVoicings(root, t.id, null)) {
          total++;
          const want = new Set(FORMULA[t.id].map((iv) => (root + iv) % 12));
          const got = pcsOf(v);
          const extra = [...got].filter((pc) => !want.has(pc));
          const missing = [...want].filter((pc) => !got.has(pc));
          if (extra.length || missing.length) {
            fails.push(`${ROOTS[root]}${t.sym} / ${v.label}`);
          }
        }
      }
    }
    expect(fails).toEqual([]);
    // 현재 규모 고정값. (보고서1의 "258개"는 v13 시점 숫자이고, 이후 트라이어드·탑4현이
    //  전 루트로 확장되며 414개가 됐다. 여기서 숫자가 바뀌면 데이터가 늘거나 줄었다는 뜻이다.)
    // 내역: 오픈 12 · 6번줄 루트 93 · 5번줄 루트 153 · 트라이어드 고음 48 · 중음 48 · 탑4현 60
    expect(total).toBe(414);
  });

  it("모든 프렛이 0~15 안에 있고 손폭이 상식 범위다", () => {
    const bad = [];
    for (let root = 0; root < 12; root++) {
      for (const t of CHORD_TYPES) {
        for (const v of buildVoicings(root, t.id, null)) {
          const frets = v.s.map(([f]) => f).filter((f) => f > 0);
          if (frets.some((f) => f < 0 || f > 15)) bad.push(`${ROOTS[root]}${t.sym} 프렛범위`);
          if (frets.length && Math.max(...frets) - Math.min(...frets) > 4) {
            bad.push(`${ROOTS[root]}${t.sym} 손폭`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("슬래시 코드 전수 검증", () => {
  it("1,872개 조합에서 최저음이 항상 지정한 베이스다", () => {
    let combos = 0, voicings = 0;
    const fails = [];
    for (let root = 0; root < 12; root++) {
      for (const t of CHORD_TYPES) {
        for (let bass = 0; bass < 12; bass++) {
          combos++;
          for (const v of buildVoicings(root, t.id, bass)) {
            voicings++;
            const sounded = v.s
              .map(([f], i) => (f >= 0 ? { str: i, pc: (OPEN_PC[i] + f) % 12 } : null))
              .filter(Boolean);
            const lowest = sounded[0]; // 6번줄(index 0)부터라 첫 번째가 최저음
            if (lowest.pc !== bass) {
              fails.push(`${ROOTS[root]}${t.sym}/${ROOTS[bass]} · ${v.label}`);
            }
          }
        }
      }
    }
    expect(combos).toBe(1872); // 13타입 × 12루트 × 12베이스
    expect(fails).toEqual([]);
    expect(voicings).toBeGreaterThan(0);
  });

  it("추천 표시는 조합마다 최대 1개다", () => {
    for (let root = 0; root < 12; root++) {
      for (const t of CHORD_TYPES) {
        for (let bass = 0; bass < 12; bass++) {
          const rec = buildVoicings(root, t.id, bass).filter((v) => v.label.includes("(추천)"));
          expect(rec.length).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});
