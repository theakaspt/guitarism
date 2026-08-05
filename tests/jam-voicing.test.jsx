// 잼 재생 시각 피드백 + 보이싱 보기 검사 (작업지시서 Phase 2-1)
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { installFakeAudio } from "./helpers/fakeAudio.js";
import { KEY_PC, FORMULA, OPEN_MIDI } from "../src/theory/notes.js";
import { JAM_FORMS, COMP_RHYTHMS, jamTimeline, voiceProgression, voiceProgressionFull } from "../src/theory/jam.js";
import { DRUM_FEELS } from "../src/audio/drums.js";
import JamVoicing from "../src/jam/JamVoicing.jsx";

describe("보이싱 정보 (계산)", () => {
  it("voiceProgressionFull과 voiceProgression의 음이 완전히 같다", () => {
    // 화면용으로 정보를 더 돌려주게 나눴을 뿐, 소리는 한 음도 달라지면 안 된다
    for (const form of JAM_FORMS) {
      for (let ki = 0; ki < 12; ki++) {
        const full = voiceProgressionFull(form, KEY_PC[ki]);
        const plain = voiceProgression(form, KEY_PC[ki]);
        expect(full.map((v) => v.midis)).toEqual(plain);
      }
    }
  });

  it("모든 폼·키에서 보이싱마다 줄·프렛 정보가 있고 음과 맞아떨어진다", () => {
    const bad = [];
    for (const form of JAM_FORMS) {
      for (let ki = 0; ki < 12; ki++) {
        for (const v of voiceProgressionFull(form, KEY_PC[ki])) {
          if (!v.set || !v.frets) { bad.push(`${form.name}/${ki} 지판 정보 없음`); continue; }
          v.set.forEach((s, k) => {
            if (OPEN_MIDI[s] + v.frets[k] !== v.midis[k]) bad.push(`${form.name}/${ki} 줄·프렛과 음이 안 맞음`);
          });
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("타임라인의 코드 이벤트마다 몇 번째 코드인지가 붙어 있다", () => {
    for (const form of JAM_FORMS) {
      const { timeline } = jamTimeline(form, 0, COMP_RHYTHMS[0], DRUM_FEELS[0]);
      const comp = timeline.filter((e) => !e.drum);
      expect(comp.length).toBeGreaterThan(0);
      for (const e of comp) {
        expect(Number.isInteger(e.ci)).toBe(true);
        expect(e.ci).toBeGreaterThanOrEqual(0);
        expect(e.ci).toBeLessThan(form.chords.length);
      }
      // 코드 번호가 마디 순서대로 올라간다
      const seq = [...new Set(comp.sort((a, b) => a.beat - b.beat).map((e) => e.ci))];
      expect(seq).toEqual([...Array(form.chords.length).keys()]);
    }
  });
});

describe("보이싱 지판 그리기", () => {
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

  it("가이드톤(3음·7음)이 정확히 두 개 강조된다", async () => {
    // Dm7 = D F A C → 가이드톤은 F(♭3)와 C(♭7)
    const v = voiceProgressionFull(JAM_FORMS[0], 0)[0];
    await act(async () => {
      root.render(<JamVoicing voicing={v} rootPC={2} type="m7" keyPC={0} />);
    });
    const labels = Array.from(container.querySelectorAll("text")).map((t) => t.textContent);
    expect(labels).toContain("♭3");
    expect(labels).toContain("♭7");
    expect(labels).toContain("R");
    // 금색(가이드톤) 원이 정확히 2개
    const brass = Array.from(container.querySelectorAll("circle")).filter(
      (c) => c.getAttribute("fill") === "#E0A54B" && c.getAttribute("r") === "11.5"
    );
    expect(brass.length).toBe(2);
  });

  it("모든 폼 × 12키의 보이싱을 그려도 깨지지 않는다", async () => {
    for (const form of JAM_FORMS) {
      for (let ki = 0; ki < 12; ki++) {
        const keyPC = KEY_PC[ki];
        const vs = voiceProgressionFull(form, keyPC);
        for (let i = 0; i < vs.length; i++) {
          const ch = form.chords[i];
          await act(async () => {
            root.render(<JamVoicing voicing={vs[i]} rootPC={(keyPC + ch.deg) % 12} type={ch.type} keyPC={keyPC} />);
          });
          // 4음이 모두 점으로 그려졌는지
          const dots = container.querySelectorAll('circle[r="11.5"]');
          expect(dots.length, `${form.name}/${ki}/${i}`).toBe(4);
        }
      }
    }
  });

  it("정보가 모자라면 그냥 아무것도 안 그린다 (죽지 않는다)", async () => {
    await act(async () => { root.render(<JamVoicing voicing={null} rootPC={0} type="maj7" />); });
    expect(container.textContent).toBe("");
    await act(async () => { root.render(<JamVoicing voicing={{ midis: [1, 2, 3, 4] }} rootPC={0} type="maj7" />); });
    expect(container.textContent).toBe("");
  });
});

describe("재생 중 코드 따라가기", () => {
  let container, root, App, fake;

  beforeEach(async () => {
    vi.resetModules();
    fake = installFakeAudio();
    App = (await import("../src/App.jsx")).default;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(<App />); });
  });
  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
  });

  it("반주가 돌면 지금 코드 표시가 다음 코드로 넘어간다", async () => {
    const bar = Array.from(document.querySelectorAll("div")).find(
      (d) => d.textContent.includes("251 잼 세션") && d.style.cursor === "pointer"
    );
    await act(async () => { bar.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    const play = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes("잼 시작"));
    await act(async () => { play.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    await act(async () => { await new Promise((r) => setTimeout(r, 60)); });

    // 지금 코드로 표시된 칸(금색 배경)을 찾는 함수
    const nowIdx = () => {
      const spans = Array.from(document.querySelectorAll("span")).filter(
        (s) => s.style.background === "rgb(224, 165, 75)" && s.style.fontWeight === "800"
      );
      return spans.length ? spans[0].textContent : null;
    };
    expect(nowIdx()).toBe("Dm7"); // 메이저 251 C키의 첫 코드

    // 시간을 흘려 두 번째 코드까지 진행 (120bpm · ii 1마디 = 2초)
    for (let i = 0; i < 40; i++) {
      fake.instances.forEach((c) => c.advance(0.15));
      await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
      if (nowIdx() !== "Dm7") break;
    }
    expect(["G7", "Cmaj7"], "코드 표시가 넘어가지 않음").toContain(nowIdx());
  });

  it("멈춰 있을 때도 첫 코드의 보이싱을 보여 준다", async () => {
    const bar = Array.from(document.querySelectorAll("div")).find(
      (d) => d.textContent.includes("251 잼 세션") && d.style.cursor === "pointer"
    );
    await act(async () => { bar.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    expect(document.body.textContent).toContain("첫 코드 보이싱");
    expect(document.body.textContent).toContain("가이드톤");
  });
});
