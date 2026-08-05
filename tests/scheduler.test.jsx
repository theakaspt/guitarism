// 잼 스케줄러 견고화 검사 (작업지시서 Phase 1-3·1-4)
// ① 화면이 가려지면 소리를 더 멀리까지 미리 예약한다
// ② 오래 멈춰 있다 돌아와도, 밀린 소리를 한꺼번에 쏟아내지 않는다
// ③ 재생 중에는 화면 꺼짐 방지를 잡고, 멈추면 놓는다
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { installFakeAudio } from "./helpers/fakeAudio.js";

let container, root, App, fake, wake;

const findBtn = (s) => Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes(s));
const jamBar = () => Array.from(document.querySelectorAll("div")).find(
  (d) => d.textContent.includes("251 잼 세션") && d.style.cursor === "pointer"
);
const click = async (el) => {
  expect(el, "누를 요소를 못 찾음").toBeTruthy();
  await act(async () => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
};
// 오디오 시계와 스케줄러 타이머를 함께 앞으로 감는다
const tick = async (steps = 6, sec = 0.1) => {
  for (let i = 0; i < steps; i++) {
    fake.instances.forEach((c) => c.advance(sec));
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
  }
};
const setVisibility = async (state) => {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
  await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
};
const startJam = async () => {
  await click(jamBar());
  await click(findBtn("잼 시작"));
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); }); // ensureAudio 대기
};

  // 이 파일의 검사들은 "반주가 끊기지 않는가"를 보는 것이라 카운트인은 꺼 둔다.
  // (카운트인이 켜져 있으면 첫 한 마디는 스틱 소리만 나서 시작이 늦어진다)
  const noCountIn = () => localStorage.setItem("guitarism", JSON.stringify({ v: 1, d: { "jam.countIn": false } }));

// 화면 꺼짐 방지 흉내
function installFakeWakeLock() {
  const state = { requests: 0, released: 0, active: 0 };
  navigator.wakeLock = {
    request: async () => {
      state.requests++; state.active++;
      return { release: async () => { state.released++; state.active--; }, released: false };
    },
  };
  return state;
}

beforeEach(async () => {
  noCountIn();
  vi.resetModules();
  fake = installFakeAudio();
  wake = installFakeWakeLock();
  await setVisibility("visible");
  App = (await import("../src/App.jsx")).default;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<App />); });
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
  delete navigator.wakeLock;
});

describe("화면이 가려졌을 때", () => {
  it("가려지는 순간 소리를 미리 더 많이 예약한다", async () => {
    await startJam();
    await tick(4);
    const before = fake.counter.starts;

    // 시계를 전혀 움직이지 않고 '가려짐'만 알린다 → 예약 창이 넓어져 그 자리에서 더 채워야 한다
    await setVisibility("hidden");
    const afterHidden = fake.counter.starts;
    expect(afterHidden, "가려졌는데 미리 예약을 더 하지 않음").toBeGreaterThan(before);

    // 돌아오면 다시 좁은 창으로 (즉시 반응 우선)
    await setVisibility("visible");
    expect(fake.counter.starts).toBeGreaterThanOrEqual(afterHidden);
  });

  it("가려진 동안 타이머가 늦춰져도 소리가 이어진다", async () => {
    await startJam();
    await tick(4);
    await setVisibility("hidden");
    const a = fake.counter.starts;
    // 브라우저가 타이머를 1초로 늦춘 상황: 시계는 1초씩 가는데 콜백은 드물게 온다
    for (let i = 0; i < 3; i++) {
      fake.instances.forEach((c) => c.advance(1.0));
      await act(async () => { await new Promise((r) => setTimeout(r, 40)); });
    }
    expect(fake.counter.starts, "가려진 동안 예약이 멈춤").toBeGreaterThan(a);
  });
});

describe("오래 멈춰 있다 돌아왔을 때", () => {
  it("밀린 소리를 한꺼번에 쏟아내지 않는다", async () => {
    await startJam();
    await tick(4);

    // 기준: 평소 한 번의 스케줄링에서 예약되는 양
    const beforeNormal = fake.counter.starts;
    await tick(1);
    const perTick = fake.counter.starts - beforeNormal;

    // 폰을 30초 잠근 상황: 오디오 시계만 30초 흐르고 타이머는 그동안 안 돌았다
    const before = fake.counter.starts;
    fake.instances.forEach((c) => c.advance(30));
    await act(async () => { await new Promise((r) => setTimeout(r, 60)); });
    const burst = fake.counter.starts - before;

    // 30초어치(수백 개)가 아니라, 한두 번 분량만 나가야 한다
    expect(burst, `30초 뒤 한 번에 ${burst}개가 예약됨 — 몰아치기 방지 실패`).toBeLessThan(Math.max(40, perTick * 6 + 20));
    // 그리고 반주는 계속 이어져야 한다
    await tick(4);
    expect(fake.counter.starts).toBeGreaterThan(before + burst);
  });
});

describe("화면 꺼짐 방지", () => {
  it("재생하면 잡고, 멈추면 놓는다", async () => {
    expect(wake.requests).toBe(0);
    await startJam();
    expect(wake.requests, "재생했는데 화면 꺼짐 방지를 잡지 않음").toBeGreaterThan(0);
    expect(wake.active).toBe(1);

    await click(findBtn("정지"));
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(wake.released, "정지했는데 놓지 않음").toBeGreaterThan(0);
    expect(wake.active).toBe(0);
  });

  it("지원하지 않는 기기에서도 재생이 정상 동작한다", async () => {
    await act(async () => { root.unmount(); });
    delete navigator.wakeLock; // 이 기기는 기능이 없음
    noCountIn();
    vi.resetModules();
    fake = installFakeAudio();
    const Fresh = (await import("../src/App.jsx")).default;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(<Fresh />); });

    await startJam();
    await tick(4);
    expect(fake.counter.starts, "화면 꺼짐 방지가 없다고 재생까지 막히면 안 된다").toBeGreaterThan(0);
  });
});

describe("아이폰 소리 장치", () => {
  it("재생 버튼을 누르면 장치를 깨우고 나서 시작한다", async () => {
    await startJam();
    expect(fake.instances.length, "오디오 장치가 만들어지지 않음").toBeGreaterThan(0);
    expect(fake.instances[0].state).toBe("running");
  });

  it("장치가 안 깨어나면 무음 스위치 안내가 뜬다", async () => {
    await act(async () => { root.unmount(); });
    noCountIn();
    vi.resetModules();
    fake = installFakeAudio();
    // resume()이 통하지 않는 상황을 흉내
    const Base = window.AudioContext;
    window.AudioContext = class extends Base {
      constructor() { super(); this.state = "suspended"; }
      resume() { return Promise.resolve(); } // 깨우려 해도 그대로 suspended
    };
    const Fresh = (await import("../src/App.jsx")).default;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(<Fresh />); });

    await startJam();
    expect(document.body.textContent).toContain("소리가 안 나면 무음 스위치를 확인하세요");
  });
});
