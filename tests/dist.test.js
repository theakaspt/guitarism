// 빌드 산출물 검증 (보고서2 §6-G 승계 · 이슈 #12: React 18은 비동기 렌더라 조금 기다려야 한다)
// dist/ 가 없으면(테스트만 돌린 경우) 조용히 건너뛴다. `npm run verify` 는 빌드 후 실행한다.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");
const has = fs.existsSync(path.join(DIST, "index.html"));

describe.skipIf(!has)("빌드 산출물", () => {
  it("PWA 파일이 전부 만들어졌다", () => {
    for (const f of ["index.html", "sw.js", "manifest.webmanifest", "icon-180.png", "icon-512.png"]) {
      expect(fs.existsSync(path.join(DIST, f)), `${f} 없음`).toBe(true);
    }
  });

  it("매니페스트 내용이 배포본과 같다", () => {
    const m = JSON.parse(fs.readFileSync(path.join(DIST, "manifest.webmanifest"), "utf8"));
    expect(m.name).toBe("기타 이론");
    expect(m.display).toBe("standalone");
    expect(m.theme_color).toBe("#0E1113");
    expect(m.icons.map((i) => i.sizes)).toEqual(["180x180", "512x512"]);
  });

  it("index.html에 iOS 전체화면 메타와 safe-area가 남아 있다", () => {
    const html = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
    expect(html).toContain("apple-mobile-web-app-capable");
    expect(html).toContain("viewport-fit=cover");
    expect(html).toContain("env(safe-area-inset-bottom)");
  });

  it("서비스워커가 빌드마다 새 캐시를 쓴다 (수동 캐시명 변경 불필요)", () => {
    const sw = fs.readFileSync(path.join(DIST, "sw.js"), "utf8");
    // workbox precache 목록에 파일별 해시(revision)가 박혀 있어야 자동 갱신이 된다
    expect(sw).toMatch(/index\.html/);
    expect(sw).toMatch(/revision/);
    // 예전 sw.js의 "실패한 모든 GET → index.html" 폴백이 아니라 내비게이션 전용인지
    expect(sw).toContain("NavigationRoute");
  });

  it("실제로 화면이 그려진다 (3탭 + 잼 바)", async () => {
    const assets = path.join(DIST, "assets");
    const entry = fs.readdirSync(assets).find((f) => /^index-.*\.js$/.test(f));
    expect(entry, "번들 파일을 못 찾음").toBeTruthy();

    document.body.innerHTML = '<div id="root"></div>';
    await import(path.join(assets, entry));
    await new Promise((r) => setTimeout(r, 300)); // React 18 비동기 렌더 대기

    const text = document.body.textContent;
    expect(text).toContain("디코더");
    expect(text).toContain("코드 사전");
    expect(text).toContain("스케일");
    expect(text).toContain("251 잼 세션");
    expect(document.querySelectorAll("svg").length).toBeGreaterThan(3);
    expect(document.querySelectorAll("button").length).toBeGreaterThan(5);
  });
});
