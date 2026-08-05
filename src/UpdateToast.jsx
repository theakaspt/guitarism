import React from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { C } from "./theme.js";

// 새 버전이 올라오면 아래쪽에 작은 알림을 띄운다.
// 자동으로 새로고침하지 않는 이유: 잼이 도는 도중에 화면이 새로고침되면 반주가 끊긴다.
// 그래서 "준비됐어요 → 새로고침" 버튼을 눌러 직접 고르게 했다.
export default function UpdateToast() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // 한 시간에 한 번 새 버전이 있는지 확인
      if (r) setInterval(() => r.update(), 60 * 60 * 1000);
    },
  });
  if (!needRefresh) return null;
  return (
    <div style={{ position: "fixed", left: 12, right: 12, bottom: 118, zIndex: 70, background: C.panel, border: `1px solid ${C.brass}`, borderRadius: 12, padding: "11px 13px", display: "flex", alignItems: "center", gap: 10, maxWidth: 416, margin: "0 auto", boxSizing: "border-box", fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      <span style={{ fontSize: 13, color: C.text, flex: 1 }}>새 버전이 준비됐어요</span>
      <button onClick={() => updateServiceWorker(true)} style={{ padding: "6px 14px", borderRadius: 999, cursor: "pointer", fontSize: 12.5, fontWeight: 800, background: C.brass, color: C.bg, border: "none" }}>새로고침</button>
      <button onClick={() => setNeedRefresh(false)} style={{ padding: "6px 8px", borderRadius: 999, cursor: "pointer", fontSize: 12.5, fontWeight: 600, background: "transparent", color: C.muted, border: "none" }}>나중에</button>
    </div>
  );
}
