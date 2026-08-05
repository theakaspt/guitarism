import React from "react";
import { C, QCOLOR } from "../theme.js";

export function ProgRow({ deg, keyData, big }) {
  const size = big ? 17 : 15;
  return (
    <>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, color: C.dim, letterSpacing: "0.06em", marginBottom: 4 }}>
        {deg.map((di) => keyData.chords[di][0]).join("   ›   ")}
      </div>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        {deg.map((di, ci) => (
          <React.Fragment key={ci}>
            <span style={{ fontSize: size, fontWeight: 800, color: QCOLOR[keyData.chords[di][2]] }}>{keyData.chords[di][1]}</span>
            {ci < deg.length - 1 && <span style={{ color: C.dim, fontSize: 13, margin: "0 6px" }}>›</span>}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

export default ProgRow;
