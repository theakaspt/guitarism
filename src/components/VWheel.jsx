import React, { useState, useRef, useEffect, useId } from "react";
import { C } from "../theme.js";


// 세로 휠 셀렉터: 위아래로 돌려 가운데 항목 선택(스냅). 여러 개를 한 줄에 나란히 배치 가능.
// 스크롤 충돌 방지: touchAction pan-y + overscrollBehavior contain
// 접근성: role="listbox" + 위/아래 화살표 키 + aria-activedescendant (Phase 2)
export function VWheel({ items, value, onChange, size = 15, label }) {
  const ref = useRef(null);
  const itemRefs = useRef([]);
  const [active, setActive] = useState(value);
  const tmr = useRef(0);
  const uid = useId();
  const ROW = 34, H = 118;
  const optId = (i) => `${uid}-opt-${i}`;
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
  // 키보드로도 고를 수 있게 (스크린리더·외장 키보드 사용자)
  const goTo = (i) => {
    const n = Math.max(0, Math.min(items.length - 1, i));
    if (n === value) return;
    setActive(n);
    centerTo(n, true);
    onChange(n);
  };
  const onKeyDown = (e) => {
    const k = e.key;
    if (k === "ArrowDown" || k === "ArrowRight") { e.preventDefault(); goTo(value + 1); }
    else if (k === "ArrowUp" || k === "ArrowLeft") { e.preventDefault(); goTo(value - 1); }
    else if (k === "Home") { e.preventDefault(); goTo(0); }
    else if (k === "End") { e.preventDefault(); goTo(items.length - 1); }
    else if (k === "PageDown") { e.preventDefault(); goTo(value + 3); }
    else if (k === "PageUp") { e.preventDefault(); goTo(value - 3); }
  };
  const pad = (H - ROW) / 2;
  return (
    <div style={{ position: "relative", background: C.panel, borderRadius: 12, overflow: "hidden" }}>
      <div ref={ref} className="hwheel" onScroll={onScroll} onKeyDown={onKeyDown}
        role="listbox" tabIndex={0} aria-label={label} aria-activedescendant={optId(value)}
        style={{ height: H, overflowY: "auto", scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", touchAction: "pan-y", overscrollBehavior: "contain" }}>
        <div style={{ height: pad }} />
        {items.map((label, i) => {
          const on = i === active;
          return (
            <div key={i} id={optId(i)} role="option" aria-selected={i === value}
              ref={(el) => (itemRefs.current[i] = el)} onClick={() => centerTo(i, true)}
              style={{ height: ROW, display: "flex", alignItems: "center", justifyContent: "center", scrollSnapAlign: "center", cursor: "pointer", whiteSpace: "nowrap", padding: "0 8px", textAlign: "center",
                color: on ? C.brass : C.muted, fontWeight: on ? 800 : 600, fontSize: on ? size : Math.max(11, size - 2), opacity: on ? 1 : 0.45, transition: "color .12s, opacity .12s" }}>{label}</div>
          );
        })}
        <div style={{ height: pad }} />
      </div>
      <div style={{ position: "absolute", left: 4, right: 4, top: "50%", height: ROW, marginTop: -ROW / 2, borderTop: `1px solid ${C.ring}`, borderBottom: `1px solid ${C.ring}`, pointerEvents: "none" }} />
    </div>
  );
}

export default VWheel;
