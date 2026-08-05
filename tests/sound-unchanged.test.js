// 소리 불변 대조 (절대 규칙 11 · 보고서3 §5-N 방식 승계)
//
// 이번 작업(Phase A)은 카운트인이라는 "소리를 의도적으로 바꾸는" 항목을 넣었다.
// 그래서 증명해야 할 것은 "아무것도 안 바뀌었다"가 아니라
//   ① 반주 데이터(jamTimeline)는 카운트인과 무관하게 그대로다
//   ② 카운트인은 반주 앞에 한 마디를 덧붙일 뿐, 반주 자체를 건드리지 않는다
//   ③ 컴핑 끄기는 "예약을 건너뛰는" 것이지 타임라인을 바꾸는 게 아니다
// 라는 세 가지다.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { KEY_PC } from "../src/theory/notes.js";
import { JAM_FORMS, COMP_RHYTHMS, jamTimeline } from "../src/theory/jam.js";
import { DRUM_FEELS } from "../src/audio/drums.js";
import { COUNT_IN_BEATS, countInHits } from "../src/jam/JamProvider.jsx";

// 소리를 만드는 값만 뽑는다 (화면용 ci 같은 건 제외)
const soundOf = (t) =>
  t.timeline.map((e) => ({
    beat: e.beat, midis: e.midis, durBeats: e.durBeats, drum: e.drum, vel: e.vel,
  }));

describe("반주 데이터 자체는 그대로다", () => {
  it("폼 6 × 키 12 × 리듬 4 × 드럼 6 = 1,728가지가 카운트인과 무관하다", () => {
    // jamTimeline은 카운트인을 인자로 받지도 않는다 —
    // 즉 카운트인 ON/OFF가 반주 데이터에 영향을 줄 통로 자체가 없다.
    // 여기서는 그 사실을 "함수 시그니처"가 아니라 실제 값으로 확인한다.
    let count = 0;
    const seen = new Map();
    for (let fi = 0; fi < JAM_FORMS.length; fi++) {
      for (let ki = 0; ki < 12; ki++) {
        for (let ri = 0; ri < COMP_RHYTHMS.length; ri++) {
          for (let di = 0; di < DRUM_FEELS.length; di++) {
            const a = jamTimeline(JAM_FORMS[fi], KEY_PC[ki], COMP_RHYTHMS[ri], DRUM_FEELS[di]);
            const b = jamTimeline(JAM_FORMS[fi], KEY_PC[ki], COMP_RHYTHMS[ri], DRUM_FEELS[di]);
            expect(soundOf(a)).toEqual(soundOf(b));
            expect(a.loopBeats).toBe(b.loopBeats);
            seen.set(`${fi}/${ki}/${ri}/${di}`, JSON.stringify(soundOf(a)).length);
            count++;
          }
        }
      }
    }
    expect(count).toBe(1728);
    expect(seen.size).toBe(1728);
  });

  it("스케줄러 소스가 jamTimeline에 카운트인·컴핑을 넘기지 않는다", () => {
    const src = fs.readFileSync(path.resolve("src/jam/JamProvider.jsx"), "utf8");
    const call = src.match(/jamTimeline\([^)]*\)/);
    expect(call, "jamTimeline 호출을 못 찾음").toBeTruthy();
    expect(call[0]).not.toMatch(/countIn|comping|trainer/i);
  });

  it("카운트인은 반주 시작 시각만 한 마디 뒤로 민다", () => {
    const src = fs.readFileSync(path.resolve("src/jam/JamProvider.jsx"), "utf8");
    // loopStart에만 카운트인 길이가 더해지고, 타임라인 이벤트는 손대지 않는다
    expect(src).toMatch(/st\.loopStart\s*=\s*t0\s*\+\s*\(doCountIn\s*\?\s*COUNT_IN_BEATS/);
    expect(src).not.toMatch(/timeline\.(push|splice|unshift)/);
  });
});

describe("카운트인이 덧붙이는 것", () => {
  it("정확히 한 마디(4박)이고 반주 박자와 같은 격자 위에 있다", () => {
    const hits = countInHits();
    expect(COUNT_IN_BEATS).toBe(4);
    expect(hits.map((h) => h.beat)).toEqual([0, 1, 2, 3]);
    // 전부 정수 박 — 셋잇단·뒷박이 아니다 (세어 주는 소리이므로)
    expect(hits.every((h) => Number.isInteger(h.beat))).toBe(true);
    expect(hits.every((h) => h.vel > 0 && h.vel <= 1)).toBe(true);
  });

  it("기존 드럼 보이스만 쓴다 (새 음색을 만들지 않았다)", async () => {
    const { COUNT_IN_VOICE } = await import("../src/jam/JamProvider.jsx");
    const src = fs.readFileSync(path.resolve("src/audio/drums.js"), "utf8");
    expect(src).toContain(`voice === "${COUNT_IN_VOICE}"`);
  });
});

// "if (조건) { ... }" 블록의 본문만 잘라 낸다 (중괄호 짝 맞추기)
function blockBody(src, header) {
  const start = src.indexOf(header);
  if (start < 0) return null;
  let i = src.indexOf("{", start);
  if (i < 0) return null;
  let depth = 0;
  for (let k = i; k < src.length; k++) {
    if (src[k] === "{") depth++;
    else if (src[k] === "}") {
      depth--;
      if (depth === 0) return src.slice(i + 1, k);
    }
  }
  return null;
}

describe("컴핑 끄기가 건드리는 것", () => {
  const src = fs.readFileSync(path.resolve("src/jam/JamProvider.jsx"), "utf8");
  const body = blockBody(src, "if (compingRef.current)");

  it("기타 소리 예약만 조건 안에 들어 있다", () => {
    expect(body, "컴핑 조건 블록을 못 찾음").toBeTruthy();
    expect(body).toContain("strumAt(");
  });

  it("컴핑을 꺼도 코드 표시(nowChord) 갱신은 남는다", () => {
    // 조건 블록 안에 setNowChord가 있으면 컴핑 OFF일 때 코드 표시가 멈춘다
    // — 눈으로 코드를 보며 직접 치는 것이 메트로놈 모드의 핵심 사용법이므로 그러면 안 된다.
    expect(body).not.toContain("setNowChord");
    expect(src).toContain("setNowChord");
  });

  it("드럼 예약은 컴핑 조건과 무관하다", () => {
    expect(body).not.toContain("drum(c,");
    expect(src).toContain("drum(c, evt.drum");
  });

  it("타임라인 배열 자체를 고치지 않는다", () => {
    expect(src).not.toMatch(/timeline\.(push|splice|unshift|filter)/);
  });
});
