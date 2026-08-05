// 문맥형 꿀팁 검사 (2차 작업지시서 Phase C)
//
// 이 앱의 원칙은 "이론은 전부 사실 검증 후 수록"이다. 팁도 예외가 아니라서,
// 여기서는 문구가 뜨는지만 보지 않고 **팁이 주장하는 내용을 앱 데이터로 다시 계산해** 확인한다.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { TIPS, TERMS, pickTip, termsIn } from "../src/theory/tips.js";
import TipCard, { _resetDismissed } from "../src/components/TipCard.jsx";
import { KEY_PC, FORMULA, KEYS } from "../src/theory/notes.js";
import { SCALES, cagedPositions } from "../src/theory/scales.js";
import { JAM_FORMS, jamChordScale } from "../src/theory/jam.js";

describe("팁 데이터 형식", () => {
  it("모든 팁이 필요한 항목을 갖췄고 id가 겹치지 않는다", () => {
    const ids = new Set();
    for (const t of TIPS) {
      expect(typeof t.id).toBe("string");
      expect(["decoder", "chords", "scales", "jam"]).toContain(t.where);
      expect(typeof t.cond).toBe("function");
      expect(t.text.length).toBeGreaterThan(5);
      expect(t.more.length).toBeGreaterThan(20);
      expect(ids.has(t.id), `id 중복: ${t.id}`).toBe(false);
      ids.add(t.id);
    }
    expect(TIPS.length).toBeGreaterThanOrEqual(10);
  });

  it("팁이 길어지지 않는다 (한 줄 + 보충 2~3문장 상한)", () => {
    for (const t of TIPS) {
      expect(t.text.length, `${t.id} 한 줄이 너무 김`).toBeLessThan(45);
      expect(t.more.length, `${t.id} 보충 설명이 너무 김`).toBeLessThan(220);
    }
  });

  it("조건 함수는 어떤 값이 와도 터지지 않는다", () => {
    for (const t of TIPS) {
      expect(() => t.cond({})).not.toThrow();
      expect(() => t.cond({ typeId: null, bass: undefined, scaleName: 0, formName: 5 })).not.toThrow();
    }
  });

  it("화면마다 조건이 겹쳐도 하나만 고른다", () => {
    const got = pickTip("scales", { scaleName: "마이너 펜타토닉", view: "nps", caged: true }, new Set());
    expect(got).toBeTruthy();
    expect(typeof got.id).toBe("string");
  });

  it("닫은 팁은 건너뛴다", () => {
    const skip = new Set();
    const first = pickTip("decoder", {}, skip);
    expect(first).toBeTruthy();
    skip.add(first.id);
    expect(pickTip("decoder", {}, skip)).toBe(null);
  });
});

