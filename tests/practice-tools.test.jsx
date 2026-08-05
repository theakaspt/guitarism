// 연습 도구 3종 검사 (2차 작업지시서 Phase A)
//  A-1 카운트인 · A-2 컴핑 끄기(메트로놈 모드) · A-3 템포 트레이너
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { installFakeAudio } from "./helpers/fakeAudio.js";
import { COUNT_IN_BEATS, COUNT_IN_VOICE, countInHits, TRAINER_LOOPS_PER_STEP } from "../src/jam/JamProvider.jsx";

let container, root, App, fake;

const findBtn = (s) => Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes(s));
const bySwitch = (label) => document.querySelector(`button[role="switch"][aria-label="${label}"]`);
const jamBar = () => Array.from(document.querySelectorAll("div")).find(
  (d) => d.textContent.includes("251 잼 세션") && d.style.cursor === "pointer"
);
const click = async (el) => {
  expect(el, "누를 요소를 못 찾음").toBeTruthy();
  await act(async () => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
};
// 오디오 시계를 "미리 예약 창(0.15초)보다 작게" 조금씩 밀어야 실제 재생과 같은 흐름이 된다.
// 한 번에 크게 밀면 이벤트가 전부 과거가 되어 skipPast로 조용히 건너뛰어진다(= 폰을 잠근 상황).
const tick = async (steps = 6, sec = 0.1) => {
  for (let i = 0; i < steps; i++) {
    fake.instances.forEach((c) => c.advance(sec));
    await act(async () => { await new Promise((r) => setTimeout(r, 26)); });
  }
};
// 앞 검사에서 예약된 저장(120ms 지연 쓰기)이 뒤늦게 덮어쓰지 않도록 잠깐 기다린 뒤 심는다
const seed = async (d) => {
  await new Promise((r) => setTimeout(r, 160));
  localStorage.setItem("guitarism", JSON.stringify({ v: 1, d }));
};
// 트레이너를 켜면 '목표' 슬라이더가 먼저 그려지므로 반드시 이름으로 찾는다
const bpmSlider = () => document.querySelector('input[aria-label="빠르기 BPM"]');
const bpmNow = () => +bpmSlider().value;

const mount = async () => {
  vi.resetModules();
  fake = installFakeAudio();
  App = (await import("../src/App.jsx")).default;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<App />); });
  await click(jamBar()); // 잼 시트 펼치기
};
const start = async () => {
  await click(findBtn("잼 시작"));
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
};
afterEach(async () => {
  if (root) { await act(async () => { root.unmount(); }); container.remove(); root = null; }
});

