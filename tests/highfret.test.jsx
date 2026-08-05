// 고프렛 잘림 보정 — 실제 지판이 늘어나 그려지는지 (작업지시서 Phase 2-4)
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { ScaleBoard } from "../src/screens/Scales.jsx";
import { SCALES, scaleIvSet, build3nps } from "../src/theory/scales.js";

let container, root;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
});

const fretNumbers = () =>
  Array.from(container.querySelectorAll("text"))
    .map((t) => t.textContent)
    .filter((x) => /^\d+$/.test(x))
    .map(Number);

describe("지판 표시 범위", () => {
  it("기본은 15프렛까지 그린다", async () => {
    await act(async () => {
      root.render(<ScaleBoard rootPC={0} scale={SCALES[0]} labelMode="deg" mode="all" boxStart={0} only={null} path={null} />);
    });
    expect(Math.max(...fretNumbers())).toBe(15);
  });

  it("16~17프렛을 쓰는 포지션에서는 지판이 그만큼 늘어난다", async () => {
    // D♭ 메이저의 높은 3음/줄 포지션 (16프렛까지 씀)
    const scale = SCALES[0]; // 메이저
    const ivset = scaleIvSet(scale);
    const root17 = 1; // D♭
    let picked = null;
    for (let f0 = 0; f0 < 12 && !picked; f0++) {
      if (!ivset.has(((4 + f0 - root17) % 12 + 12) % 12)) continue;
      const keys = build3nps(root17, ivset, f0);
      const max = Math.max(...[...keys].map((k) => +k.split("-")[1]));
      if (max > 15) picked = { keys, max };
    }
    expect(picked, "16프렛을 쓰는 포지션을 못 찾음").toBeTruthy();

    await act(async () => {
      root.render(<ScaleBoard rootPC={root17} scale={scale} labelMode="deg" mode="nps" boxStart={0}
        only={picked.keys} path={null} maxFret={picked.max} />);
    });
    const nums = fretNumbers();
    expect(Math.max(...nums)).toBe(picked.max);

    // 그리고 그 포지션의 음이 하나도 빠지지 않고 그려졌는지
    const dots = container.querySelectorAll('circle[r="11"]');
    expect(dots.length).toBe(picked.keys.size);
  });

  it("17프렛을 넘겨 달라고 해도 17에서 멈춘다 (지판 길이 한계)", async () => {
    await act(async () => {
      root.render(<ScaleBoard rootPC={0} scale={SCALES[0]} labelMode="deg" mode="all" boxStart={0} only={null} path={null} maxFret={30} />);
    });
    expect(Math.max(...fretNumbers())).toBe(17);
  });
});
