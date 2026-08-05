import React from "react";
import { C } from "../theme.js";

export const IconWheel = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" /><line x1="12" y1="3" x2="12" y2="7" />
  </svg>
);
export const IconChord = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="5" y="3" width="14" height="18" rx="2" /><line x1="5" y1="9" x2="19" y2="9" /><line x1="5" y1="15" x2="19" y2="15" />
    <line x1="9.7" y1="3" x2="9.7" y2="21" /><line x1="14.3" y1="3" x2="14.3" y2="21" />
    <circle cx="9.7" cy="12" r="1.8" fill="currentColor" stroke="none" />
  </svg>
);
export const IconScale = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <line x1="4" y1="12" x2="20" y2="12" />
    <circle cx="6" cy="12" r="2" fill="currentColor" stroke="none" /><circle cx="12" cy="9" r="2" fill="currentColor" stroke="none" /><circle cx="18" cy="12" r="2" fill="currentColor" stroke="none" />
  </svg>
);

export function TabBar({ tab, setTab }) {
  const tabs = [
    { id: "decoder", label: "디코더", Icon: IconWheel },
    { id: "chords", label: "코드 사전", Icon: IconChord },
    { id: "scales", label: "스케일", Icon: IconScale },
  ];
  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, height: 62, display: "flex", background: C.panel, borderTop: `1px solid ${C.ring}`, zIndex: 50 }}>
      {tabs.map(({ id, label, Icon }) => {
        const on = tab === id;
        return (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: on ? C.brass : C.muted, position: "relative", padding: 0 }}>
            {on && <span style={{ position: "absolute", top: 0, width: 26, height: 2.5, background: C.brass, borderRadius: 2 }} />}
            <Icon />
            <span style={{ fontSize: 11, fontWeight: on ? 700 : 500 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default TabBar;
