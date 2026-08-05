import React from "react";
import { C } from "../theme.js";

export function InfoCard({ label, value, accent }) {
  return (
    <div style={{ background: C.panel, borderRadius: 10, padding: "11px 13px" }}>
      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 9.5, letterSpacing: "0.14em", color: C.dim, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: accent || C.text, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export default InfoCard;
