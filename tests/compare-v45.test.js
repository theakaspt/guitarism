import { describe, it, expect } from "vitest";
import fs from "node:fs"; import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const btn = (s) => Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes(s));
const divBar = () => Array.from(document.querySelectorAll("div")).find((d) => d.textContent.includes("251 잼 세션") && d.style.cursor === "pointer");
const click = async (el) => { el && el.dispatchEvent(new MouseEvent("click", { bubbles: true })); await sleep(120); };

async function scenario() {
  const snaps = {};
  snaps.초기 = document.body.innerHTML;
  await click(btn("진행 보기"));
  snaps["디코더-진행펼침"] = document.body.innerHTML;
  await click(btn("코드 사전"));
  snaps["코드사전"] = document.body.innerHTML;
  for (const l of ["5번줄 루트", "트라이어드·고음", "탑 4현"]) await click(btn(l));
  snaps["코드사전-보이싱"] = document.body.innerHTML;
  await click(btn("스케일"));
  snaps["스케일"] = document.body.innerHTML;
  await click(btn("코드별 스케일 보기"));
  snaps["스케일-코드별펼침"] = document.body.innerHTML;
  await click(btn("포지션"));
  snaps["스케일-포지션"] = document.body.innerHTML;
  await click(btn("대각선"));
  snaps["스케일-대각선"] = document.body.innerHTML;
  await click(divBar());
  snaps["잼시트"] = document.body.innerHTML;
  return snaps;
}

// v45 배포본과 지금 빌드의 화면을 나란히 비교하는 "참고 도구".
//   npm run compare:v45   ← 이렇게 명시적으로 부를 때만 실행
//
// Phase 0·1까지는 아홉 화면이 글자 단위로 완전히 같았다(이관이 화면을 안 바꿨다는 증거).
// Phase 2부터는 화면을 일부러 바꿨으므로 당연히 달라진다. 그래서 "같아야 한다"고 우기지 않고,
// 어느 화면이 얼마나 달라졌는지 보여 주기만 한다. 실패로 처리하는 건 화면이 아예 안 뜬 경우뿐이다.
describe.skipIf(!process.env.COMPARE_V45)("v45 배포본 대조", () => {
it("아홉 화면이 모두 정상으로 뜨고, v45와의 차이를 보여 준다", async () => {
  document.body.innerHTML = '<div id="root"></div>';
  // eslint-disable-next-line no-eval
  (0, eval)(fs.readFileSync(path.resolve("docs/legacy/bundle.v45.js"), "utf8"));
  await sleep(400);
  const old = await scenario();

  document.body.innerHTML = '<div id="root"></div>';
  const assets = path.resolve("dist/assets");
  const entry = fs.readdirSync(assets).find((f) => /^index-.*\.js$/.test(f));
  await import(path.join(assets, entry));
  await sleep(400);
  const neo = await scenario();

  const diffs = [];
  for (const k of Object.keys(old)) {
    if (old[k] !== neo[k]) diffs.push(`${k}: 구 ${old[k].length}자 / 신 ${neo[k].length}자`);
  }
  console.log("대조한 화면:", Object.keys(old).join(", "));
  console.log(diffs.length ? "차이:\n" + diffs.join("\n") : "모든 화면 HTML 완전 일치");
  // 화면이 아예 비어 있으면(=앱이 죽었으면) 그건 진짜 문제다
  for (const k of Object.keys(neo)) {
    expect(neo[k].length, `${k} 화면이 비어 있음 — 앱이 죽었을 수 있다`).toBeGreaterThan(3000);
  }
  expect(Object.keys(neo).length).toBe(Object.keys(old).length);
});
});
