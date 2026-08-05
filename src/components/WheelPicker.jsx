import React, { useState, useRef, useEffect, useId } from "react";
import { C } from "../theme.js";

// 가로 휠 셀렉터: 스와이프로 돌려 가운데 항목 선택(스냅). 다이얼 메타포와 통일.
export function WheelPicker({ items, value, onChange, big, label }) {
  const ref = useRef(null);
  const itemRefs = useRef([]);
  const [active, setActive] = useState(value);
  const tmr = useRef(0);
  const uid = useId();
  const optId = (i) => `${uid}-opt-${i}`;
  const centerTo = (i, smooth) => {
    const c = ref.current, el = itemRefs.current[i];
    if (!c || !el) return;
    const left = el.offsetLeft + el.offsetWidth / 2 - c.clientWidth / 2;
    if (c.scrollTo) c.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
    else c.scrollLeft = left;
  };
  useEffect(() => { setActive(value); centerTo(value, false); }, [value]);
  const nearest = () => {
    const c = ref.current; if (!c) return value;
    const center = c.scrollLeft + c.clientWidth / 2;
    let best = value, bd = Infinity;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const d = Math.abs((el.offsetLeft + el.offsetWidth / 2) - center);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  };
  const onScroll = () => {
    const n = nearest(); setActive(n);
    clearTimeout(tmr.current);
    tmr.current = setTimeout(() => { const nn = nearest(); if (nn !== value) onChange(nn); }, 130);
  };
  // 키보드로도 고를 수 있게 (가로 휠이라 좌/우 화살표가 기본)
  const goTo = (i) => {
    const n = Math.max(0, Math.min(items.length - 1, i));
    if (n === value) return;
    setActive(n); centerTo(n, true); onChange(n);
  };
  const onKeyDown = (e) => {
    const k = e.key;
    if (k === "ArrowRight" || k === "ArrowDown") { e.preventDefault(); goTo(value + 1); }
    else if (k === "ArrowLeft" || k === "ArrowUp") { e.preventDefault(); goTo(value - 1); }
    else if (k === "Home") { e.preventDefault(); goTo(0); }
    else if (k === "End") { e.preventDefault(); goTo(items.length - 1); }
  };
  return (
    <div style={{ position: "relative" }}>
      <div ref={ref} className="hwheel" onScroll={onScroll} onKeyDown={onKeyDown}
        role="listbox" tabIndex={0} aria-label={label} aria-activedescendant={optId(value)}
        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", padding: "2px 0", background: C.panel, borderRadius: 12 }}>
        <div style={{ flex: "0 0 44%" }} />
        {items.map((label, i) => {
          const on = i === active;
          return (
            <div key={i} id={optId(i)} role="option" aria-selected={i === value}
              ref={(el) => (itemRefs.current[i] = el)} onClick={() => centerTo(i, true)}
              style={{ scrollSnapAlign: "center", flex: "0 0 auto", padding: "9px 14px", cursor: "pointer", whiteSpace: "nowrap", color: on ? C.brass : C.muted, fontWeight: on ? 800 : 600, fontSize: on ? (big ? 18 : 16) : Math.max(11, 14), opacity: on ? 1 : 0.5, transition: "color .12s, opacity .12s" }}>{label}</div>
          );
        })}
        <div style={{ flex: "0 0 44%" }} />
      </div>
      <div style={{ position: "absolute", left: "50%", top: 4, bottom: 4, width: 40, marginLeft: -20, borderRadius: 8, border: `1px solid ${C.ring}`, pointerEvents: "none" }} />
    </div>
  );
}

export default WheelPicker;
