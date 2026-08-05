import React, { useState, useRef, useEffect } from "react";
import { C } from "../theme.js";


// 세로 휠 셀렉터: 위아래로 돌려 가운데 항목 선택(스냅). 여러 개를 한 줄에 나란히 배치 가능.
// 스크롤 충돌 방지: touchAction pan-y + overscrollBehavior contain
export function VWheel({ items, value, onChange, size = 15 }) {
  const ref = useRef(null);
  const itemRefs = useRef([]);
  const [active, setActive] = useState(value);
  const tmr = useRef(0);
  const ROW = 34, H = 118;
  const centerTo = (i, smooth) => {
    const c = ref.current, el = itemRefs.current[i];
    if (!c || !el) return;
    const top = el.offsetTop + el.offsetHeight / 2 - c.clientHeight / 2;
    if (c.scrollTo) c.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
    else c.scrollTop = top;
  };
  useEffect(() => { setActive(value); centerTo(value, false); }, [value]);
  const nearest = () => {
    const c = ref.current; if (!c) return value;
    const center = c.scrollTop + c.clientHeight / 2;
    let best = value, bd = Infinity;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const d = Math.abs((el.offsetTop + el.offsetHeight / 2) - center);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  };
  const onScroll = () => {
    const n = nearest(); setActive(n);
    clearTimeout(tmr.current);
    tmr.current = setTimeout(() => { const nn = nearest(); if (nn !== value) onChange(nn); }, 130);
  };
  const pad = (H - ROW) / 2;
  return (
    <div style={{ position: "relative", background: C.panel, borderRadius: 12, overflow: "hidden" }}>
      <div ref={ref} className="hwheel" onScroll={onScroll}
        style={{ height: H, overflowY: "auto", scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", touchAction: "pan-y", overscrollBehavior: "contain" }}>
        <div style={{ height: pad }} />
        {items.map((label, i) => {
          const on = i === active;
          return (
            <div key={i} ref={(el) => (itemRefs.current[i] = el)} onClick={() => centerTo(i, true)}
              style={{ height: ROW, display: "flex", alignItems: "center", justifyContent: "center", scrollSnapAlign: "center", cursor: "pointer", whiteSpace: "nowrap", padding: "0 6px", textAlign: "center",
                color: on ? C.brass : C.muted, fontWeight: on ? 800 : 600, fontSize: on ? size : size - 2, opacity: on ? 1 : 0.45, transition: "color .12s, opacity .12s" }}>{label}</div>
          );
        })}
        <div style={{ height: pad }} />
      </div>
      <div style={{ position: "absolute", left: 4, right: 4, top: "50%", height: ROW, marginTop: -ROW / 2, borderTop: `1px solid ${C.ring}`, borderBottom: `1px solid ${C.ring}`, pointerEvents: "none" }} />
    </div>
  );
}

export default VWheel;
