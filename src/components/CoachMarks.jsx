import React, { useState } from "react";
import { C } from "../theme.js";
import { get, set } from "../storage.js";

// 앱을 처음 켰을 때 딱 한 번 뜨는 안내. 두 군데만 짚는다.
//  ① 다이얼 — 돌려서 키를 바꾼다는 것 (안 알려주면 그냥 그림으로 보인다)
//  ② 잼 바 — 여기서 반주가 계속 돈다는 것 (탭을 옮겨도 살아 있다는 게 이 앱의 핵심)
// 아무 데나 누르면 사라지고 다시 나오지 않는다. "다시 보지 않기" 체크는 두지 않았다.
const FLAG = "ui.coachSeen";

export default function CoachMarks() {
  const [show, setShow] = useState(() => !get(FLAG, false));
  if (!show) return null;

  const dismiss = () => {
    set(FLAG, true);
    setShow(false);
  };

  const bubble = {
    background: C.panel,
    border: `1px solid ${C.brass}`,
    borderRadius: 12,
    padding: "12px 16px",
    maxWidth: 260,
    fontSize: 13,
    lineHeight: 1.5,
    color: C.text,
    boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
  };

  return (
    <div
      onClick={dismiss}
      role="dialog"
      aria-label="처음 오신 분을 위한 안내"
      style={{
        position: "fixed", inset: 0, zIndex: 80,
        background: "rgba(0,0,0,0.62)",
        display: "flex", flexDirection: "column", alignItems: "center",
        cursor: "pointer",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        boxSizing: "border-box", padding: "0 20px",
      }}
    >
      {/* ① 다이얼 — 화면 위쪽 원형 다이얼 자리에 맞춰 놓는다 */}
      <div style={{ marginTop: "45vh", textAlign: "center" }}>
        {/* 화살표는 가리킬 대상(다이얼) 쪽인 위로 — 말풍선 위에 놓는다 */}
        <div aria-hidden="true" style={{ color: C.brass, fontSize: 19, marginBottom: 2 }}>▲</div>
        <div style={bubble}>
          <b style={{ color: C.brass }}>돌려서 키를 바꿔요</b>
          <br />원을 손가락으로 돌리거나, 원하는 키를 톡 누르세요.
        </div>
      </div>

      {/* ② 잼 바 — 화면 아래 미니 플레이어 바로 위 */}
      <div style={{ marginTop: "auto", marginBottom: 120, textAlign: "center" }}>
        <div style={bubble}>
          <b style={{ color: C.brass }}>여기서 반주가 계속 돌아요</b>
          <br />다른 탭으로 옮겨도 멈추지 않습니다. 톡 누르면 키·리듬·음색을 바꿀 수 있어요.
        </div>
        <div aria-hidden="true" style={{ color: C.brass, fontSize: 19, marginTop: 2 }}>▼</div>
      </div>

      <div style={{ position: "absolute", top: 14, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ display: "inline-block", background: "rgba(0,0,0,0.72)", borderRadius: 999, padding: "4px 16px", fontSize: 13, color: C.muted }}>
          아무 곳이나 눌러 시작하기
        </span>
      </div>
    </div>
  );
}