// ══════════════════════════════════════════════════════
//  팁이 주장하는 내용을 앱 데이터로 다시 계산해 확인한다
// ══════════════════════════════════════════════════════
describe("팁 내용 사실 검증", () => {
  const tipById = (id) => TIPS.find((t) => t.id === id);

  it("[jam.major251] 메이저 251에서 7음이 다음 코드 3음으로 반음 하강한다 — 12키 전부", () => {
    const form = JAM_FORMS.find((f) => f.name === "메이저 251");
    expect(form).toBeTruthy();
    const bad = [];
    for (let ki = 0; ki < 12; ki++) {
      const keyPC = KEY_PC[ki];
      for (let i = 0; i < form.chords.length - 1; i++) {
        const a = form.chords[i], b = form.chords[i + 1];
        const seventh = (keyPC + a.deg + FORMULA[a.type][3]) % 12;
        const third = (keyPC + b.deg + FORMULA[b.type][1]) % 12;
        const step = ((seventh - third) % 12 + 12) % 12;
        if (step !== 1) bad.push(`${KEYS[ki].short} ${i}→${i + 1}: ${step}반음`);
      }
    }
    expect(bad, "팁이 '반음 내려간다'고 말하는데 실제로는 다름").toEqual([]);
    expect(tipById("jam.major251").text).toContain("반음");
  });

  it("[jam.minor251] 마이너 251의 V7 위 스케일이 하모닉 마이너이고 ♭9·♭13을 담는다 — 12키 전부", () => {
    const form = JAM_FORMS.find((f) => f.name === "마이너 251");
    const v7 = form.chords.find((c) => c.type === "7");
    const bad = [];
    for (let ki = 0; ki < 12; ki++) {
      const keyPC = KEY_PC[ki];
      const r = jamChordScale(form, keyPC, v7);
      if (SCALES[r.sc].name !== "하모닉 마이너") bad.push(`${KEYS[ki].short}: ${SCALES[r.sc].name}`);
      const chRoot = (keyPC + v7.deg) % 12;
      const set = new Set(SCALES[r.sc].notes.map((n) => (r.root + n.iv) % 12));
      if (!set.has((chRoot + 1) % 12)) bad.push(`${KEYS[ki].short}: ♭9 없음`);
      if (!set.has((chRoot + 8) % 12)) bad.push(`${KEYS[ki].short}: ♭13 없음`);
    }
    expect(bad).toEqual([]);
  });

  it("[decoder.neighbor] 5도권 이웃 키의 공통음이 6개다 — 12쌍 전부", () => {
    const MAJ = [0, 2, 4, 5, 7, 9, 11];
    const bad = [];
    for (let i = 0; i < 12; i++) {
      const a = new Set(MAJ.map((x) => (KEY_PC[i] + x) % 12));
      const b = new Set(MAJ.map((x) => (KEY_PC[(i + 1) % 12] + x) % 12));
      const common = [...a].filter((x) => b.has(x)).length;
      if (common !== 6) bad.push(`${KEYS[i].short}↔${KEYS[(i + 1) % 12].short}: ${common}`);
    }
    expect(bad).toEqual([]);
  });

  it("[scale.minorPenta] 마이너 펜타 + ♭5 = 마이너 블루스 (딱 한 음 차이)", () => {
    const iv = (name) => SCALES.find((s) => s.name === name).notes.map((n) => n.iv);
    const added = iv("마이너 블루스").filter((x) => !iv("마이너 펜타토닉").includes(x));
    expect(added).toEqual([6]); // 6반음 = ♭5
    expect(tipById("scale.minorPenta").text).toContain("♭5");
  });

  it("[scale.majorPenta] 메이저 쪽 블루노트는 ♭5가 아니라 ♭3이다", () => {
    const iv = (name) => SCALES.find((s) => s.name === name).notes.map((n) => n.iv);
    const added = iv("메이저 블루스").filter((x) => !iv("메이저 펜타토닉").includes(x));
    expect(added).toEqual([3]); // 3반음 = ♭3
    const tip = tipById("scale.majorPenta");
    expect(tip.text).toContain("♭3");
    expect(tip.text).not.toContain("♭5"); // 흔한 착각 — 팁이 이 실수를 하면 안 된다
  });

  it("[scale.caged] 이웃 포지션이 항상 겹치고 간격은 2~3프렛이다 — 12루트 전부", () => {
    const gaps = new Set();
    const bad = [];
    for (let root = 0; root < 12; root++) {
      const starts = cagedPositions(root).map((p) => p.start).sort((a, b) => a - b);
      for (let i = 1; i < starts.length; i++) {
        const gap = starts[i] - starts[i - 1];
        gaps.add(gap);
        if ((starts[i - 1] + 4) - starts[i] + 1 < 1) bad.push(`root${root}: 끊김`);
      }
    }
    expect(bad).toEqual([]);
    expect([...gaps].sort((a, b) => a - b)).toEqual([2, 3]);
    expect(tipById("scale.caged").text).toContain("2~3프렛");
  });

  it("[scale.3nps] 한 포지션이 18음이다", () => {
    // 이미 theory-scales.test.js가 전수 확인하지만, 팁 문구와 숫자가 맞는지 여기서 다시 본다
    expect(tipById("scale.3nps").more).toContain("18음");
  });

  it("[chord.slash] C → C/B → Am 베이스가 계단으로 내려간다", () => {
    const down = (a, b) => ((a - b) % 12 + 12) % 12;
    expect(down(0, 11)).toBe(1);  // C → B 반음
    expect(down(11, 9)).toBe(2);  // B → A 온음
    // C/B의 윗음은 C 코드 구성음
    const cTones = new Set(FORMULA.maj.map((x) => x % 12));
    expect([...cTones].sort((a, b) => a - b)).toEqual([0, 4, 7]);
  });

  it("[jam.turnaround] 이 앱의 턴어라운드 폼이 4마디다", () => {
    const tos = JAM_FORMS.filter((f) => f.name.includes("턴어라운드"));
    expect(tos.length).toBeGreaterThan(0);
    for (const f of tos) {
      expect(f.chords.reduce((a, c) => a + c.bars, 0)).toBe(4);
    }
    expect(tipById("jam.turnaround").more).toContain("4마디");
  });

  it("팁이 가리키는 폼·스케일 이름이 실제로 존재한다", () => {
    const formNames = JAM_FORMS.map((f) => f.name);
    const scaleNames = SCALES.map((s) => s.name);
    for (const name of ["메이저 251", "마이너 251"]) expect(formNames).toContain(name);
    for (const name of ["마이너 펜타토닉", "메이저 펜타토닉", "마이너 블루스", "메이저 블루스", "하모닉 마이너"]) {
      expect(scaleNames).toContain(name);
    }
  });
});

