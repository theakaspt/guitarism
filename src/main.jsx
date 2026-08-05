import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import UpdateToast from "./UpdateToast.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// StrictMode는 켜지 않는다.
// 개발 모드에서 이펙트를 일부러 두 번 실행하는데, 잼 스케줄러가 그 영향으로
// 잠깐 두 번 예약될 수 있어 "지금 배포본과 동일하게"라는 이관 원칙에 어긋난다.
createRoot(document.getElementById("root")).render(
  <>
    {/* 최상위 안전망 — 여기까지 오면 앱 전체가 멈춘 경우다 */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <UpdateToast />
  </>
);
