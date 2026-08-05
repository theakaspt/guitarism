// 잼(반주 루프) 검사 — 보고서2 §6-C(잼 지속), §6-F(리듬 타임라인) 승계
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { installFakeAudio } from "./helpers/fakeAudio.js";
import { KEY_PC, FORMULA, OPEN_MIDI } from "../src/theory/notes.js";
import { JAM_FORMS, COMP_RHYTHMS, jamTimeline, voiceProgression, compCandidates } from "../src/theory/jam.js";
import { DRUM_FEELS } from "../src/audio/drums.js";

describe("컴핑 보이싱", () => {
  it("모든 폼 × 12키의 보이싱이 4음이고 구성음을 전부 담는다", () => {
    const bad = [];
    for (const form of JAM_FORMS) {
      for (let ki = 0; ki < 12; ki++) {
        const keyPC = KEY_PC[ki];
        const seq = voiceProgression(form, keyPC);
        expect(seq.length).toBe(form.chords.length);
        seq.forEach((midis, i) => {
          const ch = form.chords[i];
          const rootpc = (keyPC + ch.deg) % 12;
          if (midis.length !== 4) bad.push(`${form.name}/${keyPC}/${i} 음 개수`);
          // 오름차순
          for (let k = 1; k < midis.length; k++) {
            if (midis[k] <= midis[k - 1]) bad.push(`${form.name}/${keyPC}/${i} 오름차순 아님`);
          }
          const want = new Set(FORMULA[ch.type].map((iv) => (rootpc + iv) % 12));
          const got = new Set(midis.map((m) => m % 12));
          if (got.size !== want.size || [...want].some((pc) => !got.has(pc))) {
            bad.push(`${form.name}/${keyPC}/${i} 구성음 불일치`);
          }
        });
      }
    }
    expect(bad).toEqual([]);
  });

  it("보이싱 후보는 인접 4현 안에서만 만들어진다", () => {
    const cands = compCandidates(0, "maj7");
    expect(cands.length).toBeGreaterThan(0);
    for (const c of cands) {
      expect([[1, 2, 3, 4].join(), [2, 3, 4, 5].join()]).toContain(c.set.join());
      expect(Math.max(...c.frets) - Math.min(...c.frets)).toBeLessThanOrEqual(4);
      c.midis.forEach((m, i) => expect(m).toBe(OPEN_MIDI[c.set[i]] + c.frets[i]));
    }
  });
});

describe("타임라인", () => {
  it("모든 폼 × 리듬 × 드럼 조합에서 박 위치가 루프 길이 안에 있다", () => {
    const bad = [];
    for (const form of JAM_FORMS) {
      for (const rhythm of COMP_RHYTHMS) {
        for (const feel of DRUM_FEELS) {
          const { timeline, loopBeats } = jamTimeline(form, 0, rhythm, feel);
          const bars = form.chords.reduce((a, c) => a + c.bars, 0);
          if (loopBeats !== bars * 4) bad.push(`${form.name}/${rhythm.name}/${feel.name} 루프 길이`);
          for (const e of timeline) {
            if (e.beat < 0 || e.beat >= loopBeats) {
              bad.push(`${form.name}/${rhythm.name}/${feel.name} 박 범위 ${e.beat}`);
            }
            if (e.drum) {
              if (!["ride", "hat", "kick", "rim", "brush", "snare"].includes(e.drum)) {
                bad.push(`알 수 없는 드럼 ${e.drum}`);
              }
            } else if (!Array.isArray(e.midis) || e.midis.length < 2) {
              bad.push(`${form.name}/${rhythm.name} 코드 음 없음`);
            }
          }
          // 박 순서대로 정렬돼 있어야 스케줄러가 순차 재생한다
          for (let i = 1; i < timeline.length; i++) {
            if (timeline[i].beat < timeline[i - 1].beat) bad.push("정렬 깨짐");
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("다마디 리듬(보사노바)의 히트가 마디마다 고르게 분배된다", () => {
    const bossa = COMP_RHYTHMS.find((r) => r.bars === 2);
    expect(bossa).toBeTruthy();
    // 4마디짜리 폼이면 2마디 패턴이 두 번 돈다 → 마디별 히트 수가 A,B,A,B
    const form = JAM_FORMS[0]; // 메이저 251 = 1+1+2 = 4마디
    const { timeline } = jamTimeline(form, 0, bossa, null);
    const perBar = [0, 0, 0, 0];
    for (const e of timeline) perBar[Math.floor(e.beat / 4)]++;
    expect(perBar[0]).toBe(perBar[2]);
    expect(perBar[1]).toBe(perBar[3]);
    expect(perBar.every((n) => n > 0)).toBe(true);
  });

  it("2마디 드럼 필도 같은 방식으로 분배된다", () => {
    const bossaDrum = DRUM_FEELS.find((f) => f.bars === 2);
    expect(bossaDrum).toBeTruthy();
    const { timeline } = jamTimeline(JAM_FORMS[0], 0, COMP_RHYTHMS[0], bossaDrum);
    const perBar = [0, 0, 0, 0];
    for (const e of timeline) if (e.drum) perBar[Math.floor(e.beat / 4)]++;
    expect(perBar[0]).toBe(perBar[2]);
    expect(perBar[1]).toBe(perBar[3]);
  });

  it("스윙 뒷박은 셋잇단 자리(x.66박)에 놓인다", () => {
    const swing = DRUM_FEELS[0];
    const offs = swing.hits.map((h) => +(h.b % 1).toFixed(2)).filter((x) => x > 0);
    expect(new Set(offs)).toEqual(new Set([0.67]));
  });
});

describe("탭을 옮겨도 잼이 끊기지 않는다", () => {
  let container, root, App, ac;

  beforeEach(async () => {
    vi.resetModules();
    const fake = installFakeAudio();
    App = (await import("../src/App.jsx")).default;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(<App />); });
    ac = fake;
  });
  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
    vi.useRealTimers();
  });

  const btn = (s) => Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes(s));
  const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); }); };
  // 오디오 시계와 스케줄러 타이머를 함께 앞으로 감는다
  const tick = async (times = 8) => {
    for (let i = 0; i < times; i++) {
      ac.instances.forEach((c) => c.advance(0.1));
      await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    }
  };

  it("▶ 재생 → 탭 2번 이동에도 예약이 계속 늘고, ■ 정지 후엔 멈춘다", async () => {
    // 잼 시트 열고 재생
    const bar = Array.from(document.querySelectorAll("div")).find(
      (d) => d.textContent.includes("251 잼 세션") && d.style.cursor === "pointer"
    );
    await click(bar);
    await click(btn("잼 시작"));
    await tick();
    const afterStart = ac.counter.starts;
    expect(afterStart, "재생을 눌렀는데 아무것도 예약되지 않음").toBeGreaterThan(0);

    await click(btn("닫기"));
    await click(btn("코드 사전"));
    await tick();
    const afterTab1 = ac.counter.starts;
    expect(afterTab1, "탭을 옮기자 잼이 멈춤").toBeGreaterThan(afterStart);

    await click(btn("스케일"));
    await tick();
    const afterTab2 = ac.counter.starts;
    expect(afterTab2, "두 번째 탭 이동에서 잼이 멈춤").toBeGreaterThan(afterTab1);

    // 정지
    await click(btn("디코더"));
    const stop = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim() === "■");
    await click(stop);
    const atStop = ac.counter.starts;
    await tick();
    expect(ac.counter.starts, "정지했는데도 계속 예약됨").toBe(atStop);
  });
});