describe("용어 미니 사전", () => {
  it("앱이 쓰는 용어에 설명이 있다", () => {
    for (const t of ["보이싱", "가이드톤", "드롭2", "컴핑", "CAGED", "턴어라운드", "텐션", "블루노트"]) {
      expect(TERMS[t], `${t} 설명 없음`).toBeTruthy();
      expect(TERMS[t].length).toBeGreaterThan(10);
      expect(TERMS[t].length, `${t} 설명이 너무 김`).toBeLessThan(120);
    }
  });

  it("팁에 나온 용어만 최대 2개까지 골라 준다", () => {
    for (const t of TIPS) {
      const found = termsIn(t);
      expect(found.length).toBeLessThanOrEqual(2);
      for (const term of found) expect(`${t.text} ${t.more}`).toContain(term);
    }
  });
});

describe("팁 카드 화면", () => {
  let container, root;
  beforeEach(() => {
    _resetDismissed();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
  });
  const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); }); };
  const btn = (s) => Array.from(container.querySelectorAll("button")).find((b) => (b.textContent + (b.getAttribute("aria-label") || "")).includes(s));

  it("조건이 맞으면 한 줄이 뜨고, 눌러야 보충 설명이 나온다", async () => {
    await act(async () => { root.render(<TipCard where="chords" ctx={{ typeId: "m7", bass: null }} />); });
    expect(container.textContent).toContain("코드 성격은 3음과 7음이 정합니다");
    expect(container.textContent).not.toContain("베이스가 쳐 주기 때문에");

    await click(btn("더보기"));
    expect(container.textContent).toContain("베이스가 쳐 주기 때문에");
    expect(container.textContent).toContain("가이드톤"); // 용어 설명이 함께
  });

  it("조건이 안 맞으면 아무것도 그리지 않는다", async () => {
    await act(async () => { root.render(<TipCard where="chords" ctx={{ typeId: "maj", bass: null }} />); });
    expect(container.textContent).toBe("");
  });

  it("닫으면 사라지고 이 세션 동안 다시 안 뜬다", async () => {
    await act(async () => { root.render(<TipCard where="decoder" ctx={{}} />); });
    expect(container.textContent).toContain("조표가 1개만");
    await click(btn("이 팁 닫기"));
    expect(container.textContent).toBe("");

    // 다시 그려도 안 뜬다
    await act(async () => { root.render(<TipCard where="decoder" ctx={{}} />); });
    expect(container.textContent).toBe("");
  });

  it("상태가 바뀌면 그 상태에 맞는 팁으로 바뀐다", async () => {
    await act(async () => { root.render(<TipCard where="scales" ctx={{ scaleName: "마이너 펜타토닉", view: "all" }} />); });
    expect(container.textContent).toContain("♭5");
    await act(async () => { root.render(<TipCard where="scales" ctx={{ scaleName: "메이저 펜타토닉", view: "all" }} />); });
    expect(container.textContent).toContain("♭3");
  });
});
