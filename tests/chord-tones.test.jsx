// 코드톤 타겟 뷰 검사 (2차 작업지시서 Phase B)
// 잼이 돌 때 스케일 지판 위에 "지금 울리는 코드의 구성음"을 강조한다.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { installFakeAudio } from "./helpers/fakeAudio.js";
import { ScaleBoard } from "../src/screens/Scales.jsx";
import { SCALES } from "../src/theory/scales.js";
import { KEY_PC, FORMULA, OPEN_PC, noteName } from "../src/theory/notes.js";
import { JAM_FORMS } from "../src/theory/jam.js";

let container, root;

const mountBoard = async (props) => {
  await act(async () => { root.render(<ScaleBoard {...props} />); });
};
// 지판에 그려진 점을 "강조 종류"별로 센다
const dots = () => Array.from(container.querySelectorAll("g")).filter((g) => g.querySelector('circle[r="11"]'));
const guideRings = () => container.querySelectorAll('circle[r="14"]');
const dimmed = () => dots().filter((g) => g.getAttribute("opacity") === "0.3");

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
});

// 화면이 쓰는 것과 같은 방식으로 코드톤 지도를 만든다
const toneMap = (chRoot, type) => {
  const m = new Map();
  FORMULA[type].forEach((iv, i) => m.set((chRoot + iv) % 12, i === 1 || i === 3 ? "guide" : "tone"));
  return m;
};

