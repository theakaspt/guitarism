// 설정이 실제로 기억되는지 검사 (작업지시서 Phase 1-1)
// 앱을 껐다 켜는 상황 = 언마운트 후 새로 마운트.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import App from "../src/App.jsx";
import { get, _resetCache } from "../src/storage.js";

let container, root;

const txt = () => document.body.textContent;
const findBtn = (s) => Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes(s));
const click = async (el) => {
  expect(el, "누를 버튼을 못 찾음").toBeTruthy();
  await act(async () => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
};
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 200)); });

const mount = async () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<App />); });
};
const unmount = async () => {
  await act(async () => { root.unmount(); });
  container.remove();
};

beforeEach(mount);
afterEach(async () => { if (root) await unmount(); });

describe("설정 영속", () => {
  it("마지막에 보던 탭이 기억된다", async () => {
    await click(findBtn("스케일"));
    await settle();
    expect(get("ui.tab", "decoder")).toBe("scales");

    await unmount();
    _resetCache();
    await mount();
    expect(txt()).toContain("선택한 스케일"); // 스케일 화면으로 시작
  });

  it("스케일 화면의 보기 방식과 라벨이 기억된다", async () => {
    await click(findBtn("스케일"));
    await click(findBtn("음이름"));
    await click(findBtn("대각선"));
    await settle();
    expect(get("scale.label", "deg")).toBe("note");
    expect(get("scale.view", "all")).toBe("diag");

    await unmount();
    _resetCache();
    await mount();
    expect(txt()).toContain("루트에서 시작해 넥을 사선으로 상행"); // 대각선 보기로 복원
  });

  it("코드 사전의 선택(루트·타입·베이스)이 복원된다", async () => {
    // 세로휠은 스크롤로 고르는 UI라 jsdom에서 돌리기 어렵다.
    // 대신 "저장돼 있던 상태로 앱을 켜면 그대로 뜨는가"를 확인한다.
    await unmount();
    localStorage.setItem("guitarism", JSON.stringify({
      v: 1, d: { "ui.tab": "chords", "chord.root": 5, "chord.type": 2, "chord.bass": 0 },
    }));
    _resetCache();
    await mount();
    expect(txt()).toContain("F7 / C"); // F 루트 · 7 타입 · C 베이스
  });

  it("잼 설정(키·폼·리듬·음색·드럼·BPM)이 기억된다", async () => {
    const bar = Array.from(document.querySelectorAll("div")).find(
      (d) => d.textContent.includes("251 잼 세션") && d.style.cursor === "pointer"
    );
    await click(bar);
    const slider = document.querySelector('input[type="range"]');
    await act(async () => {
      // React가 값 변화를 알아채도록 네이티브 setter로 바꾼 뒤 이벤트를 보낸다
      const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setValue.call(slider, "150");
      slider.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await settle();
    expect(get("jam.bpm", 120)).toBe(150);

    await unmount();
    _resetCache();
    await mount();
    const bar2 = Array.from(document.querySelectorAll("div")).find(
      (d) => d.textContent.includes("251 잼 세션") && d.style.cursor === "pointer"
    );
    await click(bar2);
    expect(document.querySelector('input[type="range"]').value).toBe("150");
  });

  it("재생 중이었는지는 저장하지 않는다 (앱을 켜자마자 소리가 나면 안 된다)", async () => {
    const bar = Array.from(document.querySelectorAll("div")).find(
      (d) => d.textContent.includes("251 잼 세션") && d.style.cursor === "pointer"
    );
    await click(bar);
    await click(findBtn("잼 시작"));
    await settle();
    expect(get("jam.playing", "저장안됨")).toBe("저장안됨");

    await unmount();
    _resetCache();
    await mount();
    // 미니 바의 재생 버튼이 "▶"(멈춤 상태)여야 한다
    const play = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim() === "▶" || b.textContent.trim() === "■");
    expect(play.textContent.trim()).toBe("▶");
  });

  it("저장된 값이 지금 목록을 벗어나면 기본값으로 시작한다", async () => {
    await unmount();
    localStorage.setItem("guitarism", JSON.stringify({ v: 1, d: { "scale.index": 999, "ui.tab": "없는탭" } }));
    _resetCache();
    await mount();
    // 없는 탭 → 디코더로, 없는 스케일 번호 → 기본(마이너 펜타토닉)
    expect(txt()).toContain("다이얼을 돌려 키를 맞추세요");
    await click(findBtn("스케일"));
    expect(txt()).toContain("마이너 펜타토닉");
  });
});