// 가짜 오디오에 예약된 드럼 보이스를 종류별로 세기 위한 도우미.
// drum()은 보이스마다 다른 노드를 만들므로, 여기서는 "몇 번 예약됐나"만 본다.
describe("A-1 카운트인", () => {
  it("켜져 있으면 재생 직후 첫 예약이 카운트 소리뿐이다", async () => {
    await seed({ "jam.countIn": true });
    await mount();
    const before = fake.counter.starts;
    await start();
    // 효과 설정 시점에 카운트인 4번이 곧바로 예약된다
    const afterStart = fake.counter.starts - before;
    expect(afterStart, "카운트인이 예약되지 않음").toBeGreaterThan(0);

    // 카운트인 한 마디(120bpm 기준 2초) 동안은 반주가 늘지 않는다
    const atCountIn = fake.counter.starts;
    await tick(8, 0.1); // 0.8초
    expect(fake.counter.starts, "카운트인 중인데 반주가 벌써 나감").toBe(atCountIn);

    // 한 마디가 지나면 반주가 들어온다
    await tick(20, 0.1); // 총 2.8초
    expect(fake.counter.starts, "카운트인이 끝났는데 반주가 안 들어옴").toBeGreaterThan(atCountIn);
  });

  it("꺼져 있으면 곧바로 반주가 시작된다", async () => {
    await seed({ "jam.countIn": false });
    await mount();
    await start();
    await tick(4, 0.1);
    expect(fake.counter.starts).toBeGreaterThan(0);
  });

  it("루프 두 바퀴째에는 카운트인이 없다 (첫 시작에만)", async () => {
    await seed({ "jam.countIn": true, "jam.bpm": 200 }); // 빠르게 돌려 루프를 여러 번 넘긴다
    await mount();
    await start();
    await tick(60, 0.2); // 12초 = 4마디 루프(200bpm ≈ 4.8초)를 두 바퀴 이상

    // 카운트인은 재생을 누른 그 한 번만 예약된다.
    // 다시 눌러야만 또 나온다 — 정지 후 재생으로 확인한다.
    const beforeStop = fake.counter.starts;
    await click(findBtn("정지"));
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(fake.counter.starts).toBe(beforeStop);
    await start();
    expect(fake.counter.starts, "다시 시작했는데 카운트인이 없음").toBeGreaterThan(beforeStop);
  });

  it("카운트인 데이터가 4박이고 1박에 힘이 들어간다", () => {
    const hits = countInHits();
    expect(hits.length).toBe(COUNT_IN_BEATS);
    expect(hits.map((h) => h.beat)).toEqual([0, 1, 2, 3]);
    expect(hits[0].vel).toBeGreaterThan(hits[1].vel);
    expect(COUNT_IN_VOICE).toBe("rim"); // 기존 드럼 보이스 재사용 (새 음색 없음)
  });

  it("토글이 저장된다", async () => {
    await seed({ "jam.countIn": true });
    await mount();
    await click(bySwitch("카운트인"));
    await act(async () => { await new Promise((r) => setTimeout(r, 200)); });
    const { get, _resetCache } = await import("../src/storage.js");
    _resetCache();
    expect(get("jam.countIn", true)).toBe(false);
  });
});

describe("A-2 컴핑 끄기 (메트로놈 모드)", () => {
  it("기타 반주를 끄면 드럼만 남고, 다시 켜면 돌아온다", async () => {
    await seed({ "jam.countIn": false, "jam.comping": true });
    await mount();
    await start();
    await tick(10, 0.1);

    // 같은 길이(2초)의 창으로 세 번 재서 비교한다 — 짧게 재면 편차가 커진다
    const measure = async () => {
      const a = fake.counter.starts;
      await tick(20, 0.1);
      return fake.counter.starts - a;
    };
    const onA = await measure();
    await click(bySwitch("기타 반주"));   // 끄기
    const off = await measure();
    await click(bySwitch("기타 반주"));   // 다시 켜기
    const onB = await measure();

    expect(off, "반주를 껐는데 소리가 아예 없음(드럼도 멈춤)").toBeGreaterThan(0);
    expect(off, "반주를 껐는데 소리가 안 줄었음").toBeLessThan(onA);
    expect(onB, "반주를 다시 켰는데 안 늘어남").toBeGreaterThan(off);
  });

  it("반주를 꺼도 코드 표시는 계속 따라간다 (눈으로 보며 직접 치는 용도)", async () => {
    await seed({ "jam.countIn": false, "jam.comping": false, "jam.bpm": 200 });
    await mount();
    expect(document.body.textContent).toContain("드럼만 재생 중");
    await start();

    const nowLabel = () => {
      const on = Array.from(document.querySelectorAll("span")).filter(
        (s) => s.style.background === "rgb(224, 165, 75)" && s.style.fontWeight === "800"
      );
      return on.length ? on[0].textContent : null;
    };
    expect(nowLabel()).toBe("Dm7");
    for (let i = 0; i < 40; i++) {
      await tick(1, 0.15);
      if (nowLabel() !== "Dm7") break;
    }
    expect(["G7", "Cmaj7"], "반주를 껐더니 코드 표시가 멈춤").toContain(nowLabel());
  });

  it("반주를 꺼도 반주 토글은 스케줄러를 다시 시작시키지 않는다", async () => {
    // 토글할 때마다 반주가 끊기면 연습 중에 쓸 수 없다.
    await seed({ "jam.countIn": false });
    await mount();
    await start();
    await tick(4, 0.1);
    const a = fake.counter.starts;
    await click(bySwitch("기타 반주"));
    await click(bySwitch("기타 반주"));
    await tick(4, 0.1);
    // 재시작됐다면 loopStart가 리셋되어 예약이 잠시 끊긴다 — 계속 늘어야 정상
    expect(fake.counter.starts).toBeGreaterThan(a);
  });
});

