import React, { useState } from "react";
import { C, FS, SP } from "../theme.js";
import { pickTip, termsIn, TERMS } from "../theory/tips.js";

// 닫은 팁은 이 세션 동안만 기억한다.
// 저장하지 않는 이유: 조건이 바뀌면(다른 코드·다른 스케일) 다시 보이는 편이 쓸모 있기 때문이다.
const dismissed = new Set();
export const _resetDismissed = () => dismissed.clear();

// 지금 보고 있는 것에 맞는 한 줄 팁. 화면당 하나, 접혀 있는 게 기본.
export default function TipCard({ where, ctx }) {
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  const tip = pickTip(where, ctx, dismissed);
  if (!tip) return null;

  const terms = open ? termsIn(tip) : [];

  return (
    <div style={{
      marginTop: SP.md, background: C.panel, borderRadius: 12,
      padding: "12px 12px 12px 12px", boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: SP.sm }}>
        <span aria-hidden="true" style={{ fontSize: FS.small, lineHeight: 1.5 }}>💡</span>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{
            flex: 1, minWidth: 0, textAlign: "left", cursor: "pointer",
            background: "transparent", border: "none", padding: 0,
            fontSize: FS.small, lineHeight: 1.5, color: C.text,
            fontFamily: "inherit",
          }}
        >
          {tip.text}
          <span style={{ color: C.dim, marginLeft: SP.xs, fontSize: FS.label }}>{open ? "접기" : "더보기"}</span>
        </button>
        <button
          onClick={() => { dismissed.add(tip.id); force((n) => n + 1); }}
          aria-label="이 팁 닫기"
          style={{
            flexShrink: 0, background: "transparent", border: "none", cursor: "pointer",
            color: C.dim, fontSize: FS.small, padding: "0 4px", lineHeight: 1.5,
          }}
        >
          ✕
        </button>
      </div>

      {open && (
        <div style={{ marginTop: SP.sm, fontSize: FS.small, lineHeight: 1.6, color: C.muted }}>
          {tip.more}
          {terms.length > 0 && (
            <div style={{ marginTop: SP.sm, paddingTop: SP.sm, borderTop: `1px solid ${C.ring}` }}>
              {terms.map((t) => (
                <div key={t} style={{ fontSize: FS.label, color: C.dim, lineHeight: 1.6, marginTop: 2 }}>
                  <b style={{ color: C.muted }}>{t}</b> · {TERMS[t]}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
