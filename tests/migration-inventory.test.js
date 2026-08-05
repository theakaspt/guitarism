// 이관 전수 대조표 (절대 규칙 9 — 이슈 #7: 정규식 삭제가 인접 컴포넌트까지 지운 사고)
// 이관 전 단일 파일(docs/legacy/guitar-theory-app.v45.jsx)의 최상위 선언이
// 분할 후 src/ 어딘가에 하나도 빠짐없이 있는지 확인한다.
import { describe, it, expect } from "vitest";
import { legacyNames, srcNames, ADDED_IN_MIGRATION } from "../tools/inventory.mjs";

describe("이관 전수 대조", () => {
  const before = legacyNames();
  const after = srcNames();

  it("이관 전 최상위 선언이 하나도 빠지지 않았다", () => {
    const missing = before.filter((n) => !after.has(n));
    expect(missing, `사라진 선언: ${missing.join(", ")}`).toEqual([]);
  });

  it("새로 생긴 선언은 미리 적어 둔 것뿐이다 (모르는 사이 늘어난 코드 없음)", () => {
    const added = [...after].filter((n) => !before.includes(n)).sort();
    expect(added).toEqual([...ADDED_IN_MIGRATION].sort());
  });

  it("이관 전 파일의 규모가 알려진 값과 같다 (원본이 바뀌면 대조가 무의미해짐)", () => {
    expect(before.length).toBe(106);
  });
});
