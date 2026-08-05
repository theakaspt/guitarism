import React from "react";
import { C } from "../theme.js";


// ══════════════════════════════════════════════════════
//  공통 UI
// ══════════════════════════════════════════════════════
export function Screen({ children }) {
  return (
    <div style={{
      background: C.bg,
      minHeight: "100%", color: C.text, padding: "20px 16px 24px", boxSizing: "border-box",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    }}>
      <div style={{ maxWidth: 440, margin: "0 auto", width: "100%" }}>{children}</div>
    </div>
  );
}

export default Screen;
