import React from "react";
import { C } from "../theme.js";

export function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 11, letterSpacing: "0.14em", color: C.dim, textTransform: "uppercase" }}>{children}</div>
  );
}

export default SectionLabel;
