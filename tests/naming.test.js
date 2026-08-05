// 음이름 표기 일치 검사 (이슈 #8: B♭ 키에서 "A♯ 메이저 보기"가 뜬 사고)
// 원칙: 루트 표기는 ROOTS 단일 배열, 조성 인식 표기는 noteName. ♯전용 배열을 새로 만들지 말 것.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROOTS, KEYS, KEY_PC, noteName, SHARP_NAMES, FLAT_NAMES } from "../src/theory/notes.js";

describe("표기 통일", () => {
  it("12키 모두 5도권 키 표기와 루트 표기가 같다", () => {
    for (let i = 0; i < KEYS.length; i++) {
      expect(ROOTS[KEY_PC[i]]).toBe(KEYS[i].short);
    }
  });

  it("ROOTS는 관례 표기다 — ♯는 F♯ 하나뿐", () => {
    expect(ROOTS.length).toBe(12);
    expect(ROOTS.filter((r) => r.includes("♯"))).toEqual(["F♯"]);
    expect(ROOTS.filter((r) => r.includes("♭"))).toEqual(["D♭", "E♭", "A♭", "B♭"]);
  });

  it("noteName은 플랫 계열 키에서 ♭, 그 밖에는 ♯를 쓴다", () => {
    // F(5), B♭(10), E♭(3), A♭(8), D♭(1) 키는 플랫 이름
    for (const flatRoot of [5, 10, 3, 8, 1]) {
      expect(noteName(flatRoot, 1)).toBe("D♭");
      expect(noteName(flatRoot, 10)).toBe("B♭");
    }
    for (const sharpRoot of [0, 7, 2, 9, 4, 11, 6]) {
      expect(noteName(sharpRoot, 1)).toBe("C♯");
      expect(noteName(sharpRoot, 10)).toBe("A♯");
    }
  });

  it("SHARP_NAMES / FLAT_NAMES는 같은 음높이를 가리킨다", () => {
    expect(SHARP_NAMES.length).toBe(12);
    expect(FLAT_NAMES.length).toBe(12);
    for (let pc = 0; pc < 12; pc++) {
      // 자연음(변화표 없는 음)은 두 배열에서 이름이 같아야 한다
      if (!SHARP_NAMES[pc].includes("♯")) expect(FLAT_NAMES[pc]).toBe(SHARP_NAMES[pc]);
    }
  });

  it("소스 어디에도 ♯전용 음이름 배열을 새로 만들지 않았다", () => {
    // 이슈 #8 재발 방지: SHARP_NAMES는 notes.js 안에서만 선언되어야 한다
    const files = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(js|jsx)$/.test(e.name)) files.push(p);
      }
    };
    walk(path.resolve("src"));
    const declared = files.filter((f) =>
      /(const|let|var)\s+\w*\s*=\s*\[\s*"C"\s*,\s*"C♯"/.test(fs.readFileSync(f, "utf8"))
    );
    expect(declared.map((f) => path.basename(f))).toEqual(["notes.js"]);
  });
});
