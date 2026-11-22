// 음이름 철자(도수 기반) 검산 — 이론 오류 수정 1차
// 원리: 음 글자 = 루트 글자 + (도수 번호 − 1), 변화표 = 실제 음높이 − 그 글자의 자연음 높이.
// 철자 함수가 만든 이름을 "다시 음높이로 읽어" 앱 데이터(SCALES·FORMULA·JAM_FORMS)의 실제 음과 대조한다.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import App from "../src/App.jsx";
import { _resetCache } from "../src/storage.js";
import { ROOTS, FORMULA, KEY_PC, MAJ_DEG, spellScale, spellChord, jamRootName, chordNoteAt } from "../src/theory/notes.js";
import { SCALES } from "../src/theory/scales.js";
import { JAM_FORMS } from "../src/theory/jam.js";

const LETTERS = "CDEFGAB";
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
const ACC = { "": 0, "♭": -1, "♯": 1, "𝄫": -2, "𝄪": 2 };
// 이름 → 음높이 (테스트가 따로 구현한 독립 계산)
const pcOf = (name) => (((LETTER_PC[LETTERS.indexOf(name[0])] + ACC[name.slice(1)]) % 12) + 12) % 12;
const letterOf = (name) => LETTERS.indexOf(name[0]);
const isDouble = (name) => /[𝄫𝄪]/u.test(name);
const degNum = (deg) => (deg === "R" ? 1 : parseInt(deg.replace(/[^0-9]/g, ""), 10));

describe("스케일 철자 (spellScale)", () => {
  const sevens = SCALES.filter((s) => s.notes.length === 7);
  const others = SCALES.filter((s) => s.notes.length !== 7);

  it("7음 스케일 × 12루트: 글자 7개가 모두 다르고, 음높이가 맞고, 겹변화표가 없다", () => {
    let n = 0;
    for (const sc of sevens) for (let r = 0; r < 12; r++) {
      const { names } = spellScale(r, sc);
      expect(names.length).toBe(sc.notes.length);
      expect(new Set(names.map(letterOf)).size, `${ROOTS[r]} ${sc.name}`).toBe(7);
      names.forEach((nm, i) => {
        expect(pcOf(nm), `${ROOTS[r]} ${sc.name} ${nm}`).toBe((r + sc.notes[i].iv) % 12);
        expect(isDouble(nm), `${ROOTS[r]} ${sc.name} ${nm}`).toBe(false);
      });
      n++;
    }
    expect(n).toBe(sevens.length * 12);
  });

  it("5·6음 스케일 × 12루트: 음높이가 맞고 겹변화표가 없다", () => {
    for (const sc of others) for (let r = 0; r < 12; r++) {
      const { names } = spellScale(r, sc);
      names.forEach((nm, i) => {
        expect(pcOf(nm), `${ROOTS[r]} ${sc.name} ${nm}`).toBe((r + sc.notes[i].iv) % 12);
        expect(isDouble(nm), `${ROOTS[r]} ${sc.name} ${nm}`).toBe(false);
      });
    }
  });

  it("루트 이름은 ROOTS이거나, 겹변화표를 피하려고 고른 이명동음 루트다 (13종 기준 10건 + 3단계 새 스케일 D♭ 믹솔리디안 ♭13 1건 = 11건)", () => {
    const alt = [];
    for (const sc of SCALES) for (let r = 0; r < 12; r++) {
      const { rootName } = spellScale(r, sc);
      if (rootName !== ROOTS[r]) {
        expect(pcOf(rootName)).toBe(pcOf(ROOTS[r])); // 같은 음높이
        alt.push(`${ROOTS[r]} ${sc.name}`);
      }
    }
    expect(alt.length).toBe(11);
    expect(alt).toContain("D♭ 믹솔리디안 ♭13");
  });

  it("회귀 예시 고정", () => {
    const sc = (name) => SCALES.find((s) => s.name === name);
    expect(spellScale(0, sc("내추럴 마이너")).names.join(" ")).toBe("C D E♭ F G A♭ B♭");
    expect(spellScale(2, sc("하모닉 마이너")).names.at(-1)).toBe("C♯"); // D 하모닉 마이너 끝음
    expect(spellScale(6, sc("메이저")).names[6]).toBe("E♯"); // F♯ 메이저 7번째
    const db = spellScale(1, sc("내추럴 마이너"));
    expect(db.rootName).toBe("C♯");
    expect(db.names.join(" ")).toBe("C♯ D♯ E F♯ G♯ A B");
    expect(spellScale(0, sc("마이너 블루스")).names.join(" ")).toBe("C E♭ F G♭ G B♭");
  });
});

