// 스케일 위치 생성 로직 전수 검사 (보고서1 §6-A, 이슈 #3·#4 승계)
import { describe, it, expect } from "vitest";
import { OPEN_MIDI, OPEN_PC } from "../src/theory/notes.js";
import { SCALES, scaleIvSet, cagedPositions, build3nps, diagFrom, inScale } from "../src/theory/scales.js";

const SEVEN = SCALES.map((s, i) => [s, i]).filter(([s]) => s.notes.length === 7);

describe("3음/줄 (3nps)", () => {
  it("9개 7음 스케일 × 12루트 × 7포지션 = 756개가 모두 줄당 3음·프렛 0~17이다", () => {
    let count = 0;
    const bad = [];
    for (const [scale, si] of SEVEN) {
      const ivset = scaleIvSet(scale);
      for (let root = 0; root < 12; root++) {
        // 화면에서 쓰는 시작 위치 목록과 같은 방식(6번줄에서 스케일 음이 나오는 프렛)
        const anchors = [];
        for (let f = 0; f < 12; f++) {
          if (ivset.has(((4 + f - root) % 12 + 12) % 12)) anchors.push(f);
        }
        expect(anchors.length).toBe(7);
        for (const f0 of anchors) {
          const keys = build3nps(root, ivset, f0);
          count++;
          if (keys.size !== 18) { bad.push(`${si}/${root}/${f0} 음 개수 ${keys.size}`); continue; }
          const perString = [0, 0, 0, 0, 0, 0];
          for (const k of keys) {
            const [s, fr] = k.split("-").map(Number);
            perString[s]++;
            if (fr < 0 || fr > 17) bad.push(`${si}/${root}/${f0} 프렛 ${fr}`);
            const iv = (((OPEN_PC[s] + fr) % 12) - root + 12) % 12;
            if (!ivset.has(iv)) bad.push(`${si}/${root}/${f0} 스케일 밖 음`);
          }
          if (perString.some((n) => n !== 3)) bad.push(`${si}/${root}/${f0} 줄당 3음 아님`);
        }
      }
    }
    expect(bad).toEqual([]);
    expect(count).toBe(756); // 9 × 12 × 7
  });
});

describe("CAGED 포지션", () => {
  it("모든 루트에서 5폼이 전부 나오고 서명(루트-줄 기준 위치)이 일치한다", () => {
    for (let root = 0; root < 12; root++) {
      const pos = cagedPositions(root);
      expect(pos.length).toBe(5);
      expect(new Set(pos.map((p) => p.label))).toEqual(new Set(["C폼", "A폼", "G폼", "E폼", "D폼"]));
      // 시작 프렛은 0~11 안, 오름차순 정렬
      expect(pos.every((p) => p.start >= 0 && p.start <= 11)).toBe(true);
      expect([...pos].sort((a, b) => a.start - b.start)).toEqual(pos);
      // 서명: E폼 시작 프렛은 6번줄에서 루트가 나오는 자리 기준으로 정해진다
      const e6 = (root - 4 + 12) % 12;
      const byLabel = Object.fromEntries(pos.map((p) => [p.label, p.start]));
      expect(byLabel["C폼"]).toBe((e6 + 4) % 12);
      expect(byLabel["A폼"]).toBe((e6 + 7) % 12);
      expect(byLabel["G폼"]).toBe((e6 + 9) % 12);
      expect(byLabel["E폼"]).toBe((e6 + 11) % 12);
      expect(byLabel["D폼"]).toBe((e6 + 2) % 12);
    }
  });
});

describe("고프렛 잘림 (Phase 2-4)", () => {
  it("3음/줄은 최대 17프렛까지 올라간다 — 지판이 그만큼 그려져야 한다", () => {
    let maxFret = 0, over15 = 0;
    for (const [scale] of SEVEN) {
      const ivset = scaleIvSet(scale);
      for (let root = 0; root < 12; root++) {
        for (let f0 = 0; f0 < 12; f0++) {
          if (!ivset.has(((4 + f0 - root) % 12 + 12) % 12)) continue;
          for (const k of build3nps(root, ivset, f0)) {
            const fr = +k.split("-")[1];
            if (fr > maxFret) maxFret = fr;
            if (fr > 15) over15++;
          }
        }
      }
    }
    // 예전에는 지판을 15프렛까지만 그려서 이 음들이 화면에서 사라졌다
    expect(over15, "15프렛 초과 음이 하나도 없다면 이 검사는 의미가 없다").toBeGreaterThan(0);
    expect(maxFret).toBeLessThanOrEqual(17); // ScaleBoard가 늘려 그리는 상한
  });
});

describe("대각선 (익스텐디드)", () => {
  it("생성되는 모든 대각선의 프렛이 0~15 안이고 음이 전부 스케일 음이다", () => {
    let made = 0;
    const bad = [];
    for (let si = 0; si < SCALES.length; si++) {
      const scale = SCALES[si];
      const ivset = scaleIvSet(scale);
      const N = scale.notes.length;
      for (let root = 0; root < 12; root++) {
        for (const s0 of [0, 1]) {
          for (let f = 0; f <= 12; f++) {
            if (!inScale(root, ivset, OPEN_MIDI[s0] + f)) continue;
            const seq = diagFrom(root, ivset, N, s0, f);
            if (!seq) continue; // 넥 밖으로 나가면 화면에서도 버려진다
            made++;
            let prev = -Infinity;
            for (const x of seq) {
              const [s, fr] = x.key.split("-").map(Number);
              if (fr < 0 || fr > 15) bad.push(`${si}/${root}/${s0}/${f} 프렛 ${fr}`);
              const iv = (((OPEN_PC[s] + fr) % 12) - root + 12) % 12;
              if (!ivset.has(iv)) bad.push(`${si}/${root}/${s0}/${f} 스케일 밖 음`);
              if (x.pitch <= prev) bad.push(`${si}/${root}/${s0}/${f} 상행 아님`);
              prev = x.pitch;
            }
          }
        }
      }
    }
    expect(bad).toEqual([]);
    expect(made).toBeGreaterThan(0);
  });

  it("모든 스케일·루트에 대각선이 최소 하나는 만들어진다 (막다른 화면 방지)", () => {
    for (let si = 0; si < SCALES.length; si++) {
      const scale = SCALES[si];
      const ivset = scaleIvSet(scale);
      const N = scale.notes.length;
      for (let root = 0; root < 12; root++) {
        let any = false;
        for (const s0 of [0, 1]) {
          for (let f = 0; f <= 12 && !any; f++) {
            if (!inScale(root, ivset, OPEN_MIDI[s0] + f)) continue;
            if (diagFrom(root, ivset, N, s0, f)) any = true;
          }
        }
        expect(any, `스케일 ${SCALES[si].name} 루트 ${root}`).toBe(true);
      }
    }
  });
});
