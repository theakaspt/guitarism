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

// 이관(Phase 0) 전용 대조. 기능을 바꾸기 시작하면 당연히 달라지므로 평소엔 건너뛴다.
//   npm run compare:v45   ← 이렇게 명시적으로 부를 때만 실행
describe.skipIf(!process.env.COMPARE_V45)("v45 배포본 대조", () => {
it("아홉 화면의 HTML이 v45 배포본과 완전히 같다", async () => {
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
  if (diffs.length) {
    for (const k of Object.keys(old)) if (old[k] !== neo[k]) {
      fs.writeFileSync(`/tmp/work/diff-old-${k}.html`, old[k]);
      fs.writeFileSync(`/tmp/work/diff-new-${k}.html`, neo[k]);
    }
  }
  expect(diffs).toEqual([]);
});
});