describe("코드 철자 (spellChord)", () => {
  it("FORMULA 13종 × 12루트: 글자가 도수대로 쌓이고 음높이가 맞다 (dim7의 𝄫7 허용)", () => {
    const DEG = { 0: 1, 2: 2, 3: 3, 4: 3, 5: 4, 6: 5, 7: 5, 8: 5, 9: 6, 10: 7, 11: 7 };
    expect(Object.keys(FORMULA).length).toBe(13);
    for (const [type, ivs] of Object.entries(FORMULA)) for (let r = 0; r < 12; r++) {
      const names = spellChord(ROOTS[r], type);
      expect(names.length).toBe(ivs.length);
      names.forEach((nm, i) => {
        const deg = type === "dim7" && ivs[i] === 9 ? 7 : DEG[ivs[i]];
        expect(letterOf(nm), `${ROOTS[r]}${type} ${nm}`).toBe((letterOf(ROOTS[r]) + deg - 1) % 7);
        expect(pcOf(nm), `${ROOTS[r]}${type} ${nm}`).toBe((r + ivs[i]) % 12);
      });
    }
  });

  it("회귀 예시: C7 = C E G B♭, C dim7 끝음 = B𝄫", () => {
    expect(spellChord("C", "7").join(" ")).toBe("C E G B♭");
    expect(spellChord("C", "dim7").at(-1)).toBe("B𝄫");
  });
});

describe("잼 코드 루트 이름 (jamRootName)", () => {
  it("6폼 × 12키: 글자 = 키 글자 + 도수, 음높이가 맞다", () => {
    for (const form of JAM_FORMS) for (let ki = 0; ki < 12; ki++) for (const ch of form.chords) {
      const keyPC = KEY_PC[ki];
      const name = jamRootName(keyPC, ch.deg);
      expect(pcOf(name), `${form.name} ${ROOTS[keyPC]} deg${ch.deg}`).toBe((keyPC + ch.deg) % 12);
      expect(letterOf(name), `${form.name} ${ROOTS[keyPC]} deg${ch.deg}`).toBe((letterOf(ROOTS[keyPC]) + MAJ_DEG.indexOf(ch.deg)) % 7);
    }
  });
  it("회귀 예시: F♯ 키 마이너 251 = E♯ · A♯ · D♯", () => {
    const minor251 = JAM_FORMS.find((f) => f.name === "마이너 251");
    expect(minor251.chords.map((c) => jamRootName(6, c.deg))).toEqual(["E♯", "A♯", "D♯"]);
  });
});

// ── 렌더: 스케일 화면에서 음이름 보기로 C 내추럴 마이너 ──
describe("스케일 화면 음이름", () => {
  let container, root;
  beforeEach(() => { container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
  afterEach(async () => { await act(async () => { root.unmount(); }); container.remove(); });

  it("C 내추럴 마이너를 음이름으로 보면 E♭이 보이고 D♯은 없다", async () => {
    // 저장된 상태로 앱을 켠다: 스케일 탭 / 루트 C / 내추럴 마이너 / 음이름 / 전체 보기
    localStorage.setItem("guitarism", JSON.stringify({
      v: 1, d: { "ui.tab": "scales", "scale.root": 0, "scale.index": 1, "scale.label": "note", "scale.view": "all" },
    }));
    _resetCache();
    await act(async () => { root.render(React.createElement(App)); });
    // 접힌 UI(코드별 스케일 보기)도 펼쳐 둔다
    const open = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes("코드별 스케일 보기"));
    await act(async () => { open.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    const text = document.body.textContent;
    expect(text).toContain("E♭");
    expect(text).not.toContain("D♯");
    // 루트 휠에도 E♭이 있으므로, 지판(SVG) 안 라벨에 E♭·A♭·B♭이 실제로 그려졌는지 따로 본다
    const svgLabels = new Set(Array.from(document.querySelectorAll("svg text")).map((t) => t.textContent));
    for (const n of ["C", "D", "E♭", "F", "G", "A♭", "B♭"]) expect(svgLabels.has(n)).toBe(true);
  });

  it("F♯키 마이너 251: 코드별 스케일 목록이 ♯ 쪽 철자로 통일된다", async () => {
    localStorage.setItem("guitarism", JSON.stringify({
      v: 1, d: { "ui.tab": "scales", "scale.root": 0, "scale.index": 0, "jam.key": 6, "jam.form": 1 },
    }));
    _resetCache();
    await act(async () => { root.render(React.createElement(App)); });
    const open = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes("코드별 스케일 보기"));
    await act(async () => { open.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    const text = document.body.textContent;
    expect(text).toContain("E♯m7♭5 → E♯ 로크리안");
    expect(text).toContain("A♯7 → D♯ 하모닉 마이너");
    expect(text).toContain("D♯m7 → D♯ 내추럴 마이너");
    expect(text).toContain("D♯ 내추럴 마이너 보기");
    expect(text).not.toContain("E♭ 하모닉 마이너");
  });
});

// ── "○○ 없음" 경고에 쓰는 코드 안 철자 ──
describe("chordNoteAt", () => {
  it("코드 도수대로 이름을 낸다 (A♯7의 3음은 C𝄪, Cm7의 ♭3은 E♭)", () => {
    expect(chordNoteAt("A♯", "7", 2)).toBe("C𝄪"); // C𝄪 = D와 같은 음(pc 2)
    expect(chordNoteAt("C", "m7", 3)).toBe("E♭");
    expect(chordNoteAt("C", "7", 10)).toBe("B♭");
    expect(chordNoteAt("C", "maj7", 1)).toBe(null); // 구성음이 아니면 null
  });
});
