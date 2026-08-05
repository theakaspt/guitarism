// 첫 실행 코치마크 검사 (작업지시서 Phase 2-3)
// 딱 한 번만 뜨고, 아무 데나 누르면 사라지고, 다시는 안 나온다.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import App from "../src/App.jsx";
import { get, _resetCache } from "../src/storage.js";

let container, root;

const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); }); };
const findBtn = (s) => Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes(s));
const coach = () => document.querySelector('[role="dialog"]');
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

describe("첫 실행 안내", () => {
  it("처음 켜면 두 지점을 짚어 준다", () => {
    const c = coach();
    expect(c, "첫 실행인데 안내가 안 뜸").toBeTruthy();
    expect(c.textContent).toContain("돌려서 키를 바꿔요");
    expect(c.textContent).toContain("여기서 반주가 계속 돌아요");
    expect(c.getAttribute("aria-label")).toBeTruthy();
  });

  it("아무 데나 누르면 사라진다", async () => {
    await click(coach());
    expect(coach()).toBeFalsy();
  });

  it("한 번 본 뒤에는 다시 켜도 안 나온다", async () => {
    await click(coach());
    await settle();
    expect(get("ui.coachSeen", false)).toBe(true);

    await unmount();
    _resetCache();
    await mount();
    expect(coach(), "이미 봤는데 또 뜸").toBeFalsy();
  });

  it("디코더 화면에서만 뜬다 (다이얼을 가리켜야 하므로)", async () => {
    expect(coach()).toBeTruthy();
    await click(coach()); // 일단 닫고
    await unmount();
    localStorage.clear();
    _resetCache();
    // 마지막에 보던 탭이 스케일이었다면 안내는 뜨지 않는다
    localStorage.setItem("guitarism", JSON.stringify({ v: 1, d: { "ui.tab": "scales" } }));
    _resetCache();
    await mount();
    expect(coach()).toBeFalsy();
  });

  it("안내를 닫은 뒤 앱이 정상 동작한다", async () => {
    await click(coach());
    await click(findBtn("스케일"));
    expect(document.body.textContent).toContain("선택한 스케일");
    await click(findBtn("디코더"));
    expect(document.body.textContent).toContain("다이어토닉 코드");
    expect(coach()).toBeFalsy();
  });
});
