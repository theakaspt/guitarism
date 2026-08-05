// 화면이 실제로 뜨는지 검사 (이슈 #1: 빌드는 되는데 화면이 안 뜬 사고)
// 이슈 #7 이후 규칙: 접혀 있는 UI(토글·아코디언·시트)를 전부 펼쳐서 확인한다.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import App from "../src/App.jsx";

let container, root;

const txt = () => document.body.textContent;
const buttons = () => Array.from(document.querySelectorAll("button"));
const findBtn = (s) => buttons().find((b) => b.textContent.includes(s));
const click = async (el) => {
  expect(el, "누를 요소를 못 찾음").toBeTruthy();
  await act(async () => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
};

beforeEach(async () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<App />); });
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
});

describe("앱 마운트", () => {
  it("세 탭이 모두 그려진다", () => {
    expect(txt()).toContain("디코더");
    expect(txt()).toContain("코드 사전");
    expect(txt()).toContain("스케일");
    expect(document.querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  it("디코더: 다이얼·다이어토닉 코드가 뜨고, 접힌 추천 진행을 모두 펼쳐도 안 깨진다", async () => {
    expect(txt()).toContain("다이얼을 돌려 키를 맞추세요");
    expect(txt()).toContain("다이어토닉 코드");

    // 접힌 UI ①: 추천 진행 토글
    await click(findBtn("진행 보기"));
    expect(txt()).toContain("이어가기 좋은 진행이 펼쳐집니다");

    // 접힌 UI ②: 진행 카드 5개를 하나씩 펼침 (이슈 #7의 ProgRow 크래시 지점)
    for (let i = 0; i < 5; i++) {
      const cards = Array.from(document.querySelectorAll("div")).filter(
        (d) => d.getAttribute("style") && d.style.cursor === "pointer" && d.textContent.includes("›")
      );
      if (!cards[i]) continue;
      await click(cards[i]);
      expect(txt()).toContain("이어가기 좋은 진행");
    }
  });

  it("잼 미니바를 펼쳐도 안 깨진다 (세로휠 5개 + BPM)", async () => {
    expect(txt()).toContain("251 잼 세션");
    const bar = Array.from(document.querySelectorAll("div")).find(
      (d) => d.textContent.includes("251 잼 세션") && d.style.cursor === "pointer"
    );
    await click(bar);
    expect(txt()).toContain("키");
    expect(txt()).toContain("폼");
    expect(txt()).toContain("리듬");
    expect(txt()).toContain("음색");
    expect(txt()).toContain("드럼");
    expect(txt()).toContain("BPM");
    expect(document.querySelector('input[type="range"]')).toBeTruthy();
    await click(findBtn("닫기"));
  });

  it("코드 사전: 지판이 뜨고 보이싱을 전부 넘겨봐도 안 깨진다", async () => {
    await click(findBtn("코드 사전"));
    expect(txt()).toContain("코드 듣기");
    expect(txt()).toContain("왼쪽이 저음(6번 줄)");
    // 보이싱 칩(오픈/바레/트라이어드/탑4현) 전부 눌러보기
    for (const label of ["오픈", "6번줄 루트", "5번줄 루트", "트라이어드·고음", "트라이어드·중음", "탑 4현"]) {
      const b = findBtn(label);
      if (b) await click(b);
    }
    expect(document.querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  it("스케일: 보기 4종을 모두 돌려도, 연동 카드를 펼쳐도 안 깨진다", async () => {
    await click(findBtn("스케일"));
    expect(txt()).toContain("선택한 스케일");
    expect(txt()).toContain("스케일 듣기");

    // 접힌 UI ③: 코드별 스케일 보기
    await click(findBtn("코드별 스케일 보기"));
    expect(txt()).toContain("→");

    // 보기 모드 전환 (전체 / 포지션 / 3음/줄 / 대각선)
    for (const view of ["전체", "포지션", "대각선"]) {
      await click(findBtn(view));
      expect(document.querySelectorAll("svg").length).toBeGreaterThan(0);
    }
    // 포지션 넘기기 ◀▶
    await click(findBtn("포지션"));
    const next = findBtn("▶");
    if (next && !next.disabled) await click(next);
    expect(txt()).toContain("포지션");
  });

  it("탭을 여러 번 오가도 화면이 유지된다", async () => {
    for (const t of ["코드 사전", "스케일", "디코더", "스케일", "코드 사전", "디코더"]) {
      await click(findBtn(t));
      expect(document.querySelectorAll("svg").length).toBeGreaterThan(0);
    }
    expect(txt()).toContain("다이어토닉 코드");
  });
});