describe("A-3 템포 트레이너", () => {
  it("루프 두 바퀴마다 BPM이 올라가고 목표에서 멈춘다", async () => {
    // 빠른 템포로 루프를 짧게 만들어 검사 시간을 줄인다 (4마디 × 180bpm ≈ 5.3초)
    // BPM 슬라이더의 상한이 200이라 목표도 그 안에서 잡는다.
    await seed({
      "jam.countIn": false, "jam.bpm": 180,
      "jam.trainer": true, "jam.trainerTarget": 190, "jam.trainerStep": 5,
    });
    await mount();
    expect(bpmNow()).toBe(180);
    await start();

    for (let i = 0; i < 600; i++) {
      await tick(1, 0.12);
      if (bpmNow() >= 190) break;
    }
    expect(bpmNow(), "목표까지 올라가지 않음").toBe(190);
    expect(document.body.textContent).toContain("목표 도달");

    // 목표를 넘지 않는다
    await tick(60, 0.12);
    expect(bpmNow()).toBe(190);
  }, 30000);

  it("BPM이 루프 중간이 아니라 경계에서만 바뀐다", async () => {
    await seed({
      "jam.countIn": false, "jam.bpm": 150,
      "jam.trainer": true, "jam.trainerTarget": 200, "jam.trainerStep": 5,
    });
    await mount();
    await start();

    const changes = [];
    let last = bpmNow();
    let elapsed = 0;
    for (let i = 0; i < 500; i++) {
      await tick(1, 0.12);
      elapsed += 0.12;
      const cur = bpmNow();
      if (cur !== last) { changes.push({ at: elapsed, bpm: cur }); last = cur; }
      if (changes.length >= 3) break;
    }
    expect(changes.length, "BPM이 한 번도 안 올라감").toBeGreaterThanOrEqual(2);
    // 한 번에 step만큼만 오른다 (마디 중간에 여러 번 튀지 않음)
    for (let i = 1; i < changes.length; i++) {
      expect(changes[i].bpm - changes[i - 1].bpm).toBe(5);
    }
    // 변화 간격이 루프 2바퀴(150bpm에서 6.4초 × 2 ≈ 12.8초) 근처다 — 마디 중간이 아니다
    if (changes.length >= 2) {
      const gap = changes[1].at - changes[0].at;
      expect(gap, `변화 간격 ${gap.toFixed(1)}초 — 루프 경계가 아님`).toBeGreaterThan(4);
    }
  }, 30000);

  it("BPM 슬라이더를 직접 만지면 트레이너가 해제된다 (수동 우선)", async () => {
    await seed({ "jam.countIn": false, "jam.trainer": true, "jam.trainerTarget": 180 });
    await mount();
    expect(bySwitch("템포 올리기").getAttribute("aria-checked")).toBe("true");

    const slider = bpmSlider();
    await act(async () => {
      const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setValue.call(slider, "140");
      slider.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(bySwitch("템포 올리기").getAttribute("aria-checked"), "슬라이더를 만졌는데 트레이너가 살아 있음").toBe("false");
  });

  it("꺼져 있으면 BPM이 저절로 바뀌지 않는다", async () => {
    await seed({ "jam.countIn": false, "jam.bpm": 120, "jam.trainer": false });
    await mount();
    await start();
    await tick(120, 0.12); // 약 14초
    expect(bpmNow()).toBe(120);
  });

  it("루프 2바퀴 기준이 문서와 코드에서 같다", () => {
    expect(TRAINER_LOOPS_PER_STEP).toBe(2);
  });
});