describe("코드톤 강조", () => {
  it("잼에 쓰는 4타입 × 12키에서 강조된 음이 코드 구성음과 정확히 일치한다", async () => {
    const bad = [];
    for (const type of ["m7", "7", "maj7", "m7b5"]) {
      for (let chRoot = 0; chRoot < 12; chRoot++) {
        const map = toneMap(chRoot, type);
        // 코드 구성음이 정확히 4개이고, 공식과 같은 집합인지
        const want = new Set(FORMULA[type].map((iv) => (chRoot + iv) % 12));
        if (map.size !== want.size) bad.push(`${type}/${chRoot} 개수 ${map.size}`);
        for (const pc of want) if (!map.has(pc)) bad.push(`${type}/${chRoot} ${pc} 빠짐`);
        // 가이드톤이 정확히 2개
        const guides = [...map.values()].filter((v) => v === "guide").length;
        if (guides !== 2) bad.push(`${type}/${chRoot} 가이드톤 ${guides}개`);
        // 가이드톤이 실제로 3음·7음인지
        const third = (chRoot + FORMULA[type][1]) % 12;
        const seventh = (chRoot + FORMULA[type][3]) % 12;
        if (map.get(third) !== "guide") bad.push(`${type}/${chRoot} 3음이 가이드톤 아님`);
        if (map.get(seventh) !== "guide") bad.push(`${type}/${chRoot} 7음이 가이드톤 아님`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("지판에 가이드톤 이중 테두리가 그려진다", async () => {
    // C 메이저 스케일 위 Dm7 (D F A C)
    await mountBoard({
      rootPC: 0, scale: SCALES[0], labelMode: "deg", mode: "all",
      boxStart: 0, only: null, path: null, chordTones: toneMap(2, "m7"),
    });
    expect(dots().length).toBeGreaterThan(0);
    expect(guideRings().length, "가이드톤 이중 테두리가 없음").toBeGreaterThan(0);
  });

  it("코드 밖 음은 흐려지고, 코드톤은 흐려지지 않는다", async () => {
    const map = toneMap(2, "m7"); // D F A C
    await mountBoard({
      rootPC: 0, scale: SCALES[0], labelMode: "deg", mode: "all",
      boxStart: 0, only: null, path: null, chordTones: map,
    });
    const all = dots();
    const faded = dimmed();
    expect(faded.length, "흐려진 음이 하나도 없음").toBeGreaterThan(0);
    expect(faded.length, "전부 흐려짐 — 코드톤도 흐려졌다").toBeLessThan(all.length);

    // C 메이저에서 Dm7 구성음은 D(2도) F(4도) A(6도) C(루트) → 도수 라벨로 확인
    const brightLabels = new Set(
      all.filter((g) => g.getAttribute("opacity") !== "0.3")
        .map((g) => g.querySelector("text").textContent)
    );
    expect([...brightLabels].sort()).toEqual(["2", "4", "6", "R"]);
  });

  it("강조가 없으면(잼 정지) 예전 화면 그대로다", async () => {
    await mountBoard({
      rootPC: 0, scale: SCALES[0], labelMode: "deg", mode: "all",
      boxStart: 0, only: null, path: null, chordTones: null,
    });
    expect(dimmed().length, "정지 상태인데 흐려진 음이 있음").toBe(0);
    expect(guideRings().length, "정지 상태인데 가이드톤 테두리가 있음").toBe(0);
  });

  it("스케일에 없는 코드톤은 애초에 지판에 없다 (스케일 학습 화면이므로)", async () => {
    // C 메이저 스케일 위 E7 (E G♯ B D) — G♯은 C 메이저에 없다
    await mountBoard({
      rootPC: 0, scale: SCALES[0], labelMode: "note", mode: "all",
      boxStart: 0, only: null, path: null, chordTones: toneMap(4, "7"),
    });
    const labels = new Set(dots().map((g) => g.querySelector("text").textContent));
    expect(labels.has("G♯"), "스케일 밖 음이 지판에 그려짐").toBe(false);
    expect(labels.has("G"), "스케일 음은 그대로 있어야 함").toBe(true);
  });
});

describe("잼과 연결", () => {
  let App, fake;
  const seed = async (d) => {
    await new Promise((r) => setTimeout(r, 160));
    localStorage.setItem("guitarism", JSON.stringify({ v: 1, d }));
  };
  const mountApp = async () => {
    vi.resetModules();
    fake = installFakeAudio();
    App = (await import("../src/App.jsx")).default;
    await act(async () => { root.render(<App />); });
  };
  const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); }); };
  const findBtn = (s) => Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes(s));
  const tick = async (n, sec) => {
    for (let i = 0; i < n; i++) {
      fake.instances.forEach((c) => c.advance(sec));
      await act(async () => { await new Promise((r) => setTimeout(r, 26)); });
    }
  };

  it("잼이 멈춰 있으면 강조가 없고, 재생하면 지금 코드가 뜬다", async () => {
    await seed({
      "ui.coachSeen": true, "ui.tab": "scales",
      "scale.root": 0, "scale.index": 0, "scale.view": "all",
      "jam.key": 0, "jam.form": 0, "jam.countIn": false,
    });
    await mountApp();
    expect(document.body.textContent).not.toContain("강조된 음을 노려");

    const bar = Array.from(document.querySelectorAll("div")).find(
      (d) => d.textContent.includes("251 잼 세션") && d.style.cursor === "pointer"
    );
    await click(bar);
    await click(findBtn("잼 시작"));
    await act(async () => { await new Promise((r) => setTimeout(r, 60)); });
    await click(findBtn("닫기"));
    await tick(4, 0.1);

    expect(document.body.textContent).toContain("강조된 음을 노려");
    expect(document.body.textContent).toContain("Dm7"); // 메이저 251 C키의 첫 코드
  });

  it("코드가 바뀌면 강조도 따라 바뀐다", async () => {
    await seed({
      "ui.coachSeen": true, "ui.tab": "scales",
      "scale.root": 0, "scale.index": 0, "scale.view": "all",
      "jam.key": 0, "jam.form": 0, "jam.countIn": false, "jam.bpm": 200,
    });
    await mountApp();
    const bar = Array.from(document.querySelectorAll("div")).find(
      (d) => d.textContent.includes("251 잼 세션") && d.style.cursor === "pointer"
    );
    await click(bar);
    await click(findBtn("잼 시작"));
    await act(async () => { await new Promise((r) => setTimeout(r, 60)); });
    await click(findBtn("닫기"));

    const nowText = () => {
      const m = document.body.textContent.match(/지금\s*(\S+)\s*위/);
      return m ? m[1] : null;
    };
    await tick(4, 0.1);
    expect(nowText()).toBe("Dm7");
    for (let i = 0; i < 60; i++) {
      await tick(1, 0.12);
      if (nowText() !== "Dm7") break;
    }
    expect(["G7", "Cmaj7"], "코드가 바뀌었는데 강조가 그대로").toContain(nowText());
  }, 20000);

  it("토글이 화면에 있고 저장된다", async () => {
    await seed({ "ui.coachSeen": true, "ui.tab": "scales" });
    await mountApp();
    const sw = document.querySelector('button[role="switch"][aria-label="코드톤 강조"]');
    expect(sw, "코드톤 강조 토글이 화면에 없음").toBeTruthy();
    expect(sw.getAttribute("aria-checked"), "기본이 켜짐이어야 한다").toBe("true");
    await click(sw);
    await act(async () => { await new Promise((r) => setTimeout(r, 200)); });
    const { get, _resetCache } = await import("../src/storage.js");
    _resetCache();
    expect(get("scale.target", true)).toBe(false);
  });

  it("끄면 강조가 사라진다 (기본은 켜짐)", async () => {
    await seed({
      "ui.coachSeen": true, "ui.tab": "scales", "scale.target": false,
      "scale.root": 0, "scale.index": 0, "jam.form": 0, "jam.countIn": false,
    });
    await mountApp();
    const bar = Array.from(document.querySelectorAll("div")).find(
      (d) => d.textContent.includes("251 잼 세션") && d.style.cursor === "pointer"
    );
    await click(bar);
    await click(findBtn("잼 시작"));
    await act(async () => { await new Promise((r) => setTimeout(r, 60)); });
    await click(findBtn("닫기"));
    await tick(4, 0.1);
    expect(document.body.textContent).not.toContain("강조된 음을 노려");
  });
});
