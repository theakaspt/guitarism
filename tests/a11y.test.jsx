// 접근성 기초 검사 (작업지시서 Phase 2-2)
// 이전 상태: aria 속성 0개, 아이콘만 있는 버튼, 휠은 터치·클릭 전용(키보드 불가)
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import App from "../src/App.jsx";
import VWheel from "../src/components/VWheel.jsx";

let container, root;

const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); }); };
const findBtn = (s) => Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes(s));
const dismissCoach = async () => {
  const d = document.querySelector('[role="dialog"]');
  if (d) await click(d);
};

beforeEach(async () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<App />); });
  await dismissCoach();
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
});

describe("탭 바", () => {
  it("탭 목록 구조(role)가 갖춰져 있다", () => {
    const list = document.querySelector('[role="tablist"]');
    expect(list).toBeTruthy();
    expect(list.getAttribute("aria-label")).toBeTruthy();
    const tabs = document.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(3);
    const selected = Array.from(tabs).filter((t) => t.getAttribute("aria-selected") === "true");
    expect(selected.length).toBe(1);
    // 선택된 탭만 키보드 포커스를 받는다 (탭 위젯 표준 동작)
    expect(selected[0].getAttribute("tabindex")).toBe("0");
  });

  it("탭과 화면이 연결돼 있다", () => {
    const tab = document.querySelector('[role="tab"][aria-selected="true"]');
    const panel = document.querySelector('[role="tabpanel"]');
    expect(panel).toBeTruthy();
    expect(panel.id).toBe(tab.getAttribute("aria-controls"));
    expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
  });

  it("탭을 옮기면 선택 표시도 따라간다", async () => {
    await click(findBtn("스케일"));
    const sel = document.querySelector('[role="tab"][aria-selected="true"]');
    expect(sel.textContent).toContain("스케일");
  });
});

describe("세로 휠", () => {
  it("목록 구조(listbox/option)와 현재 항목 표시가 있다", async () => {
    await click(findBtn("코드 사전"));
    const boxes = document.querySelectorAll('[role="listbox"]');
    expect(boxes.length).toBe(3); // 루트 · 타입 · 베이스
    for (const b of boxes) {
      expect(b.getAttribute("aria-label"), "휠에 이름이 없음").toBeTruthy();
      expect(b.getAttribute("tabindex")).toBe("0");
      const active = b.getAttribute("aria-activedescendant");
      expect(active).toBeTruthy();
      expect(document.getElementById(active), "가리키는 항목이 실제로 없음").toBeTruthy();
      const opts = b.querySelectorAll('[role="option"]');
      expect(opts.length).toBeGreaterThan(0);
      expect(Array.from(opts).filter((o) => o.getAttribute("aria-selected") === "true").length).toBe(1);
    }
  });

  it("위/아래 화살표 키로 값을 바꿀 수 있다", async () => {
    const seen = [];
    const box = document.createElement("div");
    document.body.appendChild(box);
    const r2 = createRoot(box);
    let value = 2;
    const render = () =>
      act(async () => {
        r2.render(<VWheel label="테스트" items={["가", "나", "다", "라", "마"]} value={value}
          onChange={(i) => { seen.push(i); value = i; }} />);
      });
    await render();
    const wheel = box.querySelector('[role="listbox"]');

    const key = async (k) => {
      await act(async () => { wheel.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true })); });
      await render();
    };
    await key("ArrowDown"); expect(seen.at(-1)).toBe(3);
    await key("ArrowUp");   expect(seen.at(-1)).toBe(2);
    await key("Home");      expect(seen.at(-1)).toBe(0);
    await key("End");       expect(seen.at(-1)).toBe(4);
    // 끝에서 더 눌러도 범위를 벗어나지 않는다
    await key("ArrowDown"); expect(value).toBe(4);

    await act(async () => { r2.unmount(); });
    box.remove();
  });
});

describe("버튼 이름", () => {
  it("아이콘만 있는 버튼에도 읽을 이름이 있다", async () => {
    const bad = [];
    const check = () => {
      document.querySelectorAll("button").forEach((b) => {
        const name = (b.getAttribute("aria-label") || b.textContent || "").trim();
        // ▶ ■ ◀ ▾ 같은 기호만 있는 버튼은 이름이 있다고 보지 않는다
        const meaningful = name.replace(/[▶■◀▾▸▲▼·\s]/g, "").length > 0;
        if (!meaningful) bad.push(b.outerHTML.slice(0, 90));
      });
    };
    check();
    await click(findBtn("코드 사전")); check();
    await click(findBtn("스케일")); check();
    expect(bad).toEqual([]);
  });

  it("재생 버튼은 눌린 상태를 알려 준다 (aria-pressed)", async () => {
    const bar = Array.from(document.querySelectorAll("div")).find(
      (d) => d.textContent.includes("251 잼 세션") && d.style.cursor === "pointer"
    );
    await click(bar);
    const play = Array.from(document.querySelectorAll("button")).find((b) => b.getAttribute("aria-label") === "잼 시작");
    expect(play).toBeTruthy();
    expect(play.getAttribute("aria-pressed")).toBe("false");
  });

  it("접었다 펴는 곳은 열림 상태를 알려 준다 (aria-expanded)", () => {
    const prog = findBtn("진행 보기");
    expect(prog.getAttribute("aria-expanded")).toBe("false");
  });
});

describe("글자 크기", () => {
  it("11px보다 작은 글자가 남아 있지 않다", async () => {
    const tooSmall = new Set();
    const scan = () => {
      document.querySelectorAll("*").forEach((el) => {
        const fs = el.style && el.style.fontSize;
        if (!fs || !fs.endsWith("px")) return;
        const n = parseFloat(fs);
        if (n < 11) tooSmall.add(`${n}px: ${(el.textContent || "").slice(0, 20)}`);
      });
    };
    // 접힌 UI도 모두 펼쳐서 확인한다 (이슈 #7 이후 규칙)
    await click(findBtn("진행 보기")); scan();
    await click(findBtn("코드 사전")); scan();
    await click(findBtn("스케일")); scan();
    await click(findBtn("코드별 스케일 보기")); scan();
    const bar = Array.from(document.querySelectorAll("div")).find(
      (d) => d.textContent.includes("251 잼 세션") && d.style.cursor === "pointer"
    );
    await click(bar); scan();
    expect([...tooSmall]).toEqual([]);
  });
});
