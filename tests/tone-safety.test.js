// 소리 안전 검사 — 보고서2 §6-E 승계 (이슈 #9 노이즈, #10 클리핑)
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { installFakeAudio } from "./helpers/fakeAudio.js";

const AUDIO_DIR = path.resolve("src/audio");
const readAll = () =>
  fs.readdirSync(AUDIO_DIR)
    .filter((f) => f.endsWith(".js"))
    .map((f) => [f, fs.readFileSync(path.join(AUDIO_DIR, f), "utf8")]);

describe("엔벨로프 안전 (이슈 #9)", () => {
  it("gain.value를 '읽어서' 스케줄하는 코드가 없다", () => {
    // 허용: g.gain.value = 0.5 (대입)
    // 금지: g.gain.setValueAtTime(g.gain.value, t) — 현재값(0)을 읽어 릴리스가 0으로 점프 → 클릭 노이즈
    const bad = [];
    for (const [file, src] of readAll()) {
      src.split("\n").forEach((line, i) => {
        // 대입(= 한 개)은 먼저 지운다. 남은 .gain.value 는 전부 "읽기"다.
        const rest = line.replace(/\.gain\.value\s*=(?![=>])/g, "");
        if (/\.gain\.value/.test(rest)) bad.push(`${file}:${i + 1} ${line.trim()}`);
      });
    }
    expect(bad).toEqual([]);
  });

  it("엔벨로프가 0이 아닌 값에서 시작한다 (exponentialRamp는 0을 못 씀)", () => {
    const bad = [];
    for (const [file, src] of readAll()) {
      src.split("\n").forEach((line, i) => {
        if (/exponentialRampToValueAtTime\(\s*0\s*,/.test(line)) bad.push(`${file}:${i + 1}`);
        if (/setValueAtTime\(\s*0\s*,/.test(line) && /gain/.test(line)) bad.push(`${file}:${i + 1}`);
      });
    }
    expect(bad).toEqual([]);
  });
});

describe("출력 경로 (이슈 #10)", () => {
  it("c.destination 직결은 master() 안의 한 곳뿐이다", () => {
    let hits = [];
    for (const [file, src] of readAll()) {
      src.split("\n").forEach((line, i) => {
        if (/\.destination/.test(line)) hits.push(`${file}:${i + 1} ${line.trim()}`);
      });
    }
    expect(hits.length, hits.join("\n")).toBe(1);
    expect(hits[0]).toMatch(/^context\.js:/);
    expect(hits[0]).toContain("lim.connect(c.destination)");
  });

  it("모든 음색·드럼이 master(c)를 거친다", () => {
    for (const [file, src] of readAll()) {
      if (file === "context.js" || file === "play.js") continue;
      expect(src, `${file}에 master(c) 연결이 없음`).toContain("master(c)");
    }
  });

  it("마스터 버스에 리미터가 걸려 있다", async () => {
    installFakeAudio();
    const { AC, master } = await import("../src/audio/context.js");
    const c = AC();
    const bus = master(c);
    expect(bus).toBeTruthy();
    const lim = c.constructor.lastCompressor || Object.getPrototypeOf(c).constructor.lastCompressor;
    const comp = lim || globalThis.window.AudioContext.lastCompressor;
    expect(comp, "DynamicsCompressor(리미터)가 만들어지지 않음").toBeTruthy();
    expect(comp.threshold.value).toBeLessThanOrEqual(-6);
    expect(comp.ratio.value).toBeGreaterThanOrEqual(8);
  });
});

describe("동시 타격 합산", () => {
  it("어떤 드럼 필도 한 박에 몰린 세기 합이 한계를 넘지 않는다", async () => {
    const { DRUM_FEELS } = await import("../src/audio/drums.js");
    // drum()에 코딩된 보이스별 최대 게인 (같은 값을 여기 적어 두고, 바뀌면 테스트가 잡는다)
    const PEAK = { ride: 0.09 * (1 + 1 / 2 + 1 / 3 + 1 / 4 + 1 / 5) + 0.08, hat: 0.28, kick: 0.85, rim: 0.7 + 0.19, brush: 0.23, snare: 0.26 };
    const worst = [];
    for (const feel of DRUM_FEELS) {
      const byBeat = {};
      for (const h of feel.hits) {
        const v = h.vel == null ? 1 : h.vel;
        byBeat[h.b] = (byBeat[h.b] || 0) + PEAK[h.v] * v;
      }
      worst.push({ name: feel.name, max: Math.max(...Object.values(byBeat)) });
    }
    for (const w of worst) {
      // 리미터(threshold -6dB, ratio 12)가 뒤를 받치지만, 입력 자체가 2.0을 넘으면
      // 리미터로도 음색이 뭉개진다. 여기서 걸리면 볼륨 밸런스를 다시 봐야 한다.
      expect(w.max, `${w.name} 동시 타격 합 ${w.max.toFixed(2)}`).toBeLessThan(2.0);
    }
  });
});
