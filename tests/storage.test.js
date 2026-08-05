// 설정 저장 계층 검사 (작업지시서 Phase 1-1)
// 핵심: 저장이 막히거나 값이 깨져도 앱이 죽지 않아야 한다.
import { describe, it, expect, vi, afterEach } from "vitest";
import { get, set, clearAll, _resetCache, intIn, intInOrNull, oneOf } from "../src/storage.js";

const flush = () => new Promise((r) => setTimeout(r, 200)); // 저장은 120ms 모아서 쓴다

afterEach(() => {
  vi.restoreAllMocks();
  _resetCache();
});

describe("읽기·쓰기", () => {
  it("저장한 값을 다시 읽을 수 있다", async () => {
    set("jam.bpm", 144);
    expect(get("jam.bpm", 120)).toBe(144);
    await flush();
    _resetCache(); // 앱을 껐다 켠 상황
    expect(get("jam.bpm", 120)).toBe(144);
  });

  it("저장한 적 없는 값은 기본값이 나온다", () => {
    expect(get("없는키", "기본")).toBe("기본");
  });

  it("null도 제대로 저장된다 (슬래시 베이스 '없음')", async () => {
    set("chord.bass", null);
    await flush();
    _resetCache();
    expect(get("chord.bass", 5)).toBe(null);
  });

  it("clearAll 하면 전부 사라진다", async () => {
    set("a", 1); await flush();
    clearAll();
    _resetCache();
    expect(get("a", "없음")).toBe("없음");
  });
});

describe("망가진 저장값 대응", () => {
  it("JSON이 깨져 있으면 무시하고 기본값으로 시작한다", () => {
    localStorage.setItem("guitarism", "{이건 JSON이 아님");
    _resetCache();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(get("jam.bpm", 120)).toBe(120);
    expect(warn).toHaveBeenCalled();
  });

  it("저장 형식 버전이 다르면 무시한다", () => {
    localStorage.setItem("guitarism", JSON.stringify({ v: 999, d: { "jam.bpm": 200 } }));
    _resetCache();
    expect(get("jam.bpm", 120)).toBe(120);
  });

  it("저장 자체가 막혀 있어도(시크릿 모드 등) 에러가 나지 않는다", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => set("jam.bpm", 160)).not.toThrow();
    await flush();
    // 이번 실행 중에는 기억하고 있다 (다음 실행 때 복원이 안 될 뿐)
    expect(get("jam.bpm", 120)).toBe(160);
  });
});

describe("값 검사기 — 목록이 줄어도 앱이 안 깨진다", () => {
  it("intIn: 범위 밖 숫자는 버린다", () => {
    expect(intIn(0, 11)(5)).toBe(5);
    expect(intIn(0, 11)(12)).toBe(undefined);
    expect(intIn(0, 11)(-1)).toBe(undefined);
    expect(intIn(0, 11)(1.5)).toBe(undefined);
    expect(intIn(0, 11)("3")).toBe(undefined);
  });

  it("intInOrNull: null은 통과시킨다", () => {
    expect(intInOrNull(0, 11)(null)).toBe(null);
    expect(intInOrNull(0, 11)(3)).toBe(3);
    expect(intInOrNull(0, 11)(99)).toBe(undefined);
  });

  it("oneOf: 목록에 없는 값은 버린다", () => {
    expect(oneOf(["deg", "note"])("note")).toBe("note");
    expect(oneOf(["deg", "note"])("없는모드")).toBe(undefined);
  });

  it("옛 저장값이 지금 목록을 벗어나면 기본값으로 돌아간다", () => {
    // 스케일이 13종일 때 12번을 저장했는데, 나중에 10종으로 줄어든 상황
    localStorage.setItem("guitarism", JSON.stringify({ v: 1, d: { "scale.index": 12 } }));
    _resetCache();
    const saved = get("scale.index", 3);
    expect(intIn(0, 9)(saved)).toBe(undefined); // 검사기가 걸러 낸다
  });
});
