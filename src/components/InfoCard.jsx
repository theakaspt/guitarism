import React from "react";
import { C } from "../theme.js";

export function InfoCard({ label, value, accent }) {
  return (
    <div style={{ background: C.panel, borderRadius: 10, padding: "12px 12px" }}>
      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 11, letterSpacing: "0.1em", color: C.dim, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: accent || C.text, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export default InfoCard;
