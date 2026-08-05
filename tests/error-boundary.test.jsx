// 에러 화면 검사 (작업지시서 Phase 1-2)
// "화면이 하얗게 죽는" 대신 안내가 뜨고, 다시 시작하면 복구되는지 확인한다.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import ErrorBoundary from "../src/components/ErrorBoundary.jsx";
import { get, set, _resetCache } from "../src/storage.js";

let container, root, errSpy;

const txt = () => container.textContent;
const findBtn = (s) => Array.from(container.querySelectorAll("button")).find((b) => b.textContent.includes(s));
const click = async (el) => {
  expect(el, "누를 버튼을 못 찾음").toBeTruthy();
  await act(async () => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
};

// 첫 렌더에서만 터지고, 다시 마운트되면 정상으로 도는 컴포넌트
function Flaky({ boom }) {
  if (boom.current) throw new Error("일부러 낸 오류");
  return <div>정상 화면</div>;
}

beforeEach(() => {
  errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
  vi.restoreAllMocks();
});

describe("에러 화면", () => {
  it("자식이 터지면 한국어 안내가 뜬다", async () => {
    const boom = { current: true };
    await act(async () => { root.render(<ErrorBoundary label="스케일"><Flaky boom={boom} /></ErrorBoundary>); });
    expect(txt()).toContain("문제가 생겼어요");
    expect(txt()).toContain("스케일 화면을 그리다가 멈췄습니다");
    expect(findBtn("다시 시작")).toBeTruthy();
    expect(findBtn("설정까지 초기화")).toBeTruthy();
  });

  it("오류 내용이 콘솔에 남는다", async () => {
    const boom = { current: true };
    await act(async () => { root.render(<ErrorBoundary label="잼"><Flaky boom={boom} /></ErrorBoundary>); });
    const logged = errSpy.mock.calls.some((c) => String(c[0]).includes("[Guitarism]") && String(c[0]).includes("잼"));
    expect(logged).toBe(true);
  });

  it("'다시 시작'을 누르면 화면이 돌아온다", async () => {
    const boom = { current: true };
    await act(async () => { root.render(<ErrorBoundary><Flaky boom={boom} /></ErrorBoundary>); });
    expect(txt()).toContain("문제가 생겼어요");
    boom.current = false; // 원인이 사라진 상황
    await click(findBtn("다시 시작"));
    expect(txt()).toContain("정상 화면");
    expect(txt()).not.toContain("문제가 생겼어요");
  });

  it("'설정까지 초기화'는 저장된 설정을 지우고 다시 시작한다", async () => {
    set("jam.bpm", 176);
    expect(get("jam.bpm", 120)).toBe(176);
    const boom = { current: true };
    await act(async () => { root.render(<ErrorBoundary><Flaky boom={boom} /></ErrorBoundary>); });
    boom.current = false;
    await click(findBtn("설정까지 초기화"));
    _resetCache();
    expect(get("jam.bpm", 120)).toBe(120);
    expect(txt()).toContain("정상 화면");
  });

  it("문제가 없을 땐 아무것도 끼어들지 않는다", async () => {
    await act(async () => { root.render(<ErrorBoundary><div>그냥 화면</div></ErrorBoundary>); });
    expect(txt()).toBe("그냥 화면");
  });
});

describe("탭 단위 안전망", () => {
  it("한 탭이 터져도 다른 탭으로 갔다 오면 되살아난다 (key로 새 인스턴스)", async () => {
    const boom = { current: true };
    const render = (tab) =>
      act(async () => {
        root.render(
          <div>
            <ErrorBoundary key={tab} label={tab}>
              {tab === "a" ? <Flaky boom={boom} /> : <div>다른 탭</div>}
            </ErrorBoundary>
            <div>탭 바는 살아 있음</div>
          </div>
        );
      });

    await render("a");
    expect(txt()).toContain("문제가 생겼어요");
    expect(txt()).toContain("탭 바는 살아 있음"); // 바깥은 멀쩡

    await render("b");
    expect(txt()).toContain("다른 탭");

    boom.current = false;
    await render("a");
    expect(txt()).toContain("정상 화면");
  });
});
